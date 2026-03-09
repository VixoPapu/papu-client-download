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

async function ensureFabricVersionJson(root: string, gameVersion: string, fabricLoaderVersion: string): Promise<string> {
  const versionId = `fabric-loader-${fabricLoaderVersion}-${gameVersion}`;
  const profileUrl = `https://meta.fabricmc.net/v2/versions/loader/${gameVersion}/${fabricLoaderVersion}/profile/json`;
  const response = await fetch(profileUrl);

  if (!response.ok) {
    throw new Error(`No se pudo descargar profile Fabric: ${response.status}`);
  }

  const profileText = await response.text();
  const versionDir = path.join(root, "versions", versionId);
  const versionJsonPath = path.join(versionDir, `${versionId}.json`);

  await fs.mkdir(versionDir, { recursive: true });
  await fs.writeFile(versionJsonPath, profileText, "utf8");

  return versionId;
}

export async function launchMinecraft(auth: MinecraftAuth, cfg: LaunchConfig): Promise<void> {
  const launcher = new Client();
  const root = getDataRoot();

  const versionId = await ensureFabricVersionJson(root, cfg.gameVersion, cfg.fabricLoaderVersion);
  const gameDirectory = path.join(root, "instances", versionId);

  await syncRequiredMods({
    root,
    gameVersion: cfg.gameVersion,
    instanceDir: gameDirectory
  });

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

  launcher.on("debug", (e: unknown) => console.log("[debug]", e));
  launcher.on("data", (e: unknown) => console.log("[mc]", e));
  launcher.on("progress", (e: unknown) => console.log("[download]", e));

  await launcher.launch(options);
}
