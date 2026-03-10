const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("papu", {
  getUser: () => ipcRenderer.invoke("papu:getUser"),
  login: () => ipcRenderer.invoke("papu:login"),
  logout: () => ipcRenderer.invoke("papu:logout"),
  authComplete: () => ipcRenderer.invoke("papu:authComplete"),
  logoutAndOpenLogin: () => ipcRenderer.invoke("papu:logoutAndOpenLogin"),
  listGames: () => ipcRenderer.invoke("papu:listGames"),
  listLoaders: (gameVersion) => ipcRenderer.invoke("papu:listLoaders", gameVersion),
  listInstalledMods: (gameVersion) => ipcRenderer.invoke("papu:listInstalledMods", gameVersion),
  searchRemoteMods: (input) => ipcRenderer.invoke("papu:searchRemoteMods", input),
  installRemoteMod: (input) => ipcRenderer.invoke("papu:installRemoteMod", input),
  getChatBackendStatus: () => ipcRenderer.invoke("papu:chat:getStatus"),
  syncRemoteChat: (input) => ipcRenderer.invoke("papu:chat:sync", input),
  addRemoteChatFriend: (input) => ipcRenderer.invoke("papu:chat:addFriend", input),
  respondRemoteChatFriendRequest: (input) => ipcRenderer.invoke("papu:chat:respondFriendRequest", input),
  sendRemoteChatMessage: (input) => ipcRenderer.invoke("papu:chat:sendMessage", input),
  toggleRemoteChatCall: (input) => ipcRenderer.invoke("papu:chat:toggleCall", input),
  fetchRemoteChatCallSignals: (input) => ipcRenderer.invoke("papu:chat:fetchCallSignals", input),
  sendRemoteChatCallSignal: (input) => ipcRenderer.invoke("papu:chat:sendCallSignal", input),
  respondRemoteChatCall: (input) => ipcRenderer.invoke("papu:chat:respondCall", input),
  getUpdateState: () => ipcRenderer.invoke("papu:update:getState"),
  checkForUpdates: () => ipcRenderer.invoke("papu:update:checkNow"),
  onUpdateState: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("papu:update:event", listener);
    return () => ipcRenderer.removeListener("papu:update:event", listener);
  },
  onLaunchProgress: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("papu:launch:progress", listener);
    return () => ipcRenderer.removeListener("papu:launch:progress", listener);
  },
  launch: (payload) => ipcRenderer.invoke("papu:launch", payload),
  openExternal: (url) => ipcRenderer.invoke("papu:openExternal", url),
  windowMinimize: () => ipcRenderer.invoke("papu:window:minimize"),
  windowToggleMaximize: () => ipcRenderer.invoke("papu:window:toggleMaximize"),
  windowClose: () => ipcRenderer.invoke("papu:window:close")
});
