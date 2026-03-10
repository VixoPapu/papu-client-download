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
const toastStackEl = document.getElementById("toastStack");

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
let selectedFriendId = "vixo";
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

const palettes = [["#7f3fa8", "#2a1d3f"], ["#8f386f", "#321931"], ["#6f4ac2", "#2b1f57"], ["#aa2b7b", "#3b1741"], ["#3a45af", "#1a214d"], ["#8231a7", "#2d1b4d"]];
const MODS_PER_PAGE = 8;

const defaultFriends = [
  { id: "vixo", name: "VixoPapu", state: "Jugando Cobblemon SMP", status: "online", unread: 2 },
  { id: "naza", name: "NazaBuilds", state: "Construyendo hub", status: "away", unread: 0 },
  { id: "mili", name: "MiliPvP", state: "En cola ranked", status: "online", unread: 1 },
  { id: "tomi", name: "TomiFPS", state: "Launcher abierto", status: "busy", unread: 0 },
  { id: "sora", name: "SoraModder", state: "Desconectado", status: "offline", unread: 0 }
];

const initialConversations = {
  vixo: [
    { author: "friend", text: "Entra al SMP, ya estamos todos conectados.", time: "18:42" },
    { author: "self", text: "Abro el launcher y entro en 2 minutos.", time: "18:43" }
  ],
  naza: [
    { author: "friend", text: "Subi un nuevo spawn. Luego te muestro capturas.", time: "17:20" }
  ],
  mili: [
    { author: "friend", text: "Necesito tu config de mods visuales para PvP.", time: "16:05" },
    { author: "self", text: "Te la paso desde la biblioteca de mods.", time: "16:08" }
  ],
  tomi: [
    { author: "friend", text: "Proba con mas memoria, te va a ir mejor.", time: "15:30" }
  ],
  sora: [
    { author: "friend", text: "Cuando vuelvas mira el mod browser nuevo.", time: "ayer" }
  ]
};

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
  if (!raw) return JSON.parse(JSON.stringify(initialConversations));
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(initialConversations));
  }
}

function getFriendsState() {
  const raw = localStorage.getItem("papu.friends");
  if (!raw) return JSON.parse(JSON.stringify(defaultFriends));
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : JSON.parse(JSON.stringify(defaultFriends));
  } catch {
    return JSON.parse(JSON.stringify(defaultFriends));
  }
}

function saveFriendsState() {
  localStorage.setItem("papu.friends", JSON.stringify(friends));
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

function pushToast({ title, body, kind = "message", dedupeKey = "" }) {
  if (!toastStackEl || !title || !body) return;
  if (dedupeKey) {
    if (seenToastKeys.has(dedupeKey)) return;
    seenToastKeys.add(dedupeKey);
  }

  const toast = document.createElement("article");
  toast.className = `toast-card ${kind}`;
  toast.innerHTML = `
    <div class="toast-topline">
      <strong class="toast-title">${escapeHtml(title)}</strong>
      <span class="toast-time">${new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
    </div>
    <div class="toast-body">${escapeHtml(body)}</div>
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
      dedupeKey: `message:${key}`
    });
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
      <span class="friend-avatar">${friend.name.slice(0, 1)}</span>
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

function renderChat() {
  const friend = friends.find((entry) => entry.id === selectedFriendId) ?? friends[0];
  if (!friend) return;
  const conversationMap = getConversationState();
  const messages = conversationMap[friend.id] ?? [];

  chatFriendNameEl.textContent = friend.name;
  chatFriendStateEl.textContent = getCallLabel(friend) || friend.state;
  chatFriendAvatarEl.src = `https://mc-heads.net/avatar/${friend.name}/48`;
  if (chatCallBtn) {
    const inCall = activeCall?.friendId === friend.id;
    chatCallBtn.classList.toggle("active-call", inCall);
    chatCallBtn.title = inCall ? "Finalizar llamada" : "Llamar";
  }
  chatThreadEl.innerHTML = "";

  for (const message of messages) {
    const row = document.createElement("div");
    row.className = `chat-message ${message.author}`;
    row.innerHTML = `<div class="chat-bubble"><span>${message.text}</span><small>${message.time}</small></div>`;
    chatThreadEl.appendChild(row);
  }

  chatThreadEl.scrollTop = chatThreadEl.scrollHeight;
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
      dedupeKey: `message:${getMessageToastKey(friend.id, reply)}`
    });
    renderFriends();
    renderChat();
  }, 900);
}

function promptFriendAccount() {
  const name = window.prompt("Ingresa la cuenta del amigo");
  if (!name) return;
  addFriendByAccount(name);
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
        setStatus(`Cuenta agregada: ${name}.`);
        pushToast({
          title: "Amigo agregado",
          body: `${name} ya puede aparecer en tus chats si usa el mismo backend.`,
          kind: "friend",
          dedupeKey: `friend:${id}`
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
    window.papu.toggleRemoteChatCall({ friendId: friend.id })
      .then((state) => {
        activeCall = state;
        saveCallState();
        ensureCallTicker();
        renderFriends();
        renderChat();
        setStatus(state ? `Llamando a ${friend.name}...` : `Llamada finalizada con ${friend.name}.`);
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

  activeCall = { friendId: friend.id, startedAt: Date.now() };
  saveCallState();
  ensureCallTicker();
  renderFriends();
  renderChat();
  setStatus(`Llamando a ${friend.name}...`);
}

async function syncChatIfNeeded(friendId = selectedFriendId) {
  if (!chatBackendEnabled) return;
  const previousFriendIds = new Set(friends.map((friend) => friend.id));
  const previousMessages = friendId ? (getConversationState()[friendId] ?? []) : [];
  const state = await window.papu.syncRemoteChat({ selectedFriendId: friendId || "" });
  if (!state?.enabled) return;
  friends = state.friends;
  saveFriendsState();
  activeCall = state.activeCall;
  saveCallState();
  for (const friend of friends) {
    if (!previousFriendIds.has(friend.id)) {
      pushToast({
        title: "Nuevo amigo",
        body: `${friend.name} aparece ahora en tu red de PapuClient.`,
        kind: "friend",
        dedupeKey: `friend-sync:${friend.id}`
      });
    }
  }
  if (friendId) {
    const friend = friends.find((entry) => entry.id === friendId);
    notifyIncomingMessages(friend, previousMessages, state.messages || []);
    overwriteConversation(friendId, state.messages || []);
  }
  if ((!selectedFriendId || !friends.some((friend) => friend.id === selectedFriendId)) && friends[0]) {
    selectedFriendId = friends[0].id;
  }
  renderFriends();
  renderChat();
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
    if (!removeUpdateListener && typeof window.papu.onUpdateState === "function") {
      removeUpdateListener = window.papu.onUpdateState(handleUpdateState);
    }
    if (typeof window.papu.getUpdateState === "function") {
      handleUpdateState(await window.papu.getUpdateState());
    }
    if (!removeLaunchListener && typeof window.papu.onLaunchProgress === "function") {
      removeLaunchListener = window.papu.onLaunchProgress((payload) => {
        if (payload?.message) {
          launchPhase = instanceRunning ? "running" : "installing";
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
    renderFriends();
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
if (addFriendBtn) addFriendBtn.addEventListener("click", promptFriendAccount);
if (socialQuickAddBtn) socialQuickAddBtn.addEventListener("click", promptFriendAccount);
if (chatCallBtn) chatCallBtn.addEventListener("click", toggleCall);
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
