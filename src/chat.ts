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

export type ChatMessage = {
  author: "self" | "friend";
  text: string;
  time: string;
};

export type ChatCallState = {
  friendId: string;
  startedAt: number;
} | null;

type ChatState = {
  enabled: boolean;
  friends: ChatFriend[];
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

async function fetchMessages(client: SupabaseClient, identity: ChatIdentity, friendId: string): Promise<ChatMessage[]> {
  const profileId = normalizeAccountId(identity.name);
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
  const { data, error } = await client
    .from("call_sessions")
    .select("caller_id, recipient_id, started_at, ended_at")
    .is("ended_at", null)
    .or(`and(caller_id.eq.${profileId},recipient_id.eq.${friendId}),and(caller_id.eq.${friendId},recipient_id.eq.${profileId})`)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el estado de llamada: ${error.message}`);
  if (!data) return null;

  return {
    friendId,
    startedAt: new Date(data.started_at).getTime()
  };
}

export async function getChatStatus(): Promise<{ enabled: boolean }> {
  const client = await getChatClient();
  return { enabled: Boolean(client) };
}

export async function syncChatState(identity: ChatIdentity, selectedFriendId: string): Promise<ChatState> {
  const client = await getChatClient();
  if (!client) return { enabled: false, friends: [], messages: [], activeCall: null };

  await ensureProfile(client, identity);
  const friends = await fetchFriends(client, identity);
  const targetId = selectedFriendId || friends[0]?.id || "";
  const messages = targetId ? await fetchMessages(client, identity, targetId) : [];
  const activeCall = targetId ? await fetchCallState(client, identity, targetId) : null;

  return { enabled: true, friends, messages, activeCall };
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

  const { error } = await client.from("friend_links").upsert([
    { owner_id: selfId, friend_id: friendId },
    { owner_id: friendId, friend_id: selfId }
  ]);

  if (error) throw new Error(`No se pudo agregar el amigo: ${error.message}`);
}

export async function sendChatMessageRemote(identity: ChatIdentity, friendId: string, text: string): Promise<void> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar mensajes online.");
  const body = text.trim();
  if (!body) return;

  const { error } = await client.from("messages").insert({
    sender_id: normalizeAccountId(identity.name),
    recipient_id: friendId,
    body
  });

  if (error) throw new Error(`No se pudo enviar el mensaje: ${error.message}`);
}

export async function toggleChatCallRemote(identity: ChatIdentity, friendId: string): Promise<ChatCallState> {
  const client = await getChatClient();
  if (!client) throw new Error("Configura Supabase para habilitar llamadas.");
  const selfId = normalizeAccountId(identity.name);
  const active = await fetchCallState(client, identity, friendId);

  if (active) {
    const { error } = await client
      .from("call_sessions")
      .update({ ended_at: new Date().toISOString() })
      .is("ended_at", null)
      .or(`and(caller_id.eq.${selfId},recipient_id.eq.${friendId}),and(caller_id.eq.${friendId},recipient_id.eq.${selfId})`);
    if (error) throw new Error(`No se pudo finalizar la llamada: ${error.message}`);
    return null;
  }

  const now = new Date().toISOString();
  const { error } = await client.from("call_sessions").insert({
    caller_id: selfId,
    recipient_id: friendId,
    started_at: now
  });
  if (error) throw new Error(`No se pudo iniciar la llamada: ${error.message}`);

  return {
    friendId,
    startedAt: new Date(now).getTime()
  };
}
