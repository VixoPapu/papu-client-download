import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getExtraRoot } from "./paths.js";

type ChatConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type ChatIdentity = {
  name: string;
  uuid: string;
};

export type ChatFriend = {
  id: string;
  name: string;
  avatarUrl: string;
  state: string;
  status: "online" | "away" | "busy" | "offline";
  unread: number;
};

export type ChatRequest = {
  id: string;
  name: string;
  avatarUrl: string;
  direction: "incoming" | "outgoing";
};

export type ChatMessage = {
  author: "self" | "friend";
  text: string;
  time: string;
};

export type ChatCallState = {
  sessionId: string;
  friendId: string;
  startedAt: number;
  isCaller: boolean;
  status: "ringing" | "active";
} | null;

export type ChatCallSignal = {
  id: number;
  sessionId: string;
  fromId: string;
  toId: string;
  type: "offer" | "answer" | "ice-candidate" | "hangup";
  payload: Record<string, unknown>;
};

type ChatState = {
  enabled: boolean;
  friends: ChatFriend[];
  requests: ChatRequest[];
  messages: ChatMessage[];
  activeCall: ChatCallState;
};

let chatClientPromise: Promise<SupabaseClient | null> | null = null;

function normalizeAccountId(value: string): string {
  return value.trim().toLowerCase();
}

async function readChatConfig(): Promise<ChatConfig | null> {
  const directUrl = process.env.PAPU_SUPABASE_URL?.trim();
  const directKey = process.env.PAPU_SUPABASE_ANON_KEY?.trim();
  if (directUrl && directKey) {
    return { supabaseUrl: directUrl, supabaseAnonKey: directKey };
  }

  const configPath = path.join(getExtraRoot(), "chat.config.json");
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ChatConfig>;
    if (parsed.supabaseUrl && parsed.supabaseAnonKey) {
      return { supabaseUrl: parsed.supabaseUrl, supabaseAnonKey: parsed.supabaseAnonKey };
    }
  } catch {
    return null;
  }
  return null;
}

async function getChatClient(): Promise<SupabaseClient | null> {
  if (!chatClientPromise) {
    chatClientPromise = (async () => {
      const config = await readChatConfig();
      if (!config) return null;
      return createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    })();
  }
  return chatClientPromise;
}

async function ensureProfile(client: SupabaseClient, identity: ChatIdentity): Promise<void> {
  const profileId = normalizeAccountId(identity.name);
  const { error } = await client.from("profiles").upsert({
    id: profileId,
    username: identity.name,
    uuid: identity.uuid,
    avatar_url: `https://mc-heads.net/avatar/${identity.uuid}/64`,
    status: "online"
  });
  if (error) throw new Error(`No se pudo sincronizar perfil de chat: ${error.message}`);
}

async function areFriends(client: SupabaseClient, selfId: string, friendId: string): Promise<boolean> {
  const { data, error } = await client
    .from("friend_links")
    .select("owner_id")
    .eq("owner_id", selfId)
    .eq("friend_id", friendId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo validar amistad: ${error.message}`);
  return Boolean(data);
}

async function fetchFriends(client: SupabaseClient, identity: ChatIdentity): Promise<ChatFriend[]> {
  const profileId = normalizeAccountId(identity.name);
  const { data, error } = await client
    .from("friend_links")
    .select("friend_id, profiles!friend_links_friend_id_fkey(id, username, avatar_url, status)")
    .eq("owner_id", profileId);

  if (error) throw new Error(`No se pudo cargar la lista de amigos: ${error.message}`);

  return (data || []).map((row: any) => ({
    id: String(row.friend_id),
    name: String(row.profiles?.username || row.friend_id),
    avatarUrl: String(row.profiles?.avatar_url || `https://mc-heads.net/avatar/${encodeURIComponent(row.friend_id)}/64`),
    state: row.profiles?.status === "online" ? "Disponible en PapuClient" : "Desconectado",
    status: row.profiles?.status || "offline",
    unread: 0
  }));
}

