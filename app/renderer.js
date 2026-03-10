const statusEl = document.getElementById("status");
const accountTextEl = document.getElementById("accountText");
const accountAvatarEl = document.getElementById("accountAvatar");
const crumbTextEl = document.getElementById("crumbText");
const welcomeNameEl = document.getElementById("welcomeName");
const onlineCountEl = document.getElementById("onlineCount");
const onlineFriendsCountEl = document.getElementById("onlineFriendsCount");
const installedModsCountEl = document.getElementById("installedModsCount");
const instancePillEl = document.getElementById("instancePill");
const memorySummaryEl = document.getElementById("memorySummary");
const heroMemoryMbEl = document.getElementById("heroMemoryMb");

const loaderVersionEl = document.getElementById("loaderVersion");
const memoryMbEl = document.getElementById("memoryMb");

const playBtn = document.getElementById("playBtn");
const playBtnTop = document.getElementById("playBtnTop");
const playVersionBtn = document.getElementById("playVersionBtn");
const playVersionInfoBtn = document.getElementById("playVersionInfoBtn");
const activeVersionTextEl = document.getElementById("activeVersionText");
const heroVersionMenuEl = document.getElementById("heroVersionMenu");
const launchStackEl = document.getElementById("launchStack");
const launchVersionLabelEl = document.getElementById("launchVersionLabel");
const winMinBtn = document.getElementById("winMinBtn");
const winMaxBtn = document.getElementById("winMaxBtn");
const winCloseBtn = document.getElementById("winCloseBtn");
const accountCardBtn = document.getElementById("accountCardBtn");
const accountMenuWrapEl = document.getElementById("accountMenuWrap");
const accountDropdownEl = document.getElementById("accountDropdown");
const accountSettingsBtn = document.getElementById("accountSettingsBtn");
const accountLogoutBtn = document.getElementById("accountLogoutBtn");
const sidebarSettingsBtn = document.getElementById("sidebarSettingsBtn");

const versionsGridEl = document.getElementById("versionsGrid");
const selectedImageEl = document.getElementById("selectedImage");
const selectedTitleEl = document.getElementById("selectedTitle");
const selectedDescEl = document.getElementById("selectedDesc");
const selectedVersionValueEl = document.getElementById("selectedVersionValue");
const selectedLoaderValueEl = document.getElementById("selectedLoaderValue");

const homeViewEl = document.getElementById("homeView");
const versionsViewEl = document.getElementById("versionsView");
const modsViewEl = document.getElementById("modsView");
const chatViewEl = document.getElementById("chatView");

const friendsSearchEl = document.getElementById("friendsSearch");
const friendsListEl = document.getElementById("friendsList");
const chatFriendAvatarEl = document.getElementById("chatFriendAvatar");
const chatFriendNameEl = document.getElementById("chatFriendName");
const chatFriendStateEl = document.getElementById("chatFriendState");
const chatThreadEl = document.getElementById("chatThread");
const chatFormEl = document.getElementById("chatForm");
const chatInputEl = document.getElementById("chatInput");
const addFriendBtn = document.getElementById("addFriendBtn");
const socialQuickAddBtn = document.getElementById("socialQuickAddBtn");
const chatCallBtn = document.getElementById("chatCallBtn");
const friendAddFormEl = document.getElementById("friendAddForm");
const friendAddInputEl = document.getElementById("friendAddInput");
const friendRequestsPanelEl = document.getElementById("friendRequestsPanel");
const friendRequestsListEl = document.getElementById("friendRequestsList");
const friendRequestsCountEl = document.getElementById("friendRequestsCount");
const toastStackEl = document.getElementById("toastStack");
const callControlsEl = document.getElementById("callControls");
const callMuteBtn = document.getElementById("callMuteBtn");
const callInputSelectEl = document.getElementById("callInputSelect");
const callOutputSelectEl = document.getElementById("callOutputSelect");
const callVolumeRangeEl = document.getElementById("callVolumeRange");
const remoteCallAudioEl = document.getElementById("remoteCallAudio");
const callSelfAvatarEl = document.getElementById("callSelfAvatar");
const callFriendPresenceAvatarEl = document.getElementById("callFriendPresenceAvatar");
const callPresenceTitleEl = document.getElementById("callPresenceTitle");
const callPresenceSubtitleEl = document.getElementById("callPresenceSubtitle");
const incomingCallBarEl = document.getElementById("incomingCallBar");
const incomingCallTitleEl = document.getElementById("incomingCallTitle");
const incomingCallSubtitleEl = document.getElementById("incomingCallSubtitle");
const incomingCallAcceptBtn = document.getElementById("incomingCallAcceptBtn");
const incomingCallRejectBtn = document.getElementById("incomingCallRejectBtn");

const modsGridEl = document.getElementById("modsGrid");
const modsSearchEl = document.getElementById("modsSearch");
const modsSortEl = document.getElementById("modsSort");
const modsPrevBtn = document.getElementById("modsPrevBtn");
const modsNextBtn = document.getElementById("modsNextBtn");
const modsPageInfoEl = document.getElementById("modsPageInfo");
const modsResultsSummaryEl = document.getElementById("modsResultsSummary");
const modsInstalledSummaryEl = document.getElementById("modsInstalledSummary");
const categoryFiltersEl = document.getElementById("categoryFilters");
const compatibilityFiltersEl = document.getElementById("compatibilityFilters");
const stateFiltersEl = document.getElementById("stateFilters");

let selectedGameVersion = "";
let selectedLoaderVersion = "";
let gameVersions = [];
let currentUser = null;
let selectedFriendId = "";
let modsPage = 1;
let activeCategoryFilter = "all";
let activeCompatibilityFilter = "all";
let activeStateFilter = "all";
let detectedInstalledMods = [];
let remoteMods = [];
let remoteModsTotal = 0;
let modsLoading = false;
let instanceRunning = false;
let launchPhase = "idle";
let chatBackendEnabled = false;
let chatSyncTimerId = 0;
const seenToastKeys = new Set();
const remoteModsCache = new Map();
let removeUpdateListener = null;
let removeLaunchListener = null;
let friendRequests = [];
let callPeerConnection = null;
let localCallStream = null;
let remoteCallStream = null;
let callSignalPollerId = 0;
let callSignalCursor = 0;
let callOfferSent = false;
const callDevices = { inputId: "default", outputId: "default", muted: false, volume: 100 };
let incomingCallRingtone = null;

const palettes = [["#7f3fa8", "#2a1d3f"], ["#8f386f", "#321931"], ["#6f4ac2", "#2b1f57"], ["#aa2b7b", "#3b1741"], ["#3a45af", "#1a214d"], ["#8231a7", "#2d1b4d"]];
const MODS_PER_PAGE = 8;

const defaultFriends = [];

const initialConversations = {};

let friends = getFriendsState();
let activeCall = getCallState();
let callTimerId = 0;

function normalizeModKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\.jar$/i, "")
    .replace(/[_+.\s]+/g, "-")
    .replace(/-?\d+(?:\.\d+)+(?:[-+a-z0-9.]*)?$/i, "")
    .replace(/-fabric$/i, "")
    .replace(/-mc$/i, "")
    .replace(/-+$/g, "");
}

function getConversationState() {
  const raw = localStorage.getItem("papu.conversations");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getFriendsState() {
  const raw = localStorage.getItem("papu.friends");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFriendsState() {
  localStorage.setItem("papu.friends", JSON.stringify(friends));
}

function getRequestLabel(request) {
  return request.direction === "incoming" ? "Quiere agregarte" : "Solicitud enviada";
}

function getCallState() {
  const raw = localStorage.getItem("papu.activeCall");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.friendId ? parsed : null;
  } catch {
    return null;
  }
}

function saveCallState() {
  if (activeCall) {
    localStorage.setItem("papu.activeCall", JSON.stringify(activeCall));
  } else {
    localStorage.removeItem("papu.activeCall");
  }
}

function normalizeActiveCallState() {
  if (!activeCall?.friendId) {
    activeCall = null;
    saveCallState();
    return;
  }
  const hasFriend = friends.some((friend) => friend.id === activeCall.friendId);
  if (!hasFriend) {
    activeCall = null;
    saveCallState();
  }
}

async function enumerateCallDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return { inputs: [], outputs: [] };
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      inputs: devices.filter((device) => device.kind === "audioinput"),
      outputs: devices.filter((device) => device.kind === "audiooutput")
    };
  } catch {
    return { inputs: [], outputs: [] };
  }
}

