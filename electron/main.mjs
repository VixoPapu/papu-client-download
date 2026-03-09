import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadService() {
  return import("../dist/service.js");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0a0f1f",
    title: "PapuClient",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, "../app/index.html"));
}

ipcMain.handle("papu:getUser", async () => {
  const service = await loadService();
  return service.getCurrentUser();
});

ipcMain.handle("papu:login", async () => {
  const service = await loadService();
  return service.login();
});

ipcMain.handle("papu:listGames", async () => {
  const service = await loadService();
  return service.listGameVersions();
});

ipcMain.handle("papu:listLoaders", async () => {
  const service = await loadService();
  return service.listLoaderVersions();
});

ipcMain.handle("papu:launch", async (_event, payload) => {
  const service = await loadService();
  await service.startLaunch(payload);
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
