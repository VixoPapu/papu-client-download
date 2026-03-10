const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");

let loginWindow = null;
let launcherWindow = null;
let updateState = {
  checking: false,
  available: false,
  downloaded: false,
  version: "",
  progress: 0,
  message: "Actualizaciones desactivadas en modo desarrollo."
};
let updaterReady = false;

function getAppRoot() {
  return app.isPackaged ? app.getAppPath() : path.resolve(__dirname, "..");
}

async function loadService() {
  const servicePath = path.resolve(getAppRoot(), "dist", "service.js");
  return import(pathToFileURL(servicePath).href);
}

function getRuntimeRoot() {
  return getAppRoot();
}

function configureRuntimeEnv() {
  process.env.PAPUCLIENT_APP_ROOT = getAppRoot();
  process.env.PAPUCLIENT_DATA_DIR = path.join(app.getPath("appData"), "PapuClient");
  process.env.PAPUCLIENT_EXTRA_ROOT = app.isPackaged ? process.resourcesPath : getAppRoot();
}

function broadcastUpdateState() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("papu:update:event", updateState);
    }
  }
}

function setupAutoUpdater() {
  if (updaterReady) return;
  updaterReady = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    updateState = { ...updateState, checking: true, message: "Buscando actualizaciones..." };
    broadcastUpdateState();
  });

  autoUpdater.on("update-not-available", () => {
    updateState = {
      checking: false,
      available: false,
      downloaded: false,
      version: "",
      progress: 0,
      message: "Launcher actualizado."
    };
    broadcastUpdateState();
  });

  autoUpdater.on("update-available", async (info) => {
    updateState = {
      checking: false,
      available: true,
      downloaded: false,
      version: info?.version || "",
      progress: 0,
      message: `Nueva version disponible: ${info?.version || "desconocida"}`
    };
    broadcastUpdateState();

    const targetWindow = launcherWindow && !launcherWindow.isDestroyed() ? launcherWindow : BrowserWindow.getFocusedWindow();
    const result = await dialog.showMessageBox(targetWindow || null, {
      type: "info",
      buttons: ["Actualizar ahora", "Mas tarde"],
      defaultId: 0,
      cancelId: 1,
      title: "Actualizacion disponible",
      message: `Hay una nueva version de PapuClient (${info?.version || "nueva version"}).`,
      detail: "Si aceptas, el launcher descargara la actualizacion y te pedira reiniciar cuando termine."
    });

    if (result.response === 0) {
      updateState = { ...updateState, message: "Descargando actualizacion..." };
      broadcastUpdateState();
      autoUpdater.downloadUpdate().catch((error) => {
        updateState = { ...updateState, checking: false, message: `Error descargando actualizacion: ${error.message}` };
        broadcastUpdateState();
      });
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    updateState = {
      ...updateState,
      progress: Math.round(progress?.percent || 0),
      message: `Descargando actualizacion... ${Math.round(progress?.percent || 0)}%`
    };
    broadcastUpdateState();
  });

  autoUpdater.on("update-downloaded", async (info) => {
    updateState = {
      checking: false,
      available: true,
      downloaded: true,
      version: info?.version || updateState.version,
      progress: 100,
      message: "Actualizacion lista para instalar."
    };
    broadcastUpdateState();

    const targetWindow = launcherWindow && !launcherWindow.isDestroyed() ? launcherWindow : BrowserWindow.getFocusedWindow();
    const result = await dialog.showMessageBox(targetWindow || null, {
      type: "info",
      buttons: ["Reiniciar e instalar", "Despues"],
      defaultId: 0,
      cancelId: 1,
      title: "Actualizacion descargada",
      message: "La actualizacion ya se descargo.",
      detail: "Reinicia ahora para instalar la nueva version."
    });

    if (result.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });

  autoUpdater.on("error", (error) => {
    updateState = {
      ...updateState,
      checking: false,
      message: `Error de actualizacion: ${error?.message || String(error)}`
    };
    broadcastUpdateState();
  });
}

function startAutoUpdateCheck() {
  if (!app.isPackaged) {
    updateState = { ...updateState, checking: false, message: "Auto-update disponible solo en builds instaladas." };
    broadcastUpdateState();
    return;
  }

  setupAutoUpdater();
  autoUpdater.checkForUpdates().catch((error) => {
    updateState = { ...updateState, checking: false, message: `No se pudo buscar actualizaciones: ${error.message}` };
    broadcastUpdateState();
  });
}

function createLoginWindow() {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return loginWindow;
  }

  loginWindow = new BrowserWindow({
    width: 520,
    height: 640,
    resizable: false,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    center: true,
    show: false,
    backgroundColor: "#0a0b13",
    title: "Iniciar sesion - PapuClient",
    icon: path.resolve(getRuntimeRoot(), "images", "icon_client.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  loginWindow.removeMenu();
  loginWindow.once("ready-to-show", () => loginWindow?.show());
  loginWindow.on("closed", () => {
    loginWindow = null;
  });
  loginWindow.loadFile(path.join(__dirname, "../app/login.html"));
  return loginWindow;
}

function createLauncherWindow() {
  if (launcherWindow && !launcherWindow.isDestroyed()) {
    launcherWindow.focus();
    return launcherWindow;
  }

  launcherWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    backgroundColor: "#0a0b13",
    title: "PapuClient",
    icon: path.resolve(getRuntimeRoot(), "images", "icon_client.png"),
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  launcherWindow.removeMenu();
  launcherWindow.once("ready-to-show", () => {
    launcherWindow?.show();
    startAutoUpdateCheck();
  });
  launcherWindow.on("closed", () => {
    launcherWindow = null;
  });
  launcherWindow.loadFile(path.join(__dirname, "../app/index.html"));
  return launcherWindow;
}

async function openInitialWindow() {
  const service = await loadService();
  const user = service.getCurrentUser();
  if (user) {
    createLauncherWindow();
  } else {
    createLoginWindow();
  }
}

ipcMain.handle("papu:getUser", async () => {
  const service = await loadService();
  return service.getCurrentUser();
});

ipcMain.handle("papu:login", async () => {
  const service = await loadService();
  return service.login();
});

ipcMain.handle("papu:logout", async () => {
  const service = await loadService();
  return service.logout();
});

ipcMain.handle("papu:authComplete", async (event) => {
  createLauncherWindow();
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && win === loginWindow) {
    win.close();
  }
  return { ok: true };
});

ipcMain.handle("papu:logoutAndOpenLogin", async (event) => {
  const service = await loadService();
  service.logout();
  createLoginWindow();
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && win === launcherWindow) {
    win.close();
  }
  return { ok: true };
});

ipcMain.handle("papu:listGames", async () => {
  const service = await loadService();
  return service.listGameVersions();
});

ipcMain.handle("papu:listLoaders", async (_event, gameVersion) => {
  const service = await loadService();
  if (typeof gameVersion === "string" && gameVersion.trim()) {
    return service.listCompatibleLoaderVersions(gameVersion);
  }
  return service.listLoaderVersions();
});

ipcMain.handle("papu:listInstalledMods", async (_event, gameVersion) => {
  const service = await loadService();
  if (typeof gameVersion !== "string" || !gameVersion.trim()) {
    return [];
  }
  return service.listInstalledMods(gameVersion);
});

ipcMain.handle("papu:searchRemoteMods", async (_event, input) => {
  const service = await loadService();
  return service.searchRemoteMods(input);
});

ipcMain.handle("papu:installRemoteMod", async (_event, input) => {
  const service = await loadService();
  return service.installRemoteMod(input);
});

ipcMain.handle("papu:chat:getStatus", async () => {
  const service = await loadService();
  return service.getChatBackendStatus();
});

ipcMain.handle("papu:chat:sync", async (_event, input) => {
  const service = await loadService();
  return service.syncRemoteChat(input);
});

ipcMain.handle("papu:chat:addFriend", async (_event, input) => {
  const service = await loadService();
  return service.addRemoteChatFriend(input);
});

ipcMain.handle("papu:chat:sendMessage", async (_event, input) => {
  const service = await loadService();
  return service.sendRemoteChatMessage(input);
});

ipcMain.handle("papu:chat:toggleCall", async (_event, input) => {
  const service = await loadService();
  return service.toggleRemoteChatCall(input);
});

ipcMain.handle("papu:launch", async (_event, payload) => {
  const service = await loadService();
  const sender = _event.sender;
  await service.startLaunch(payload, (message) => {
    try {
      sender.send("papu:launch:progress", JSON.parse(message));
    } catch {
      sender.send("papu:launch:progress", { message });
    }
  });
  return { ok: true };
});

ipcMain.handle("papu:openExternal", async (_event, url) => {
  if (typeof url === "string" && url.trim()) {
    await shell.openExternal(url);
  }
  return { ok: true };
});

ipcMain.handle("papu:window:minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
  return { ok: true };
});

ipcMain.handle("papu:window:toggleMaximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { isMaximized: false };
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
  return { isMaximized: win.isMaximized() };
});

ipcMain.handle("papu:window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
  return { ok: true };
});

ipcMain.handle("papu:update:getState", () => updateState);
ipcMain.handle("papu:update:checkNow", () => {
  startAutoUpdateCheck();
  return { ok: true };
});

app.whenReady().then(() => {
  configureRuntimeEnv();
  openInitialWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openInitialWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