async function ensureLocalCallStream() {
  if (localCallStream) return localCallStream;
  const constraints = {
    audio: callDevices.inputId && callDevices.inputId !== "default"
      ? { deviceId: { exact: callDevices.inputId } }
      : true,
    video: false
  };
  localCallStream = await navigator.mediaDevices.getUserMedia(constraints);
  for (const track of localCallStream.getAudioTracks()) {
    track.enabled = !callDevices.muted;
  }
  return localCallStream;
}

function stopCallStream(stream) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function setRemoteAudioSink() {
  if (!remoteCallAudioEl) return;
  remoteCallAudioEl.volume = callDevices.volume / 100;
  if (typeof remoteCallAudioEl.setSinkId === "function" && callDevices.outputId && callDevices.outputId !== "default") {
    remoteCallAudioEl.setSinkId(callDevices.outputId).catch(() => {});
  }
}

function syncIncomingCallRingtone() {
  const shouldRing = Boolean(activeCall && !activeCall.isCaller && activeCall.status === "ringing");
  if (!shouldRing) {
    if (incomingCallRingtone) {
      incomingCallRingtone.pause();
      incomingCallRingtone.currentTime = 0;
      incomingCallRingtone = null;
    }
    return;
  }
  if (!incomingCallRingtone) {
    incomingCallRingtone = new Audio("../sounds/ringtone_call_sound.mp3");
    incomingCallRingtone.loop = true;
    incomingCallRingtone.volume = 0.18;
  }
  incomingCallRingtone.play().catch(() => {});
}

function updateCallControlsUI() {
  const isIncomingRinging = Boolean(activeCall && !activeCall.isCaller && activeCall.status === "ringing");
  const isActiveCall = Boolean(activeCall && activeCall.status === "active");
  const activeFriend = friends.find((friend) => friend.id === activeCall?.friendId);
  const shouldShowForSelectedFriend = Boolean(activeFriend && selectedFriendId && selectedFriendId === activeFriend.id);
  if (callControlsEl) callControlsEl.classList.toggle("hidden", !(isActiveCall && shouldShowForSelectedFriend));
  if (incomingCallBarEl) incomingCallBarEl.classList.toggle("hidden", !(isIncomingRinging && shouldShowForSelectedFriend));
  if (callSelfAvatarEl) {
    callSelfAvatarEl.src = currentUser ? skinHeadUrl(currentUser.uuid) : "../images/icons/grass_block.png";
  }
  if (callFriendPresenceAvatarEl) {
    callFriendPresenceAvatarEl.src = activeFriend?.avatarUrl || (activeFriend ? `https://mc-heads.net/avatar/${encodeURIComponent(activeFriend.name)}/64` : "../images/icons/grass_block.png");
  }
  if (callPresenceTitleEl) {
    callPresenceTitleEl.textContent = activeFriend ? `Llamada con ${activeFriend.name}` : "Llamada activa";
  }
  if (callPresenceSubtitleEl) {
    callPresenceSubtitleEl.textContent = activeCall
      ? (activeCall.isCaller ? "Canal de voz activo o esperando confirmacion." : "Canal de voz sincronizado con tu amigo.")
      : "Tu audio y el de tu amigo se estan conectando.";
  }
  if (incomingCallTitleEl) {
    incomingCallTitleEl.textContent = activeFriend ? `${activeFriend.name} te esta llamando` : "Llamada entrante";
  }
  if (incomingCallSubtitleEl) {
    incomingCallSubtitleEl.textContent = isIncomingRinging ? "Acepta para abrir el canal de voz o rechaza para cortarla." : "Tu amigo quiere hablar contigo.";
  }
  if (callMuteBtn) {
    callMuteBtn.textContent = callDevices.muted ? "Activar micro" : "Mutear";
    callMuteBtn.classList.toggle("active", callDevices.muted);
  }
  if (callVolumeRangeEl instanceof HTMLInputElement) {
    callVolumeRangeEl.value = String(callDevices.volume);
  }
  setRemoteAudioSink();
  syncIncomingCallRingtone();
}

async function refreshCallDeviceSelectors() {
  const { inputs, outputs } = await enumerateCallDevices();
  if (callInputSelectEl instanceof HTMLSelectElement) {
    callInputSelectEl.innerHTML = `<option value="default">Predeterminado</option>${inputs
      .map((device, index) => `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(device.label || `Microfono ${index + 1}`)}</option>`)
      .join("")}`;
    callInputSelectEl.value = callDevices.inputId;
  }
  if (callOutputSelectEl instanceof HTMLSelectElement) {
    callOutputSelectEl.innerHTML = `<option value="default">Predeterminado</option>${outputs
      .map((device, index) => `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(device.label || `Salida ${index + 1}`)}</option>`)
      .join("")}`;
    callOutputSelectEl.value = callDevices.outputId;
  }
}

async function recreateLocalAudioTrack() {
  if (!callPeerConnection || !activeCall) return;
  const sender = callPeerConnection.getSenders().find((entry) => entry.track?.kind === "audio");
  stopCallStream(localCallStream);
  localCallStream = null;
  const stream = await ensureLocalCallStream();
  const nextTrack = stream.getAudioTracks()[0];
  if (sender && nextTrack) {
    await sender.replaceTrack(nextTrack);
  }
}

async function sendCallSignal(type, payload) {
  if (!activeCall?.sessionId || !activeCall?.friendId) return;
  await window.papu.sendRemoteChatCallSignal({
    sessionId: activeCall.sessionId,
    friendId: activeCall.friendId,
    type,
    payload
  });
}

function createPeerConnection() {
  if (callPeerConnection) return callPeerConnection;
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });
  callPeerConnection = peer;
  remoteCallStream = new MediaStream();
  if (remoteCallAudioEl) {
    remoteCallAudioEl.srcObject = remoteCallStream;
    setRemoteAudioSink();
  }

  peer.ontrack = (event) => {
    if (!remoteCallStream) {
      remoteCallStream = new MediaStream();
      if (remoteCallAudioEl) remoteCallAudioEl.srcObject = remoteCallStream;
    }
    for (const track of event.streams[0]?.getTracks?.() || event.streams.flatMap((stream) => stream.getTracks())) {
      if (!remoteCallStream.getTracks().some((existing) => existing.id === track.id)) {
        remoteCallStream.addTrack(track);
      }
    }
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      sendCallSignal("ice-candidate", event.candidate.toJSON()).catch((error) => setStatus(`Error enviando ICE: ${error.message || String(error)}`));
    }
  };

  peer.onconnectionstatechange = () => {
    if (!peer) return;
    if (peer.connectionState === "connected") {
      setStatus("Llamada conectada.");
    } else if (peer.connectionState === "failed") {
      setStatus("La conexion de voz fallo.");
    } else if (peer.connectionState === "disconnected") {
      setStatus("La llamada se desconecto.");
    }
  };

  return peer;
}

async function attachLocalTracks() {
  const peer = createPeerConnection();
  const stream = await ensureLocalCallStream();
  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack) throw new Error("No se encontro un microfono disponible.");
  const hasAudioSender = peer.getSenders().some((sender) => sender.track?.kind === "audio");
  if (!hasAudioSender) {
    peer.addTrack(audioTrack, stream);
  }
}

async function ensureCallConnection() {
  if (!activeCall?.sessionId || activeCall.status !== "active") return;
  await attachLocalTracks();
  createPeerConnection();
  if (activeCall.isCaller && !callOfferSent) {
    const peer = createPeerConnection();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await sendCallSignal("offer", offer.toJSON());
    callOfferSent = true;
    setStatus("Llamando y negociando audio...");
  }
}

async function handleIncomingCallSignal(signal) {
  const peer = createPeerConnection();
  if (signal.type === "offer") {
    await attachLocalTracks();
    await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await sendCallSignal("answer", answer.toJSON());
    setStatus("Llamada aceptada. Conectando audio...");
    return;
  }
  if (signal.type === "answer") {
    if (!peer.currentRemoteDescription) {
      await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
      setStatus("Audio remoto conectado.");
    }
    return;
  }
  if (signal.type === "ice-candidate" && signal.payload?.candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(signal.payload));
    return;
  }
  if (signal.type === "hangup") {
    await teardownRtcCall(false);
    activeCall = null;
    saveCallState();
    ensureCallTicker();
    renderFriends();
    renderChat();
    setStatus(signal.payload?.reason === "rejected" ? "Tu amigo rechazo la llamada." : "La llamada fue finalizada por tu amigo.");
  }
}

async function pollCallSignals() {
  if (!chatBackendEnabled || !activeCall?.sessionId || !activeCall?.friendId) return;
  const signals = await window.papu.fetchRemoteChatCallSignals({
    sessionId: activeCall.sessionId,
    friendId: activeCall.friendId,
    afterId: callSignalCursor
  });
  for (const signal of signals) {
    callSignalCursor = Math.max(callSignalCursor, Number(signal.id || 0));
    if (signal.fromId === normalizeModKey(currentUser?.name || "")) continue;
    await handleIncomingCallSignal(signal);
  }
}