async function fetchRequests(client: SupabaseClient, identity: ChatIdentity): Promise<ChatRequest[]> {
  const profileId = normalizeAccountId(identity.name);
  const [incomingResult, outgoingResult] = await Promise.all([
    client
      .from("friend_requests")
      .select("sender_id, profiles!friend_requests_sender_id_fkey(id, username, avatar_url)")
      .eq("recipient_id", profileId)
      .eq("status", "pending"),
    client
      .from("friend_requests")
      .select("recipient_id, profiles!friend_requests_recipient_id_fkey(id, username, avatar_url)")
      .eq("sender_id", profileId)
      .eq("status", "pending")
  ]);

  if (incomingResult.error) throw new Error(`No se pudieron cargar solicitudes: ${incomingResult.error.message}`);
  if (outgoingResult.error) throw new Error(`No se pudieron cargar solicitudes: ${outgoingResult.error.message}`);

  const incoming = (incomingResult.data || []).map((row: any) => ({
    id: String(row.sender_id),
    name: String(row.profiles?.username || row.sender_id),
    avatarUrl: String(row.profiles?.avatar_url || `https://mc-heads.net/avatar/${encodeURIComponent(row.sender_id)}/64`),
    direction: "incoming" as const
  }));

  const outgoing = (outgoingResult.data || []).map((row: any) => ({
    id: String(row.recipient_id),
    name: String(row.profiles?.username || row.recipient_id),
    avatarUrl: String(row.profiles?.avatar_url || `https://mc-heads.net/avatar/${encodeURIComponent(row.recipient_id)}/64`),
    direction: "outgoing" as const
  }));

  return [...incoming, ...outgoing];
}

