import fs from "node:fs/promises";
import path from "node:path";
import type { MinecraftAuth } from "./auth.js";
import { loginMicrosoft } from "./auth.js";
import { getFabricGameVersions, getFabricLoadersForGameVersion, isFabricComboAvailable } from "./fabric.js";
import { launchMinecraft } from "./launch.js";
import { installModrinthMod, searchModrinthMods } from "./modrinth.js";
import { addChatFriend, fetchChatCallSignals, getChatStatus, respondChatCallRemote, respondChatFriendRequest, sendChatCallSignal, sendChatMessageRemote, syncChatState, toggleChatCallRemote } from "./chat.js";
import { getDataRoot } from "./paths.js";

let currentAuth: MinecraftAuth | null = null;
const MIN_VERSION = "1.20.0";
const MAX_VERSION = "1.21.11";
const INSTANCES_DIR = path.join(getDataRoot(), "instances");

export type InstalledModInfo = {
  id: string;
  fileName: string;
  displayName: string;
  version: string;
  description: string;
  iconDataUrl?: string;
};

function pickRecentStable<T extends { version: string; stable: boolean }>(list: T[], count: number): T[] {
  return list.filter((x) => x.stable).slice(0, count);
}

function parseMcVersion(version: string): [number, number, number] | null {
  const m = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? "0")];
}

function compareMcVersion(a: string, b: string): number {
  const pa = parseMcVersion(a);
  const pb = parseMcVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function isAllowedVersion(version: string): boolean {
  return compareMcVersion(version, MIN_VERSION) >= 0 && compareMcVersion(version, MAX_VERSION) <= 0;
}

function normalizeModKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.jar$/i, "")
    .replace(/[_+.\s]+/g, "-")
    .replace(/-?\d+(?:\.\d+)+(?:[-+a-z0-9.]*)?$/i, "")
    .replace(/-fabric$/i, "")
    .replace(/-mc$/i, "")
    .replace(/-+$/g, "");
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listInstanceDirs(gameVersion: string): Promise<string[]> {
  if (!(await pathExists(INSTANCES_DIR))) return [];
  const entries = await fs.readdir(INSTANCES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(`-${gameVersion}`))
    .map((entry) => path.join(INSTANCES_DIR, entry.name));
}

async function resolveInstanceDir(gameVersion: string, loaderVersion: string): Promise<string> {
  const versionId = `fabric-loader-${loaderVersion}-${gameVersion}`;
  const exact = path.join(INSTANCES_DIR, versionId);
  if (await pathExists(exact)) return exact;
  return exact;
}

async function readJarMetadata(filePath: string): Promise<InstalledModInfo> {
  const fileName = path.basename(filePath);
  const fallbackId = normalizeModKey(fileName) || fileName.replace(/\.jar$/i, "");
  const fallbackDisplay = fileName.replace(/\.jar$/i, "");

  try {
    const adm = await import("adm-zip");
    const AdmZip = (adm.default ?? adm) as new (path: string) => {
      getEntry: (name: string) => { getData: () => Buffer } | null;
      readAsText: (entry: string) => string;
    };
    const zip = new AdmZip(filePath);
    const raw = zip.readAsText("fabric.mod.json");
    const parsed = JSON.parse(raw) as {
      id?: string;
      name?: string;
      version?: string;
      description?: string;
      icon?: string | Record<string, string>;
      icons?: Record<string, string>;
    };

    let iconPath = "";
    if (typeof parsed.icon === "string") iconPath = parsed.icon;
    if (!iconPath && parsed.icon && typeof parsed.icon === "object") {
      const sizes = Object.keys(parsed.icon).sort((a, b) => Number(b) - Number(a));
      iconPath = sizes.length ? parsed.icon[sizes[0]] ?? "" : "";
    }
    if (!iconPath && parsed.icons) {
      const sizes = Object.keys(parsed.icons).sort((a, b) => Number(b) - Number(a));
      iconPath = sizes.length ? parsed.icons[sizes[0]] ?? "" : "";
    }

    let iconDataUrl = "";
    if (iconPath) {
      const entry = zip.getEntry(iconPath);
      if (entry) {
        const buffer = entry.getData();
        const ext = path.extname(iconPath).toLowerCase();
        const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
        iconDataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      }
    }

    return {
      id: normalizeModKey(parsed.id || parsed.name || fallbackId) || fallbackId,
      fileName,
      displayName: parsed.name || fallbackDisplay,
      version: parsed.version || "",
      description: parsed.description || "",
      iconDataUrl: iconDataUrl || undefined
    };
  } catch {
    return {
      id: fallbackId,
      fileName,
      displayName: fallbackDisplay,
      version: "",
      description: "",
      iconDataUrl: undefined
    };
  }
}

export async function login(): Promise<{ name: string; uuid: string }> {
  currentAuth = await loginMicrosoft();
  return { name: currentAuth.name, uuid: currentAuth.uuid };
}