function startCallSignalPolling() {
  if (callSignalPollerId) window.clearInterval(callSignalPollerId);
  if (!activeCall?.sessionId) {
    callSignalPollerId = 0;
    return;
  }
  callSignalPollerId = window.setInterval(() => {
    pollCallSignals().catch((error) => setStatus(`Error sincronizando llamada: ${error.message || String(error)}`));
  }, 1200);
}

async function teardownRtcCall(sendHangup = false) {
  if (sendHangup && activeCall?.sessionId) {
    await sendCallSignal("hangup", {}).catch(() => {});
  }
  if (callSignalPollerId) {
    window.clearInterval(callSignalPollerId);
    callSignalPollerId = 0;
  }
  callOfferSent = false;
  callSignalCursor = 0;
  if (callPeerConnection) {
    callPeerConnection.onicecandidate = null;
    callPeerConnection.ontrack = null;
    callPeerConnection.close();
    callPeerConnection = null;
  }
  stopCallStream(localCallStream);
  localCallStream = null;
  stopCallStream(remoteCallStream);
  remoteCallStream = null;
  if (remoteCallAudioEl) {
    remoteCallAudioEl.srcObject = null;
  }
  syncIncomingCallRingtone();
  updateCallControlsUI();
}

async function syncRtcState() {
  if (!activeCall?.sessionId) {
    await teardownRtcCall(false);
    return;
  }
  updateCallControlsUI();
  startCallSignalPolling();
  await ensureCallConnection();
  await pollCallSignals();
}

function saveConversationState(map) {
  localStorage.setItem("papu.conversations", JSON.stringify(map));
}

function overwriteConversation(friendId, messages) {
  const conversationMap = getConversationState();
  conversationMap[friendId] = messages;
  saveConversationState(conversationMap);
}

