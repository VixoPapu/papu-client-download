import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "minecraft-launcher-core";
import type { MinecraftAuth } from "./auth.js";
import { syncRequiredMods } from "./modpack.js";
import { getDataRoot } from "./paths.js";

export type LaunchConfig = {
  gameVersion: string;
  fabricLoaderVersion: string;
  memoryMb: number;
};

type LaunchProgressReporter = (message: string) => void;
type LaunchProgressState = "installing" | "running" | "closed";
type LaunchProgressPayload = {
  message: string;
  stage: LaunchProgressState;
};

function emitProgress(report: LaunchProgressReporter | undefined, message: string, _stage: LaunchProgressState): void {
  report?.(JSON.stringify({ message, stage: _stage } satisfies LaunchProgressPayload));
}

async function ensureFabricVersionJson(root: string, gameVersion: string, fabricLoaderVersion: string, report?: LaunchProgressReporter): Promise<string> {
  const versionId = `fabric-loader-${fabricLoaderVersion}-${gameVersion}`;
  const profileUrl = `https://meta.fabricmc.net/v2/versions/loader/${gameVersion}/${fabricLoaderVersion}/profile/json`;
  emitProgress(report, `Descargando perfil de Fabric ${fabricLoaderVersion} para ${gameVersion}...`, "installing");
  const response = await fetch(profileUrl);

  if (!response.ok) {
    throw new Error(`No se pudo descargar profile Fabric: ${response.status}`);
  }

  const profileText = await response.text();
  const versionDir = path.join(root, "versions", versionId);
  const versionJsonPath = path.join(versionDir, `${versionId}.json`);

  await fs.mkdir(versionDir, { recursive: true });
  await fs.writeFile(versionJsonPath, profileText, "utf8");
  emitProgress(report, "Perfil de Fabric listo.", "installing");

  return versionId;
}

function formatLauncherProgress(payload: any): string {
  if (!payload || typeof payload !== "object") return "Descargando archivos del juego...";
  if (typeof payload.task === "number" && typeof payload.total === "number" && payload.total > 0) {
    const percent = Math.max(0, Math.min(100, Math.round((payload.task / payload.total) * 100)));
    return `Descargando archivos del juego... ${percent}%`;
  }
  if (typeof payload.type === "string" && payload.type.trim()) {
    return `Preparando Minecraft: ${payload.type}`;
  }
  return "Descargando archivos del juego...";
}

export async function launchMinecraft(auth: MinecraftAuth, cfg: LaunchConfig, report?: LaunchProgressReporter): Promise<void> {
  const launcher = new Client();
  const root = getDataRoot();
  const recentLines: string[] = [];
  let hasReachedRunningState = false;

  function rememberLine(prefix: string, value: unknown): void {
    const text = String(value ?? "").trim();
    if (!text) return;
    recentLines.push(`${prefix}${text}`);
    if (recentLines.length > 12) recentLines.shift();
  }

  emitProgress(report, `Preparando ${cfg.gameVersion} + Fabric ${cfg.fabricLoaderVersion}...`, "installing");
  const versionId = await ensureFabricVersionJson(root, cfg.gameVersion, cfg.fabricLoaderVersion, report);
  const gameDirectory = path.join(root, "instances", versionId);

  emitProgress(report, "Instalando mods base del launcher...", "installing");
  await syncRequiredMods({
    root,
    gameVersion: cfg.gameVersion,
    instanceDir: gameDirectory
  });
  emitProgress(report, "Mods base listos. Verificando archivos de Minecraft...", "installing");

  const options = {
    authorization: auth.mclcAuth,
    root,
    customArgs: [
      "-Duser.language=en",
      "-Duser.country=US"
    ],
    version: {
      number: cfg.gameVersion,
      type: "release",
      custom: versionId
    },
    memory: {
      max: `${cfg.memoryMb}M`,
      min: "1024M"
    },
    overrides: {
      versionName: versionId,
      gameDirectory,
      detached: false
    }
  };

  launcher.on("debug", (e: unknown) => {
    console.log("[debug]", e);
    rememberLine("", e);
  });
  launcher.on("data", (e: unknown) => {
    console.log("[mc]", e);
    rememberLine("", e);
  });
  launcher.on("arguments", (e: unknown) => {
    console.log("[args]", e);
  });
  launcher.on("progress", (e: unknown) => {
    console.log("[download]", e);
    emitProgress(report, formatLauncherProgress(e), "installing");
  });
  launcher.on("error", (e: unknown) => {
    console.log("[launch-error]", e);
    rememberLine("Error: ", e);
  });
  launcher.on("close", () => {
    const suffix = !hasReachedRunningState && recentLines.length
      ? ` Ultimo detalle: ${recentLines[recentLines.length - 1]}`
      : "";
    emitProgress(report, `Minecraft se cerro.${suffix}`, "closed");
  });

  emitProgress(report, "Iniciando Minecraft. La primera carga puede tardar varios minutos...", "installing");
  await launcher.launch(options);
  hasReachedRunningState = true;
  emitProgress(report, "Minecraft lanzado.", "running");
}