export function getCurrentUser(): { name: string; uuid: string } | null {
  if (!currentAuth) {
    return null;
  }

  return { name: currentAuth.name, uuid: currentAuth.uuid };
}

function requireCurrentUser(): { name: string; uuid: string } {
  if (!currentAuth) throw new Error("Debes iniciar sesion primero.");
  return { name: currentAuth.name, uuid: currentAuth.uuid };
}

export function logout(): { ok: true } {
  currentAuth = null;
  return { ok: true };
}

export async function listGameVersions(): Promise<string[]> {
  const games = await getFabricGameVersions();
  return pickRecentStable(games, 100)
    .map((x) => x.version)
    .filter(isAllowedVersion);
}

export async function listLoaderVersions(): Promise<string[]> {
  const versions = await listGameVersions();
  const latestGame = versions[0];
  if (!latestGame) {
    return [];
  }

  return listCompatibleLoaderVersions(latestGame);
}

export async function listCompatibleLoaderVersions(gameVersion: string): Promise<string[]> {
  const loaders = await getFabricLoadersForGameVersion(gameVersion);
  return pickRecentStable(loaders, 20).map((x) => x.version);
}

export async function listInstalledMods(gameVersion: string): Promise<InstalledModInfo[]> {
  const dirs = await listInstanceDirs(gameVersion);
  const modsById = new Map<string, InstalledModInfo>();

  for (const dir of dirs) {
    const modsDir = path.join(dir, "mods");
    if (!(await pathExists(modsDir))) continue;
    const entries = await fs.readdir(modsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".jar")) continue;
      const info = await readJarMetadata(path.join(modsDir, entry.name));
      if (!modsById.has(info.id)) {
        modsById.set(info.id, info);
      }
    }
  }

  return [...modsById.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
}

export async function searchRemoteMods(input: {
  query: string;
  gameVersion: string;
  category: string;
  sort: string;
  offset: number;
  limit: number;
}) {
  return searchModrinthMods(input);
}

export async function installRemoteMod(input: {
  projectId: string;
  gameVersion: string;
  loaderVersion: string;
}) {
  const instanceDir = await resolveInstanceDir(input.gameVersion, input.loaderVersion);
  return installModrinthMod({
    projectId: input.projectId,
    gameVersion: input.gameVersion,
    loader: "fabric",
    instanceDir
  });
}

export async function startLaunch(input: {
  gameVersion: string;
  loaderVersion: string;
  memoryMb: number;
}, report?: (message: string) => void): Promise<void> {
  if (!currentAuth) {
    throw new Error("Debes iniciar sesion primero.");
  }

  let finalLoaderVersion = input.loaderVersion.trim();
  const comboOk = await isFabricComboAvailable(input.gameVersion, finalLoaderVersion);
  if (!comboOk) {
    const compatible = await listCompatibleLoaderVersions(input.gameVersion);
    const fallback = compatible[0];
    if (!fallback) {
      throw new Error(`No hay loaders Fabric compatibles para ${input.gameVersion}`);
    }
    finalLoaderVersion = fallback;
  }

  await launchMinecraft(currentAuth, {
    gameVersion: input.gameVersion,
    fabricLoaderVersion: finalLoaderVersion,
    memoryMb: input.memoryMb
  }, report);
}

export async function getChatBackendStatus() {
  return getChatStatus();
}

export async function syncRemoteChat(input: { selectedFriendId: string }) {
  return syncChatState(requireCurrentUser(), input.selectedFriendId);
}

export async function addRemoteChatFriend(input: { accountName: string }) {
  return addChatFriend(requireCurrentUser(), input.accountName);
}

export async function respondRemoteChatFriendRequest(input: { friendId: string; action: "accept" | "reject" }) {
  return respondChatFriendRequest(requireCurrentUser(), input.friendId, input.action);
}

export async function sendRemoteChatMessage(input: { friendId: string; text: string }) {
  return sendChatMessageRemote(requireCurrentUser(), input.friendId, input.text);
}

export async function toggleRemoteChatCall(input: { friendId: string }) {
  return toggleChatCallRemote(requireCurrentUser(), input.friendId);
}

export async function fetchRemoteChatCallSignals(input: { sessionId: string; friendId: string; afterId: number }) {
  return fetchChatCallSignals(requireCurrentUser(), input);
}

export async function sendRemoteChatCallSignal(input: {
  sessionId: string;
  friendId: string;
  type: "offer" | "answer" | "ice-candidate" | "hangup";
  payload: Record<string, unknown>;
}) {
  return sendChatCallSignal(requireCurrentUser(), input);
}

export async function respondRemoteChatCall(input: { friendId: string; action: "accept" | "reject" }) {
  return respondChatCallRemote(requireCurrentUser(), input);
}