function getInstalledMods() {
  const raw = localStorage.getItem("papu.installedMods");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveInstalledMods(map) {
  localStorage.setItem("papu.installedMods", JSON.stringify(map));
}

function mergedInstalledState() {
  const stored = getInstalledMods();
  const detected = Object.fromEntries(
    detectedInstalledMods.map((mod) => [
      mod.id,
      { version: mod.version || "detectado", installedAt: "detected", detected: true, iconDataUrl: mod.iconDataUrl, displayName: mod.displayName, description: mod.description, fileName: mod.fileName }
    ])
  );
  return { ...stored, ...detected };
}

function getRemoteCacheKey() {
  return JSON.stringify({
    query: modsSearchEl?.value || "",
    gameVersion: activeCompatibilityFilter,
    category: activeCategoryFilter,
    sort: modsSortEl?.value || "downloads",
    page: modsPage,
    state: activeStateFilter
  });
}

function clearRemoteModsCache() {
  remoteModsCache.clear();
}

function collectAliases(values) {
  const aliases = new Set();
  for (const value of values) {
    const normalized = normalizeModKey(value);
    if (normalized) aliases.add(normalized);
  }
  return aliases;
}

function buildInstalledAliasMap(installed) {
  const aliasMap = new Map();

  for (const [installedKey, info] of Object.entries(installed)) {
    const aliases = collectAliases([installedKey, info?.displayName, info?.fileName, info?.projectId, info?.slug, info?.title]);
    for (const alias of aliases) {
      if (!aliasMap.has(alias)) aliasMap.set(alias, { key: installedKey, info });
    }
  }

  for (const mod of detectedInstalledMods) {
    const info = installed[mod.id] || {
      version: mod.version || "detectado",
      installedAt: "detected",
      detected: true,
      iconDataUrl: mod.iconDataUrl,
      displayName: mod.displayName,
      description: mod.description,
      fileName: mod.fileName
    };
    const aliases = collectAliases([mod.id, mod.displayName, mod.fileName]);
    for (const alias of aliases) {
      if (!aliasMap.has(alias)) aliasMap.set(alias, { key: mod.id, info });
    }
  }

  return aliasMap;
}

function getInstalledMatchInfo(mod, installedAliasMap) {
  const aliases = collectAliases([mod?.projectId, mod?.id, mod?.slug, mod?.title, mod?.displayName, mod?.fileName]);
  for (const alias of aliases) {
    const match = installedAliasMap.get(alias);
    if (match) return match;
  }
  return null;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function playToastSound(kind = "message") {
  const src = kind === "friend" ? "../sounds/friend_request.mp3" : "../sounds/message_notification.mp3";
  try {
    const audio = new Audio(src);
    audio.volume = kind === "friend" ? 0.65 : 0.5;
    audio.play().catch(() => {});
  } catch {
    // El sonido es opcional; la notificacion visual sigue activa.
  }
}

function pushToast({ title, body, kind = "message", dedupeKey = "", avatarUrl = "" }) {
  if (!toastStackEl || !title || !body) return;
  if (dedupeKey) {
    if (seenToastKeys.has(dedupeKey)) return;
    seenToastKeys.add(dedupeKey);
  }

  const toast = document.createElement("article");
  toast.className = `toast-card ${kind}`;
  toast.innerHTML = `
    <div class="toast-main">
      ${avatarUrl ? `<img class="toast-avatar" src="${escapeHtml(avatarUrl)}" alt="" />` : ""}
      <div>
        <div class="toast-topline">
          <strong class="toast-title">${escapeHtml(title)}</strong>
          <span class="toast-time">${new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div class="toast-body">${escapeHtml(body)}</div>
      </div>
    </div>
  `;
  toastStackEl.prepend(toast);
  playToastSound(kind);

  window.setTimeout(() => {
    toast.classList.add("leaving");
    window.setTimeout(() => toast.remove(), 180);
  }, 5200);
}

function getMessageToastKey(friendId, message) {
  return [friendId, message?.author, message?.time, message?.text].map((value) => String(value || "")).join("|");
}

function getRequestToastKey(request) {
  return [request?.direction, request?.id, request?.name].map((value) => String(value || "")).join("|");
}

function notifyIncomingMessages(friend, previousMessages, nextMessages) {
  if (!friend || !Array.isArray(nextMessages)) return;
  const knownKeys = new Set((previousMessages || []).map((message) => getMessageToastKey(friend.id, message)));
  for (const message of nextMessages) {
    if (message?.author !== "friend") continue;
    const key = getMessageToastKey(friend.id, message);
    if (knownKeys.has(key)) continue;
    pushToast({
      title: friend.name,
      body: message.text || "Tienes un mensaje nuevo.",
      kind: "message",
      dedupeKey: `message:${key}`,
      avatarUrl: friend.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(friend.name)}/64`
    });
  }
}

function notifyFriendRequestChanges(previousRequests, nextRequests, previousFriends, nextFriends) {
  const previousRequestMap = new Map((previousRequests || []).map((request) => [getRequestToastKey(request), request]));
  const nextRequestMap = new Map((nextRequests || []).map((request) => [getRequestToastKey(request), request]));
  const nextFriendIds = new Set((nextFriends || []).map((friend) => friend.id));

  for (const request of nextRequests || []) {
    const key = getRequestToastKey(request);
    if (previousRequestMap.has(key)) continue;
    if (request.direction === "incoming") {
      pushToast({
        title: "Solicitud de amistad",
        body: `${request.name} quiere agregarte en PapuClient.`,
        kind: "friend",
        dedupeKey: `request-in:${key}`,
        avatarUrl: request.avatarUrl
      });
    }
  }

  for (const request of previousRequests || []) {
    const key = getRequestToastKey(request);
    if (nextRequestMap.has(key)) continue;
    if (request.direction === "outgoing") {
      if (nextFriendIds.has(request.id)) {
        pushToast({
          title: "Solicitud aceptada",
          body: `${request.name} acepto tu solicitud. Ya pueden chatear.`,
          kind: "friend",
          dedupeKey: `request-accepted:${key}`,
          avatarUrl: request.avatarUrl
        });
      } else {
        pushToast({
          title: "Solicitud rechazada",
          body: `${request.name} rechazo tu solicitud.`,
          kind: "friend",
          dedupeKey: `request-rejected:${key}`,
          avatarUrl: request.avatarUrl
        });
      }
    }
  }
}

function handleUpdateState(state) {
  if (!state) return;
  if (state.message) setStatus(state.message);

  if (state.available && state.version) {
    pushToast({
      title: "Actualizacion disponible",
      body: `PapuClient ${state.version} esta lista para descargarse.`,
      kind: "friend",
      dedupeKey: `update-available:${state.version}`
    });
  }

  if (state.downloaded && state.version) {
    pushToast({
      title: "Actualizacion descargada",
      body: `Reinicia el launcher para instalar PapuClient ${state.version}.`,
      kind: "message",
      dedupeKey: `update-downloaded:${state.version}`
    });
  }
}

function skinHeadUrl(uuid) {
  if (!uuid) return "../images/icons/grass_block.png";
  return `https://mc-heads.net/avatar/${uuid}/64`;
}

function formatCompactNumber(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

function formatDateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "fecha no disponible";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));
  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "hace 1 dia";
  if (diffDays < 30) return `hace ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths <= 1) return "hace 1 mes";
  if (diffMonths < 12) return `hace ${diffMonths} meses`;
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears <= 1 ? "hace 1 ano" : `hace ${diffYears} anos`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getModAccent(mod) {
  if (Array.isArray(mod?.accent) && mod.accent.length >= 2) {
    return mod.accent;
  }
  const seed = normalizeModKey(mod?.id || mod?.projectId || mod?.title || "mod").length;
  return palettes[seed % palettes.length];
}

function generateModArtwork(mod) {
  const title = String(mod.title || mod.displayName || "Mod");
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || "")
    .join("") || "MD";
  const [c1, c2] = getModAccent(mod);
  const category = String(mod.category || "MOD").toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#g)"/>
      <rect x="10" y="10" width="108" height="108" rx="22" fill="rgba(7,11,18,0.20)"/>
      <text x="64" y="66" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="800" font-size="34" fill="white">${initials}</text>
      <text x="64" y="100" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="700" font-size="11" fill="rgba(255,255,255,0.88)">${category.slice(0, 12)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildModrinthProjectUrl(mod) {
  const slug = String(mod?.slug || mod?.id || "").trim();
  if (!slug) return "";
  return `https://modrinth.com/mod/${encodeURIComponent(slug)}`;
}

function getModImage(mod, installInfo) {
  return mod.iconDataUrl || installInfo?.iconDataUrl || mod.iconUrl || generateModArtwork(mod);
}

function updateAuthUI() {
  if (currentUser) {
    accountTextEl.textContent = currentUser.name;
    if (welcomeNameEl) welcomeNameEl.textContent = currentUser.name;
    accountAvatarEl.src = skinHeadUrl(currentUser.uuid);
    accountAvatarEl.onerror = () => {
      accountAvatarEl.onerror = null;
      accountAvatarEl.src = `https://mc-heads.net/avatar/${encodeURIComponent(currentUser.name)}/64`;
    };
  } else {
    accountTextEl.textContent = "Invitado";
    if (welcomeNameEl) welcomeNameEl.textContent = "Astronaut";
    accountAvatarEl.src = "../images/icons/grass_block.png";
    accountAvatarEl.onerror = null;
  }
}

function setBusy(isBusy) {
  if (accountCardBtn) accountCardBtn.disabled = isBusy;
  if (accountLogoutBtn) accountLogoutBtn.disabled = isBusy;
  if (accountSettingsBtn) accountSettingsBtn.disabled = isBusy;
  playBtn.disabled = isBusy || instanceRunning;
  playBtnTop.disabled = isBusy || instanceRunning;
  if (playVersionBtn) playVersionBtn.disabled = isBusy || instanceRunning;
  updateLaunchState();
}

function syncMemoryControls(source) {
  const normalized = String(source?.value || "4096");
  if (memoryMbEl && memoryMbEl.value !== normalized) memoryMbEl.value = normalized;
  if (heroMemoryMbEl && heroMemoryMbEl.value !== normalized) heroMemoryMbEl.value = normalized;
}

function updateLaunchState() {
  const label = instanceRunning ? "EJECUTANDO" : (launchPhase === "installing" ? "INSTALANDO" : "JUGAR");
  playBtn.textContent = label;
  playBtnTop.textContent = label;
  playBtn.classList.toggle("installing", launchPhase === "installing");
  playBtnTop.classList.toggle("installing", launchPhase === "installing");
  playBtn.classList.toggle("running", instanceRunning);
  playBtnTop.classList.toggle("running", instanceRunning);
  if (instancePillEl) {
    instancePillEl.textContent = instanceRunning ? "Ejecutando" : (launchPhase === "installing" ? "Instalando archivos" : "0 Instancias activas");
  }
}

function setAccountMenuOpen(isOpen) {
  if (!accountDropdownEl || !accountCardBtn) return;
  accountDropdownEl.classList.toggle("hidden", !isOpen);
  accountCardBtn.classList.toggle("open", isOpen);
}

function fillSelect(selectEl, values) {
  selectEl.innerHTML = "";
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  }
}

function paletteFor(index) {
  const pair = palettes[index % palettes.length];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}

function renderHeroVersionMenu() {
  if (!heroVersionMenuEl) return;
  heroVersionMenuEl.innerHTML = "";
  for (const version of gameVersions.slice(0, 20)) {
    const item = document.createElement("button");
    item.className = "hero-version-item";
    if (version === selectedGameVersion) item.classList.add("active");
    item.textContent = `Minecraft ${version}`;
    item.addEventListener("click", () => {
      selectVersion(version).catch((error) => setStatus(`Error al cargar loaders: ${error.message || String(error)}`));
      heroVersionMenuEl.classList.add("hidden");
    });
    heroVersionMenuEl.appendChild(item);
  }
}

function updateSelectedPanel() {
  syncMemoryControls(memoryMbEl);
  selectedTitleEl.textContent = `Minecraft ${selectedGameVersion || "-"}`;
  selectedDescEl.textContent = selectedGameVersion ? `Version ${selectedGameVersion} lista para jugar con Fabric ${selectedLoaderVersion || "-"}.` : "Selecciona una version para ver detalles.";
  selectedVersionValueEl.textContent = selectedGameVersion || "-";
  selectedLoaderValueEl.textContent = selectedLoaderVersion || "-";
  const memoryGb = (Number.parseInt(memoryMbEl.value || "4096", 10) / 1024).toFixed(0);
  launchVersionLabelEl.textContent = selectedGameVersion ? `Vanilla ${selectedGameVersion} + Fabric - ${memoryGb} GB` : "Fabric + Minecraft";
  if (activeVersionTextEl) activeVersionTextEl.textContent = selectedGameVersion ? `Vanilla ${selectedGameVersion} con Fabric` : "Vanilla + Fabric";
  if (memorySummaryEl) memorySummaryEl.textContent = `${memoryGb} GB asignados`;
  renderHeroVersionMenu();
  renderModFilters();
  renderMods();
}

async function refreshInstalledMods() {
  if (!selectedGameVersion) {
    detectedInstalledMods = [];
    renderMods();
    return;
  }
  try {
    detectedInstalledMods = await window.papu.listInstalledMods(selectedGameVersion);
  } catch {
    detectedInstalledMods = [];
  }
  clearRemoteModsCache();
  renderMods();
}

async function refreshLoadersForVersion(gameVersion) {
  const loaders = await window.papu.listLoaders(gameVersion);
  fillSelect(loaderVersionEl, loaders);
  selectedLoaderVersion = loaders[0] || "";
  loaderVersionEl.value = selectedLoaderVersion;
  updateSelectedPanel();
}

async function selectVersion(version) {
  selectedGameVersion = version;
  for (const card of document.querySelectorAll(".version-card")) card.classList.toggle("active", card.dataset.version === version);
  const activeCard = document.querySelector(`.version-card[data-version="${version}"]`);
  if (activeCard) selectedImageEl.style.background = activeCard.style.background;
  await refreshLoadersForVersion(version);
  await refreshInstalledMods();
}

function renderVersionCards(versions) {
  versionsGridEl.innerHTML = "";
  versions.forEach((version, index) => {
    const card = document.createElement("button");
    card.className = "version-card";
    card.dataset.version = version;
    card.style.background = paletteFor(index);
    card.innerHTML = `<span class="version-name">PAPU ${version}</span>`;
    card.addEventListener("click", () => selectVersion(version).catch((error) => setStatus(`Error al cargar loaders: ${error.message || String(error)}`)));
    versionsGridEl.appendChild(card);
  });
}

function getFilteredFriends() {
  const term = (friendsSearchEl.value || "").trim().toLowerCase();
  return friends.filter((friend) => !term || friend.name.toLowerCase().includes(term));
}

function renderFriends() {
  const filtered = getFilteredFriends();
  friendsListEl.innerHTML = "";

  for (const friend of filtered) {
    const item = document.createElement("button");
    item.className = `friend-card ${friend.status}`;
    if (friend.id === selectedFriendId) item.classList.add("active");
    item.innerHTML = `
      <img class="friend-avatar" src="${escapeHtml(friend.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(friend.name)}/64`)}" alt="" />
      <span class="friend-copy">
        <strong>${friend.name}</strong>
        <span>${friend.state}</span>
      </span>
      <span class="friend-meta">
        <span class="friend-status-dot ${friend.status}"></span>
        ${friend.unread ? `<span class="friend-unread">${friend.unread}</span>` : ""}
      </span>
    `;
    item.addEventListener("click", () => {
      selectedFriendId = friend.id;
      friend.unread = 0;
      saveFriendsState();
      renderFriends();
      syncChatIfNeeded(friend.id).catch((error) => setStatus(`Error sincronizando chat: ${error.message || String(error)}`));
    });
    friendsListEl.appendChild(item);
  }

  if (onlineFriendsCountEl) onlineFriendsCountEl.textContent = String(friends.filter((friend) => friend.status === "online").length);
}

function renderFriendRequests() {
  if (!friendRequestsListEl || !friendRequestsPanelEl || !friendRequestsCountEl) return;
  friendRequestsCountEl.textContent = String(friendRequests.length);
  friendRequestsListEl.innerHTML = "";

  if (!friendRequests.length) {
    friendRequestsListEl.innerHTML = `
      <div class="friend-requests-empty">
        <div>
          <strong>Sin solicitudes</strong>
          <span>Cuando alguien te agregue, su head y las acciones para aceptar o rechazar apareceran aqui.</span>
        </div>
      </div>
    `;
    return;
  }

  for (const request of friendRequests) {
    const item = document.createElement("article");
    item.className = `friend-request-card ${request.direction}`;
    item.innerHTML = `
      <img class="friend-request-avatar" src="${escapeHtml(request.avatarUrl)}" alt="" />
      <div class="friend-request-copy">
        <strong>${escapeHtml(request.name)}</strong>
        <span class="friend-request-direction">${request.direction === "incoming" ? "Recibida" : "Enviada"}</span>
        <span>${escapeHtml(getRequestLabel(request))}</span>
        ${request.direction === "incoming" ? `
          <div class="friend-request-actions">
            <button class="friend-request-btn accept" data-request-action="accept" data-request-id="${escapeHtml(request.id)}">Aceptar</button>
            <button class="friend-request-btn" data-request-action="reject" data-request-id="${escapeHtml(request.id)}">Rechazar</button>
          </div>
        ` : ""}
      </div>
    `;
    friendRequestsListEl.appendChild(item);
  }
}

function renderChat() {
  const friend = friends.find((entry) => entry.id === selectedFriendId) ?? friends[0];
  if (!friend) {
    chatFriendNameEl.textContent = "Selecciona un amigo";
    chatFriendStateEl.textContent = friendRequests.length ? "Tienes solicitudes pendientes" : "Sin conversacion activa";
    chatThreadEl.innerHTML = `<div class="mods-empty-state">Acepta una solicitud o agrega un amigo para empezar a chatear.</div>`;
    if (chatInputEl) chatInputEl.disabled = true;
    if (chatCallBtn) {
      chatCallBtn.classList.remove("active-call");
      chatCallBtn.disabled = true;
      chatCallBtn.title = "Selecciona un amigo para llamar";
    }
    updateCallControlsUI();
    return;
  }
  const conversationMap = getConversationState();
  const messages = conversationMap[friend.id] ?? [];
  if (chatInputEl) chatInputEl.disabled = false;

  chatFriendNameEl.textContent = friend.name;
  chatFriendStateEl.textContent = getCallLabel(friend) || friend.state;
  chatFriendAvatarEl.src = friend.avatarUrl || `https://mc-heads.net/avatar/${friend.name}/48`;
  if (chatCallBtn) {
    const inCall = activeCall?.friendId === friend.id;
    chatCallBtn.classList.toggle("active-call", inCall);
    chatCallBtn.disabled = false;
    chatCallBtn.title = inCall ? "Finalizar llamada de voz" : "Llamar";
  }
  chatThreadEl.innerHTML = "";

  for (const message of messages) {
    const row = document.createElement("div");
    row.className = `chat-message ${message.author}`;
    row.innerHTML = `<div class="chat-bubble"><span>${message.text}</span><small>${message.time}</small></div>`;
    chatThreadEl.appendChild(row);
  }

  chatThreadEl.scrollTop = chatThreadEl.scrollHeight;
  updateCallControlsUI();
}