async function fetchMessages(client: SupabaseClient, identity: ChatIdentity, friendId: string): Promise<ChatMessage[]> {
  const profileId = normalizeAccountId(identity.name);
  if (!(await areFriends(client, profileId, friendId))) return [];

  const { data, error } = await client
    .from("messages")
    .select("sender_id, recipient_id, body, created_at")
    .or(`and(sender_id.eq.${profileId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${profileId})`)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(`No se pudieron cargar mensajes: ${error.message}`);

  return (data || []).map((entry: any) => ({
    author: entry.sender_id === profileId ? "self" : "friend",
    text: String(entry.body || ""),
    time: new Date(entry.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
  }));
}

async function fetchCallState(client: SupabaseClient, identity: ChatIdentity, friendId: string): Promise<ChatCallState> {
  const profileId = normalizeAccountId(identity.name);
  if (!(await areFriends(client, profileId, friendId))) return null;

  const { data, error } = await client
    .from("call_sessions")
    .select("id, caller_id, recipient_id, started_at, ended_at, status, answered_at")
    .is("ended_at", null)
    .in("status", ["ringing", "active"])
    .or(`and(caller_id.eq.${profileId},recipient_id.eq.${friendId}),and(caller_id.eq.${friendId},recipient_id.eq.${profileId})`)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el estado de llamada: ${error.message}`);
  if (!data) return null;

  return {
    sessionId: String(data.id),
    friendId,
    startedAt: new Date(data.started_at).getTime(),
    isCaller: data.caller_id === profileId,
    status: data.status === "active" ? "active" : "ringing"
  };
}

async function cleanupStaleCallSessions(client: SupabaseClient, identity: ChatIdentity): Promise<void> {
  const profileId = normalizeAccountId(identity.name);
  const now = Date.now();
  const { data, error } = await client
    .from("call_sessions")
    .select("id, started_at, status, answered_at")
    .is("ended_at", null)
    .or(`caller_id.eq.${profileId},recipient_id.eq.${profileId}`)
    .in("status", ["ringing", "active"])
    .limit(25);

  if (error || !data?.length) return;

  const staleIds = data
    .filter((entry: any) => {
      const startedAt = new Date(entry.started_at).getTime();
      const answeredAt = entry.answered_at ? new Date(entry.answered_at).getTime() : 0;
      if (entry.status === "ringing") {
        return now - startedAt > 90 * 1000;
      }
      if (entry.status === "active" && !answeredAt) {
        return now - startedAt > 90 * 1000;
      }
      return false;
    })
    .map((entry: any) => entry.id);

  if (!staleIds.length) return;

  await client
    .from("call_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .in("id", staleIds);
}

export async function getChatStatus(): Promise<{ enabled: boolean }> {
  const client = await getChatClient();
  return { enabled: Boolean(client) };
}

export async function syncChatState(identity: ChatIdentity, selectedFriendId: string): Promise<ChatState> {
  const client = await getChatClient();
  if (!client) return { enabled: false, friends: [], requests: [], messages: [], activeCall: null };

  await ensureProfile(client, identity);
  await cleanupStaleCallSessions(client, identity);
  const [friends, requests] = await Promise.all([
    fetchFriends(client, identity),
    fetchRequests(client, identity)
  ]);
  const targetId = selectedFriendId || friends[0]?.id || "";
  const messages = targetId ? await fetchMessages(client, identity, targetId) : [];
  const activeCall = targetId ? await fetchCallState(client, identity, targetId) : null;

  return { enabled: true, friends, requests, messages, activeCall };
}

export async function addChatFriend(identity: ChatIdentity, accountName: string): Promise<void> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar amigos online.");

  await ensureProfile(client, identity);
  const selfId = normalizeAccountId(identity.name);
  const friendId = normalizeAccountId(accountName);
  if (!friendId) throw new Error("Cuenta invalida.");
  if (friendId === selfId) throw new Error("No puedes agregarte a ti mismo.");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, username")
    .eq("id", friendId)
    .maybeSingle();

  if (profileError) throw new Error(`No se pudo buscar la cuenta: ${profileError.message}`);
  if (!profile) throw new Error("La cuenta todavia no ingreso al launcher.");
  if (await areFriends(client, selfId, friendId)) throw new Error("Ya son amigos.");

  const { data: existing, error: existingError } = await client
    .from("friend_requests")
    .select("id, sender_id, recipient_id, status")
    .or(`and(sender_id.eq.${selfId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${selfId})`)
    .in("status", ["pending", "accepted"])
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(`No se pudo validar solicitud: ${existingError.message}`);
  if (existing?.status === "pending") {
    if (existing.sender_id === friendId && existing.recipient_id === selfId) {
      throw new Error("Tienes una solicitud pendiente de esta cuenta. Aceptala desde Solicitudes.");
    }
    throw new Error("Ya enviaste una solicitud a esta cuenta.");
  }

  const { error } = await client.from("friend_requests").insert({
    sender_id: selfId,
    recipient_id: friendId,
    status: "pending"
  });

  if (error) throw new Error(`No se pudo enviar la solicitud: ${error.message}`);
}

export async function respondChatFriendRequest(identity: ChatIdentity, friendId: string, action: "accept" | "reject"): Promise<void> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar solicitudes.");

  const selfId = normalizeAccountId(identity.name);
  const { data: request, error: requestError } = await client
    .from("friend_requests")
    .select("sender_id, recipient_id, status")
    .eq("sender_id", friendId)
    .eq("recipient_id", selfId)
    .eq("status", "pending")
    .maybeSingle();

  if (requestError) throw new Error(`No se pudo cargar la solicitud: ${requestError.message}`);
  if (!request) throw new Error("La solicitud ya no esta disponible.");

  if (action === "accept") {
    const { error: linksError } = await client.from("friend_links").upsert([
      { owner_id: selfId, friend_id: friendId },
      { owner_id: friendId, friend_id: selfId }
    ]);
    if (linksError) throw new Error(`No se pudo aceptar la solicitud: ${linksError.message}`);
  }

  const { error } = await client
    .from("friend_requests")
    .update({ status: action === "accept" ? "accepted" : "rejected", responded_at: new Date().toISOString() })
    .eq("sender_id", friendId)
    .eq("recipient_id", selfId)
    .eq("status", "pending");

  if (error) throw new Error(`No se pudo responder la solicitud: ${error.message}`);
}

export async function sendChatMessageRemote(identity: ChatIdentity, friendId: string, text: string): Promise<void> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar mensajes online.");
  const selfId = normalizeAccountId(identity.name);
  if (!(await areFriends(client, selfId, friendId))) throw new Error("Debes aceptar la solicitud antes de chatear.");
  const body = text.trim();
  if (!body) return;

  const { error } = await client.from("messages").insert({
    sender_id: selfId,
    recipient_id: friendId,
    body
  });

  if (error) throw new Error(`No se pudo enviar el mensaje: ${error.message}`);
}

export async function toggleChatCallRemote(identity: ChatIdentity, friendId: string): Promise<ChatCallState> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar llamadas.");
  const selfId = normalizeAccountId(identity.name);
  if (!(await areFriends(client, selfId, friendId))) throw new Error("Debes aceptar la solicitud antes de llamar.");
  const active = await fetchCallState(client, identity, friendId);

  if (active) {
    const { error } = await client
      .from("call_sessions")
      .update({ ended_at: new Date().toISOString(), status: "ended" })
      .is("ended_at", null)
      .or(`and(caller_id.eq.${selfId},recipient_id.eq.${friendId}),and(caller_id.eq.${friendId},recipient_id.eq.${selfId})`);
    if (error) throw new Error(`No se pudo finalizar la llamada: ${error.message}`);
    return null;
  }

  const now = new Date().toISOString();
  const { data, error } = await client.from("call_sessions").insert({
    caller_id: selfId,
    recipient_id: friendId,
    started_at: now,
    status: "ringing"
  }).select("id").single();
  if (error) throw new Error(`No se pudo iniciar la llamada: ${error.message}`);

  return {
    sessionId: String(data.id),
    friendId,
    startedAt: new Date(now).getTime(),
    isCaller: true,
    status: "ringing"
  };
}

export async function respondChatCallRemote(identity: ChatIdentity, input: { friendId: string; action: "accept" | "reject" }): Promise<ChatCallState> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar llamadas.");
  const selfId = normalizeAccountId(identity.name);

  const { data: session, error: sessionError } = await client
    .from("call_sessions")
    .select("id, caller_id, recipient_id, started_at, status")
    .eq("caller_id", input.friendId)
    .eq("recipient_id", selfId)
    .is("ended_at", null)
    .eq("status", "ringing")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) throw new Error(`No se pudo cargar la llamada entrante: ${sessionError.message}`);
  if (!session) throw new Error("La llamada ya no esta disponible.");

  if (input.action === "reject") {
    const { error } = await client
      .from("call_sessions")
      .update({ status: "rejected", ended_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) throw new Error(`No se pudo rechazar la llamada: ${error.message}`);
    await client.from("call_signals").insert({
      session_id: session.id,
      from_id: selfId,
      to_id: input.friendId,
      signal_type: "hangup",
      payload: { reason: "rejected" }
    });
    return null;
  }

  const answeredAt = new Date().toISOString();
  const { error } = await client
    .from("call_sessions")
    .update({ status: "active", answered_at: answeredAt })
    .eq("id", session.id);
  if (error) throw new Error(`No se pudo aceptar la llamada: ${error.message}`);

  return {
    sessionId: String(session.id),
    friendId: input.friendId,
    startedAt: new Date(session.started_at).getTime(),
    isCaller: false,
    status: "active"
  };
}

export async function fetchChatCallSignals(identity: ChatIdentity, input: { sessionId: string; friendId: string; afterId: number }): Promise<ChatCallSignal[]> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar llamadas.");
  const selfId = normalizeAccountId(identity.name);
  if (!(await areFriends(client, selfId, input.friendId))) return [];

  const { data, error } = await client
    .from("call_signals")
    .select("id, session_id, from_id, to_id, signal_type, payload")
    .eq("session_id", input.sessionId)
    .or(`from_id.eq.${selfId},to_id.eq.${selfId}`)
    .gt("id", Number(input.afterId || 0))
    .order("id", { ascending: true })
    .limit(50);

  if (error) throw new Error(`No se pudieron cargar senales de llamada: ${error.message}`);

  return (data || []).map((entry: any) => ({
    id: Number(entry.id),
    sessionId: String(entry.session_id),
    fromId: String(entry.from_id),
    toId: String(entry.to_id),
    type: String(entry.signal_type),
    payload: entry.payload && typeof entry.payload === "object" ? entry.payload : {}
  })) as ChatCallSignal[];
}

export async function sendChatCallSignal(
  identity: ChatIdentity,
  input: { sessionId: string; friendId: string; type: "offer" | "answer" | "ice-candidate" | "hangup"; payload: Record<string, unknown> }
): Promise<void> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar llamadas.");
  const selfId = normalizeAccountId(identity.name);
  if (!(await areFriends(client, selfId, input.friendId))) throw new Error("Debes aceptar la solicitud antes de llamar.");

  const { error } = await client.from("call_signals").insert({
    session_id: input.sessionId,
    from_id: selfId,
    to_id: input.friendId,
    signal_type: input.type,
    payload: input.payload || {}
  });

  if (error) throw new Error(`No se pudo enviar la senal: ${error.message}`);
}
