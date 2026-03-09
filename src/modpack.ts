import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getAppRoot } from "./paths.js";

type RequiredMod = {
  id: string;
  fileName: string;
  url?: string;
  localPath?: string;
  sha512?: string;
};

type ModpackConfig = {
  modpacks: Record<string, RequiredMod[]>;
};

type SyncInput = {
  root: string;
  gameVersion: string;
  instanceDir: string;
};

const APP_ROOT = getAppRoot();
const CONFIG_PATH = path.join(APP_ROOT, "config", "modpacks.json");
const BUNDLED_MODS_DIR = path.join(APP_ROOT, "bundled-mods");

function versionBranch(gameVersion: string): string | null {
  const m = gameVersion.match(/^(\d+)\.(\d+)/);
  if (!m) return null;
  return `${m[1]}.${m[2]}`;
}

async function collectBundledMods(gameVersion: string): Promise<RequiredMod[]> {
  const folders: string[] = [
    path.join(BUNDLED_MODS_DIR, "common"),
    path.join(BUNDLED_MODS_DIR, gameVersion)
  ];

  const branch = versionBranch(gameVersion);
  if (branch) {
    folders.splice(1, 0, path.join(BUNDLED_MODS_DIR, branch));
  }

  const modsByFile = new Map<string, RequiredMod>();

  for (const folder of folders) {
    if (!(await fileExists(folder))) continue;
    const entries = await fs.readdir(folder, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !e.name.toLowerCase().endsWith(".jar")) continue;
      const relPath = path.relative(APP_ROOT, path.join(folder, e.name)).replaceAll("\\", "/");
      modsByFile.set(e.name, {
        id: e.name.replace(/\.jar$/i, ""),
        fileName: e.name,
        localPath: relPath
      });
    }
  }

  return [...modsByFile.values()];
}

async function readModpackConfig(): Promise<ModpackConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as ModpackConfig;
  } catch {
    return { modpacks: {} };
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sha512File(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return createHash("sha512").update(data).digest("hex");
}

async function downloadToFile(url: string, targetPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo descargar mod (${response.status}): ${url}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, bytes);
}

async function installMod(mod: RequiredMod, targetPath: string): Promise<void> {
  if (mod.localPath) {
    const sourcePath = path.resolve(APP_ROOT, mod.localPath);
    const exists = await fileExists(sourcePath);
    if (!exists) {
      throw new Error(`No existe el mod local ${mod.id}: ${sourcePath}`);
    }
    await fs.copyFile(sourcePath, targetPath);
    return;
  }

  if (mod.url) {
    await downloadToFile(mod.url, targetPath);
    return;
  }

  throw new Error(`Mod invalido ${mod.id}: define "localPath" o "url"`);
}

export async function syncRequiredMods(input: SyncInput): Promise<void> {
  const config = await readModpackConfig();
  let requiredMods = config.modpacks[input.gameVersion] ?? [];

  // Easy mode: if no explicit config, auto-load all jars from bundled-mods/<gameVersion>/
  if (!requiredMods.length) {
    requiredMods = await collectBundledMods(input.gameVersion);
  }

  const modsDir = path.join(input.instanceDir, "mods");
  await fs.mkdir(modsDir, { recursive: true });

  if (!requiredMods.length) {
    console.log(`[mods] No hay mods requeridos configurados para ${input.gameVersion}`);
    return;
  }

  console.log(`[mods] Sincronizando ${requiredMods.length} mods requeridos para ${input.gameVersion}...`);

  for (const mod of requiredMods) {
    const targetPath = path.join(modsDir, mod.fileName);
    const exists = await fileExists(targetPath);

    let mustInstall = !exists;

    if (exists && mod.sha512) {
      const currentHash = await sha512File(targetPath);
      mustInstall = currentHash.toLowerCase() !== mod.sha512.toLowerCase();
    }

    if (mustInstall) {
      console.log(`[mods] Instalando/actualizando: ${mod.id}`);
      await installMod(mod, targetPath);

      if (mod.sha512) {
        const installedHash = await sha512File(targetPath);
        if (installedHash.toLowerCase() !== mod.sha512.toLowerCase()) {
          throw new Error(`Hash invalido para mod ${mod.id}. Esperado ${mod.sha512}, obtenido ${installedHash}`);
        }
      }
    } else {
      console.log(`[mods] OK: ${mod.id}`);
    }
  }

  const presentFiles = await fs.readdir(modsDir);
  const requiredNames = new Set(requiredMods.map((m) => m.fileName));

  for (const fileName of presentFiles) {
    if (!requiredNames.has(fileName)) {
      const extraPath = path.join(modsDir, fileName);
      await fs.rm(extraPath, { force: true });
      console.log(`[mods] Removido mod no permitido: ${fileName}`);
    }
  }
}