function appendMessage(friendId, message) {
  const conversationMap = getConversationState();
  const list = conversationMap[friendId] ?? [];
  list.push(message);
  conversationMap[friendId] = list;
  saveConversationState(conversationMap);
}

function sendChatMessage(text) {
  const friend = friends.find((entry) => entry.id === selectedFriendId);
  if (!friend || !text.trim()) return;

  if (chatBackendEnabled) {
    window.papu.sendRemoteChatMessage({ friendId: friend.id, text: text.trim() })
      .then(() => syncChatIfNeeded(friend.id))
      .catch((error) => setStatus(`Error enviando mensaje: ${error.message || String(error)}`));
    return;
  }

  appendMessage(friend.id, { author: "self", text: text.trim(), time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) });
  renderChat();

  window.setTimeout(() => {
    const reply = {
      author: "friend",
      text: `Recibido. Te respondo desde ${friend.state.toLowerCase()}.`,
      time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
    };
    appendMessage(friend.id, reply);
    pushToast({
      title: friend.name,
      body: reply.text,
      kind: "message",
      dedupeKey: `message:${getMessageToastKey(friend.id, reply)}`,
      avatarUrl: friend.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(friend.name)}/64`
    });
    renderFriends();
    renderChat();
  }, 900);
}

function toggleFriendAddPanel(forceOpen = false) {
  if (!friendAddFormEl) return;
  const willOpen = forceOpen || friendAddFormEl.classList.contains("hidden");
  friendAddFormEl.classList.toggle("hidden", !willOpen);
  if (willOpen && friendAddInputEl instanceof HTMLInputElement) {
    friendAddInputEl.value = "";
    friendAddInputEl.focus();
  }
}

function addFriendByAccount(rawName) {
  const name = String(rawName || "").trim().replace(/^@+/, "");
  if (!name) return setStatus("Ingresa una cuenta valida.");
  const id = normalizeModKey(name);
  if (!id) return setStatus("Ingresa una cuenta valida.");
  if (chatBackendEnabled) {
    window.papu.addRemoteChatFriend({ accountName: name })
      .then(() => syncChatIfNeeded(selectedFriendId))
      .then(() => {
        if (friendAddFormEl) friendAddFormEl.classList.add("hidden");
        setStatus(`Solicitud enviada a ${name}.`);
        pushToast({
          title: "Solicitud enviada",
          body: `${name} podra aceptarte o rechazarte.`,
          kind: "friend",
          dedupeKey: `friend:${id}`,
          avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`
        });
      })
      .catch((error) => setStatus(`Error agregando amigo: ${error.message || String(error)}`));
    return;
  }
  if (friends.some((friend) => friend.id === id || friend.name.toLowerCase() === name.toLowerCase())) {
    return setStatus(`La cuenta ${name} ya existe en tus chats.`);
  }

  friends.unshift({
    id,
    name,
    state: "Disponible para jugar",
    status: "online",
    unread: 1
  });
  saveFriendsState();
  const conversationMap = getConversationState();
  conversationMap[id] = [{ author: "friend", text: `Hola, soy ${name}. Ya quedamos agregados en PapuClient.`, time: "ahora" }];
  saveConversationState(conversationMap);
  selectedFriendId = id;
  renderFriends();
  renderChat();
  if (friendAddFormEl) friendAddFormEl.classList.add("hidden");
  setStatus(`Cuenta agregada: ${name}.`);
  pushToast({
    title: "Amigo agregado",
    body: `${name} ya quedo disponible en tu lista.`,
    kind: "friend",
    dedupeKey: `friend:${id}`
  });
}

function formatCallDuration(startedAt) {
  const diff = Math.max(0, Date.now() - startedAt);
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getCallLabel(friend) {
  if (!activeCall || activeCall.friendId !== friend.id) return "";
  if (activeCall.status === "ringing") {
    return activeCall.isCaller ? "Llamando..." : "Llamada entrante";
  }
  return `En llamada • ${formatCallDuration(activeCall.startedAt)}`;
}

function ensureCallTicker() {
  if (callTimerId) window.clearInterval(callTimerId);
  if (!activeCall) {
    callTimerId = 0;
    return;
  }
  callTimerId = window.setInterval(() => {
    if (chatViewEl?.classList.contains("hidden")) return;
    renderFriends();
    renderChat();
  }, 1000);
}

function toggleCall() {
  const friend = friends.find((entry) => entry.id === selectedFriendId);
  if (!friend) return setStatus("Selecciona un amigo para llamar.");
  if (chatBackendEnabled) {
    const previousCall = activeCall;
    window.papu.toggleRemoteChatCall({ friendId: friend.id })
      .then(async (state) => {
        activeCall = state;
        saveCallState();
        ensureCallTicker();
        if (!state && previousCall?.sessionId) {
          await teardownRtcCall(true);
        } else {
          callSignalCursor = 0;
          callOfferSent = false;
          await syncRtcState();
        }
        renderFriends();
        renderChat();
        setStatus(state ? (state.status === "ringing" ? `Llamando a ${friend.name}...` : `Llamada conectada con ${friend.name}.`) : `Llamada finalizada con ${friend.name}.`);
      })
      .catch((error) => setStatus(`Error en llamada: ${error.message || String(error)}`));
    return;
  }
  if (activeCall?.friendId === friend.id) {
    activeCall = null;
    saveCallState();
    ensureCallTicker();
    renderFriends();
    renderChat();
    return setStatus(`Llamada finalizada con ${friend.name}.`);
  }

  activeCall = { sessionId: "local", friendId: friend.id, startedAt: Date.now(), isCaller: true, status: "active" };
  saveCallState();
  ensureCallTicker();
  renderFriends();
  renderChat();
  setStatus(`Llamando a ${friend.name}...`);
}

async function syncChatIfNeeded(friendId = selectedFriendId) {
  if (!chatBackendEnabled) return;
  const previousFriendIds = new Set(friends.map((friend) => friend.id));
  const previousRequests = [...friendRequests];
  const previousFriends = [...friends];
  const previousMessages = friendId ? (getConversationState()[friendId] ?? []) : [];
  const state = await window.papu.syncRemoteChat({ selectedFriendId: friendId || "" });
  if (!state?.enabled) return;
  friends = state.friends;
  friendRequests = Array.isArray(state.requests) ? state.requests : [];
  saveFriendsState();
  activeCall = state.activeCall;
  normalizeActiveCallState();
  saveCallState();
  if (activeCall?.friendId) {
    selectedFriendId = activeCall.friendId;
  }
  for (const friend of friends) {
    if (!previousFriendIds.has(friend.id)) {
      pushToast({
        title: "Nuevo amigo",
        body: `${friend.name} aparece ahora en tu red de PapuClient.`,
        kind: "friend",
        dedupeKey: `friend-sync:${friend.id}`,
        avatarUrl: friend.avatarUrl
      });
    }
  }
  notifyFriendRequestChanges(previousRequests, friendRequests, previousFriends, friends);
  if (friendId) {
    const friend = friends.find((entry) => entry.id === friendId);
    notifyIncomingMessages(friend, previousMessages, state.messages || []);
    overwriteConversation(friendId, state.messages || []);
  }
  if ((!selectedFriendId || !friends.some((friend) => friend.id === selectedFriendId)) && friends[0]) {
    selectedFriendId = friends[0].id;
  } else if (!friends.length) {
    selectedFriendId = "";
  }
  renderFriendRequests();
  renderFriends();
  renderChat();
  syncRtcState().catch((error) => setStatus(`Error de voz: ${error.message || String(error)}`));
}

function respondIncomingCall(action) {
  const friend = friends.find((entry) => entry.id === activeCall?.friendId);
  if (!chatBackendEnabled || !activeCall?.friendId) return;
  window.papu.respondRemoteChatCall({ friendId: activeCall.friendId, action })
    .then(async (state) => {
      activeCall = state;
      saveCallState();
      ensureCallTicker();
      if (!state) {
        await teardownRtcCall(false);
        setStatus(`Rechazaste la llamada de ${friend?.name || "tu amigo"}.`);
      } else {
        callOfferSent = false;
        callSignalCursor = 0;
        await syncRtcState();
        setStatus(`Aceptaste la llamada de ${friend?.name || "tu amigo"}.`);
      }
      renderFriends();
      renderChat();
      syncIncomingCallRingtone();
    })
    .catch((error) => setStatus(`Error respondiendo llamada: ${error.message || String(error)}`));
}

function getInstalledCount() {
  return Object.keys(mergedInstalledState()).length;
}

function getFilteredMods() {
  const installed = mergedInstalledState();
  const installedAliasMap = buildInstalledAliasMap(installed);
  if (activeStateFilter === "installed") {
    return detectedInstalledMods.map((installedMod) => {
      const key = normalizeModKey(installedMod.id || installedMod.displayName || installedMod.fileName);
      return {
        id: key,
        projectId: "",
        slug: key,
        title: installedMod.displayName || installedMod.fileName,
        author: "Instalado localmente",
        description: installedMod.description || "Mod detectado en la instancia actual.",
        category: "Instalado",
        categories: ["installed"],
        downloads: 0,
        updatedAt: "2026-03-09",
        versions: [installedMod.version || installedMod.fileName],
        compatible: selectedGameVersion ? [selectedGameVersion] : [],
        iconUrl: installedMod.iconDataUrl || "",
        installed: true
      };
    });
  }

  return remoteMods.map((mod) => {
    const match = getInstalledMatchInfo(mod, installedAliasMap);
    const key = match?.key || normalizeModKey(mod.projectId || mod.id || mod.title);
    return {
      ...mod,
      id: key,
      installed: Boolean(match),
      installInfo: match?.info || null,
      iconUrl: mod.iconUrl || "",
      categories: Array.isArray(mod.categories) ? mod.categories : (mod.category ? [mod.category] : [])
    };
  });
}

function renderFilterButtons(container, values, activeValue, clickHandler) {
  container.innerHTML = "";
  for (const value of values) {
    const btn = document.createElement("button");
    btn.className = "mods-filter-chip";
    if (value.value === activeValue) btn.classList.add("active");
    btn.textContent = value.label;
    btn.addEventListener("click", () => clickHandler(value.value));
    container.appendChild(btn);
  }
}

function renderModFilters() {
  const categories = [
    { value: "all", label: "Todas" },
    { value: "adventure", label: "Adventure" },
    { value: "optimization", label: "Optimization" },
    { value: "utility", label: "Utility" },
    { value: "decoration", label: "Decoration" },
    { value: "technology", label: "Technology" },
    { value: "social", label: "Social" }
  ];
  renderFilterButtons(categoryFiltersEl, categories, activeCategoryFilter, (value) => {
    activeCategoryFilter = value;
    modsPage = 1;
    loadRemoteMods().catch((error) => setStatus(`Error cargando mods: ${error.message || String(error)}`));
  });

  const compatibilities = [{ value: "all", label: "Cualquier version" }];
  for (const version of [selectedGameVersion, "1.21.11", "1.21.10", "1.21.8"]) {
    if (version && !compatibilities.some((entry) => entry.value === version)) compatibilities.push({ value: version, label: version });
  }
  renderFilterButtons(compatibilityFiltersEl, compatibilities, activeCompatibilityFilter, (value) => {
    activeCompatibilityFilter = value;
    modsPage = 1;
    loadRemoteMods().catch((error) => setStatus(`Error cargando mods: ${error.message || String(error)}`));
  });

  renderFilterButtons(stateFiltersEl, [
    { value: "all", label: "Todo" },
    { value: "installed", label: "Instalados" },
    { value: "available", label: "Disponibles" }
  ], activeStateFilter, (value) => {
    activeStateFilter = value;
    modsPage = 1;
    renderModFilters();
    if (activeStateFilter === "installed") {
      renderMods();
      return;
    }
    loadRemoteMods().catch((error) => setStatus(`Error cargando mods: ${error.message || String(error)}`));
  });
}

async function loadRemoteMods() {
  if (activeStateFilter === "installed") {
    remoteMods = [];
    remoteModsTotal = detectedInstalledMods.length;
    renderMods();
    return;
  }

  modsLoading = true;
  modsGridEl.innerHTML = `<div class="mods-empty-state">Cargando mods desde Modrinth...</div>`;

  try {
    const cacheKey = getRemoteCacheKey();
    let result = remoteModsCache.get(cacheKey);
    if (!result) {
      result = await window.papu.searchRemoteMods({
        query: modsSearchEl.value || "",
        gameVersion: activeCompatibilityFilter === "all" ? "" : activeCompatibilityFilter,
        category: activeCategoryFilter,
        sort: modsSortEl.value,
        offset: (modsPage - 1) * MODS_PER_PAGE,
        limit: MODS_PER_PAGE
      });
      remoteModsCache.set(cacheKey, result);
    }
    remoteMods = Array.isArray(result?.hits) ? result.hits : [];
    remoteModsTotal = Number(result?.totalHits || 0);
    renderMods();
    if (!remoteMods.length) {
      setStatus("No se encontraron mods en Modrinth con esos filtros.");
    }
  } catch (error) {
    remoteMods = [];
    remoteModsTotal = 0;
    renderMods();
    throw error;
  } finally {
    modsLoading = false;
  }
}

function renderMods() {
  const installed = mergedInstalledState();
  const filtered = getFilteredMods();
  const totalBase = activeStateFilter === "installed" ? filtered.length : remoteModsTotal;
  const totalPages = Math.max(1, Math.ceil(totalBase / MODS_PER_PAGE));
  if (modsPage > totalPages) modsPage = totalPages;

  const pageSlice = activeStateFilter === "installed" ? filtered.slice((modsPage - 1) * MODS_PER_PAGE, modsPage * MODS_PER_PAGE) : filtered;
  modsGridEl.innerHTML = "";

  if (!pageSlice.length) {
    modsGridEl.innerHTML = `<div class="mods-empty-state">No se encontraron mods para este filtro.</div>`;
  }

  for (const mod of pageSlice) {
    const modKey = normalizeModKey(mod.id || mod.projectId || mod.title);
    const installInfo = mod.installInfo || installed[modKey];
    const compatibleList = Array.isArray(mod.compatible) ? mod.compatible : [];
    const versionList = Array.isArray(mod.compatible) && mod.compatible.length ? mod.compatible : (Array.isArray(mod.versions) && mod.versions.length ? mod.versions : [installInfo?.version || "latest"]);
    const categoryList = Array.isArray(mod.categories) && mod.categories.length ? mod.categories.slice(0, 3) : [mod.category || "mod"];
    const imageUrl = getModImage(mod, installInfo);
    const projectUrl = buildModrinthProjectUrl(mod);
    const latestVersion = versionList[0] || "latest";
    const article = document.createElement("article");
    article.className = "mod-row";
    article.innerHTML = `
      <div class="mod-row-media">
        <img class="mod-row-icon" src="${imageUrl}" alt="" />
      </div>
      <div class="mod-row-body">
        <div class="mod-row-main">
          <div class="mod-row-titleline">
            <h3>${escapeHtml(mod.title)}</h3>
            ${installInfo ? `<span class="mod-installed-badge">Instalado</span>` : ""}
          </div>
          <p class="mod-row-desc">${escapeHtml(mod.description || "Sin descripcion disponible.")}</p>
          <div class="mod-row-meta">
            <span>${escapeHtml(mod.author || "Autor no informado")}</span>
            <span>Fabric</span>
            <span>${escapeHtml(categoryList.join(" - "))}</span>
            <span>${escapeHtml(compatibleList.slice(0, 3).join(", ") || "version flexible")}</span>
          </div>
        </div>
        <div class="mod-row-side">
          <div class="mod-row-stats">
            <span>${formatCompactNumber(Number(mod.downloads || 0))} descargas</span>
            <span>${formatRelativeDate(mod.updatedAt)}</span>
          </div>
          <div class="mod-row-actions">
            <button class="mod-secondary-btn" data-view-mod="${escapeHtml(projectUrl)}" ${projectUrl ? "" : "disabled"}>View</button>
            <button class="mod-install-btn ${installInfo ? "installed" : ""}" data-install="${escapeHtml(modKey)}" data-project-id="${escapeHtml(mod.projectId || "")}">
              ${installInfo ? "Instalado" : "Install"}
            </button>
          </div>
        </div>
        <div class="mod-row-version">
          <span class="mod-version-caption">Ultima version disponible: ${escapeHtml(latestVersion)}</span>
          <select class="mod-version-select" data-version-select="${escapeHtml(modKey)}">
            ${versionList.map((version) => `<option value="${escapeHtml(version)}" ${installInfo?.version === version ? "selected" : ""}>${escapeHtml(version)}</option>`).join("")}
          </select>
        </div>
      </div>
    `;
    modsGridEl.appendChild(article);
  }

  modsResultsSummaryEl.textContent = `${totalBase} resultados`;
  modsInstalledSummaryEl.textContent = `${getInstalledCount()} instalados`;
  installedModsCountEl.textContent = String(getInstalledCount());
  modsPageInfoEl.textContent = `Pagina ${modsPage} de ${totalPages}`;
  modsPrevBtn.disabled = modsPage <= 1;
  modsNextBtn.disabled = modsPage >= totalPages;
}

async function toggleInstallMod(modId, projectId) {
  const installed = getInstalledMods();
  if (installed[modId]) {
    delete installed[modId];
    saveInstalledMods(installed);
    setStatus("Mod desinstalado del perfil local.");
  } else if (projectId) {
    const result = await window.papu.installRemoteMod({
      projectId,
      gameVersion: selectedGameVersion,
      loaderVersion: selectedLoaderVersion
    });
    const activeMod = remoteMods.find((entry) => normalizeModKey(entry.projectId || entry.id || entry.title) === modId);
    installed[modId] = {
      version: result.version,
      installedAt: new Date().toISOString(),
      fileName: result.fileName,
      projectId,
      slug: activeMod?.slug || activeMod?.id || "",
      title: activeMod?.title || ""
    };
    saveInstalledMods(installed);
    await refreshInstalledMods();
    setStatus("Mod instalado desde Modrinth.");
  } else {
    const select = document.querySelector(`[data-version-select="${modId}"]`);
    const selectedVersion = select instanceof HTMLSelectElement ? select.value : "";
    installed[modId] = { version: selectedVersion || "latest", installedAt: new Date().toISOString() };
    saveInstalledMods(installed);
    setStatus("Mod instalado en el perfil local.");
  }
  renderMods();
}

function switchView(view) {
  homeViewEl.classList.toggle("hidden", view !== "home");
  versionsViewEl.classList.toggle("hidden", view !== "versions");
  modsViewEl.classList.toggle("hidden", view !== "mods");
  chatViewEl.classList.toggle("hidden", view !== "chat");
  if (heroVersionMenuEl) heroVersionMenuEl.classList.add("hidden");
  if (view === "home") crumbTextEl.textContent = "Inicio";
  if (view === "versions") crumbTextEl.textContent = "Versiones / PapuClient";
  if (view === "mods") crumbTextEl.textContent = "Mods / PapuClient";
  if (view === "chat") crumbTextEl.textContent = "Chats / PapuClient";
  for (const btn of document.querySelectorAll(".icon-btn[data-view]")) btn.classList.toggle("active", btn.dataset.view === view);
}

async function launchCurrent() {
  if (!selectedGameVersion) return setStatus("Selecciona una version primero.");
  if (!selectedLoaderVersion) return setStatus("No hay loader Fabric compatible para esta version.");
  if (instanceRunning) return setStatus("Ya hay una instancia ejecutandose.");
  const payload = { gameVersion: selectedGameVersion, loaderVersion: selectedLoaderVersion, memoryMb: Number.parseInt(memoryMbEl.value, 10) };
  launchPhase = "installing";
  setBusy(true);
  setStatus(`Preparando ${payload.gameVersion} + Fabric ${payload.loaderVersion}. La primera vez puede tardar...`);
  try {
    await window.papu.launch(payload);
    instanceRunning = true;
    launchPhase = "running";
    updateLaunchState();
    setStatus("Minecraft lanzado.");
  } catch (error) {
    launchPhase = "idle";
    setStatus(`Error al lanzar: ${error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function bootstrap() {
  try {
    setStatus("Cargando launcher...");
    await refreshCallDeviceSelectors();
    if (!removeUpdateListener && typeof window.papu.onUpdateState === "function") {
      removeUpdateListener = window.papu.onUpdateState(handleUpdateState);
    }
    if (typeof window.papu.getUpdateState === "function") {
      handleUpdateState(await window.papu.getUpdateState());
    }
    if (!removeLaunchListener && typeof window.papu.onLaunchProgress === "function") {
      removeLaunchListener = window.papu.onLaunchProgress((payload) => {
        if (payload?.message) {
          if (payload.stage === "closed") {
            instanceRunning = false;
            launchPhase = "idle";
          } else if (payload.stage === "running") {
            instanceRunning = true;
            launchPhase = "running";
          } else {
            launchPhase = "installing";
          }
          updateLaunchState();
          setStatus(payload.message);
        }
      });
    }
    const [games, detectedUser] = await Promise.all([window.papu.listGames(), window.papu.getUser()]);
    gameVersions = games;
    renderVersionCards(gameVersions);
    if (gameVersions.length) await selectVersion(gameVersions[0]);
    currentUser = detectedUser;
    updateAuthUI();
    const chatStatus = await window.papu.getChatBackendStatus();
    chatBackendEnabled = Boolean(chatStatus?.enabled);
    if (chatBackendEnabled) {
      friends = [];
      friendRequests = [];
      activeCall = null;
      selectedFriendId = "";
      saveFriendsState();
      saveCallState();
    }
    normalizeActiveCallState();
    renderFriends();
    renderFriendRequests();
    renderChat();
    ensureCallTicker();
    if (chatBackendEnabled) {
      await syncChatIfNeeded(selectedFriendId);
      if (chatSyncTimerId) window.clearInterval(chatSyncTimerId);
      chatSyncTimerId = window.setInterval(() => {
        syncChatIfNeeded(selectedFriendId).catch(() => {});
      }, 4000);
    }
    renderModFilters();
    await loadRemoteMods();
    switchView("home");
    const online = 47000 + Math.floor(Math.random() * 22000);
    onlineCountEl.textContent = online.toLocaleString("es-CL");
    setStatus(currentUser ? `Sesion detectada: ${currentUser.name}` : "Launcher listo.");
  } catch (error) {
    setStatus(`Error al cargar launcher: ${error.message || String(error)}`);
  }
}

async function handleLoginAction() {
  setBusy(true);
  try {
    if (currentUser) {
      setStatus("Cerrando sesion...");
      await window.papu.logoutAndOpenLogin();
    } else {
      setStatus("Abriendo login Microsoft...");
      const user = await window.papu.login();
      currentUser = user;
      updateAuthUI();
      setStatus(`Sesion iniciada: ${user.name}`);
      switchView("home");
      await window.papu.authComplete();
    }
  } catch (error) {
    setStatus(`Error de login: ${error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

if (accountCardBtn) accountCardBtn.addEventListener("click", () => setAccountMenuOpen(Boolean(accountDropdownEl?.classList.contains("hidden"))));
if (accountSettingsBtn) accountSettingsBtn.addEventListener("click", () => { setAccountMenuOpen(false); setStatus("La configuracion visual llegara en la siguiente iteracion."); });
if (accountLogoutBtn) accountLogoutBtn.addEventListener("click", () => { setAccountMenuOpen(false); handleLoginAction(); });
if (sidebarSettingsBtn) sidebarSettingsBtn.addEventListener("click", () => setStatus("La configuracion avanzada aun no esta disponible."));
if (friendsSearchEl) friendsSearchEl.addEventListener("input", renderFriends);
if (addFriendBtn) addFriendBtn.addEventListener("click", () => toggleFriendAddPanel());
if (socialQuickAddBtn) socialQuickAddBtn.addEventListener("click", () => toggleFriendAddPanel(true));
if (friendAddFormEl) friendAddFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!(friendAddInputEl instanceof HTMLInputElement) || !friendAddInputEl.value.trim()) return;
  addFriendByAccount(friendAddInputEl.value);
});
if (friendRequestsListEl) friendRequestsListEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-request-action]");
  if (!(button instanceof HTMLElement) || !chatBackendEnabled) return;
  const friendId = button.dataset.requestId;
  const action = button.dataset.requestAction;
  if (!friendId || (action !== "accept" && action !== "reject")) return;
  window.papu.respondRemoteChatFriendRequest({ friendId, action })
    .then(() => syncChatIfNeeded(selectedFriendId))
    .then(() => {
      const request = friendRequests.find((entry) => entry.id === friendId);
      setStatus(action === "accept" ? `Aceptaste a ${request?.name || friendId}.` : `Rechazaste la solicitud.`);
      pushToast({
        title: action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada",
        body: action === "accept" ? `${request?.name || friendId} ya puede chatear contigo.` : `La solicitud fue rechazada.`,
        kind: "friend",
        dedupeKey: `request:${action}:${friendId}:${Date.now()}`
      });
    })
    .catch((error) => setStatus(`Error respondiendo solicitud: ${error.message || String(error)}`));
});
if (chatCallBtn) chatCallBtn.addEventListener("click", toggleCall);
if (incomingCallAcceptBtn) incomingCallAcceptBtn.addEventListener("click", () => respondIncomingCall("accept"));
if (incomingCallRejectBtn) incomingCallRejectBtn.addEventListener("click", () => respondIncomingCall("reject"));
if (callMuteBtn) callMuteBtn.addEventListener("click", () => {
  callDevices.muted = !callDevices.muted;
  for (const track of localCallStream?.getAudioTracks?.() || []) {
    track.enabled = !callDevices.muted;
  }
  updateCallControlsUI();
});
if (callInputSelectEl instanceof HTMLSelectElement) callInputSelectEl.addEventListener("change", () => {
  callDevices.inputId = callInputSelectEl.value || "default";
  recreateLocalAudioTrack().catch((error) => setStatus(`No se pudo cambiar el microfono: ${error.message || String(error)}`));
});
if (callOutputSelectEl instanceof HTMLSelectElement) callOutputSelectEl.addEventListener("change", () => {
  callDevices.outputId = callOutputSelectEl.value || "default";
  setRemoteAudioSink();
});
if (callVolumeRangeEl instanceof HTMLInputElement) callVolumeRangeEl.addEventListener("input", () => {
  callDevices.volume = Number(callVolumeRangeEl.value || 100);
  setRemoteAudioSink();
});
if (chatFormEl) chatFormEl.addEventListener("submit", (event) => { event.preventDefault(); if (!chatInputEl.value.trim()) return; sendChatMessage(chatInputEl.value); chatInputEl.value = ""; });
if (modsGridEl) modsGridEl.addEventListener("click", async (event) => {
  const viewButton = event.target.closest("[data-view-mod]");
  if (viewButton instanceof HTMLElement && viewButton.dataset.viewMod) {
    try {
      await window.papu.openExternal(viewButton.dataset.viewMod);
    } catch (error) {
      setStatus(`No se pudo abrir el mod: ${error.message || String(error)}`);
    }
    return;
  }
  const button = event.target.closest("[data-install]");
  if (!(button instanceof HTMLElement)) return;
  try {
    await toggleInstallMod(button.dataset.install, button.dataset.projectId);
  } catch (error) {
    setStatus(`Error instalando mod: ${error.message || String(error)}`);
  }
});
if (modsSearchEl) modsSearchEl.addEventListener("input", () => { modsPage = 1; loadRemoteMods().catch((error) => setStatus(`Error cargando mods: ${error.message || String(error)}`)); });
if (modsSortEl) modsSortEl.addEventListener("change", () => { modsPage = 1; loadRemoteMods().catch((error) => setStatus(`Error cargando mods: ${error.message || String(error)}`)); });
if (modsPrevBtn) modsPrevBtn.addEventListener("click", () => { if (modsPage > 1) modsPage -= 1; if (activeStateFilter === "installed") renderMods(); else loadRemoteMods().catch((error) => setStatus(`Error cargando mods: ${error.message || String(error)}`)); });
if (modsNextBtn) modsNextBtn.addEventListener("click", () => { modsPage += 1; if (activeStateFilter === "installed") renderMods(); else loadRemoteMods().catch((error) => setStatus(`Error cargando mods: ${error.message || String(error)}`)); });
loaderVersionEl.addEventListener("change", () => { selectedLoaderVersion = loaderVersionEl.value; updateSelectedPanel(); });
memoryMbEl.addEventListener("change", () => { syncMemoryControls(memoryMbEl); updateSelectedPanel(); });
if (heroMemoryMbEl) heroMemoryMbEl.addEventListener("change", () => { syncMemoryControls(heroMemoryMbEl); updateSelectedPanel(); });
playBtn.addEventListener("click", launchCurrent);
playBtnTop.addEventListener("click", launchCurrent);
if (playVersionBtn && heroVersionMenuEl) playVersionBtn.addEventListener("click", () => heroVersionMenuEl.classList.toggle("hidden"));
if (playVersionInfoBtn && heroVersionMenuEl) playVersionInfoBtn.addEventListener("click", () => heroVersionMenuEl.classList.toggle("hidden"));
for (const btn of document.querySelectorAll(".icon-btn[data-view]")) btn.addEventListener("click", () => switchView(btn.dataset.view));
if (winMinBtn) winMinBtn.addEventListener("click", () => window.papu.windowMinimize());
if (winMaxBtn) winMaxBtn.addEventListener("click", async () => { const result = await window.papu.windowToggleMaximize(); winMaxBtn.textContent = result?.isMaximized ? "[ ]" : "[]"; });
if (winCloseBtn) winCloseBtn.addEventListener("click", () => window.papu.windowClose());

document.addEventListener("click", (event) => {
  if (accountMenuWrapEl) {
    const target = event.target;
    if (target instanceof Element && !accountMenuWrapEl.contains(target)) setAccountMenuOpen(false);
  }
  if (!heroVersionMenuEl || heroVersionMenuEl.classList.contains("hidden")) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (launchStackEl && launchStackEl.contains(target)) return;
  heroVersionMenuEl.classList.add("hidden");
});

bootstrap();
