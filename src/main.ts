import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loginMicrosoft } from "./auth.js";
import { getFabricGameVersions, getFabricLoaderVersions, isFabricComboAvailable } from "./fabric.js";
import { launchMinecraft } from "./launch.js";

function pickRecentStable<T extends { version: string; stable: boolean }>(list: T[], count: number): T[] {
  return list.filter((x) => x.stable).slice(0, count);
}

async function main(): Promise<void> {
  console.log("PapuClient MVP - Launcher Fabric");
  console.log("Iniciando login Microsoft...");

  const auth = await loginMicrosoft();
  console.log(`Sesion iniciada: ${auth.name} (${auth.uuid})`);

  const [games, loaders] = await Promise.all([getFabricGameVersions(), getFabricLoaderVersions()]);
  const gameCandidates = pickRecentStable(games, 10);
  const loaderCandidates = pickRecentStable(loaders, 5);

  if (!gameCandidates.length || !loaderCandidates.length) {
    throw new Error("No hay versiones de Fabric disponibles.");
  }

  console.log("\nVersiones de juego disponibles:");
  gameCandidates.forEach((g, i) => console.log(`${i + 1}. ${g.version}`));

  const rl = readline.createInterface({ input, output });

  const gameIdxRaw = await rl.question("Elige version de Minecraft (numero): ");
  const gameIdx = Number.parseInt(gameIdxRaw, 10) - 1;
  const gameVersion = gameCandidates[gameIdx]?.version;

  if (!gameVersion) {
    rl.close();
    throw new Error("Seleccion de version de juego invalida.");
  }

  console.log("\nLoaders Fabric disponibles:");
  loaderCandidates.forEach((l, i) => console.log(`${i + 1}. ${l.version}`));

  const loaderIdxRaw = await rl.question("Elige loader Fabric (numero): ");
  const loaderIdx = Number.parseInt(loaderIdxRaw, 10) - 1;
  const loaderVersion = loaderCandidates[loaderIdx]?.version;

  if (!loaderVersion) {
    rl.close();
    throw new Error("Seleccion de loader invalida.");
  }

  const memoryRaw = await rl.question("RAM maxima en MB (ej: 4096): ");
  rl.close();

  const memoryMb = Number.parseInt(memoryRaw, 10);
  if (!Number.isFinite(memoryMb) || memoryMb < 2048) {
    throw new Error("RAM invalida. Usa 2048 MB o mas.");
  }

  const comboOk = await isFabricComboAvailable(gameVersion, loaderVersion);
  if (!comboOk) {
    throw new Error(`La combinacion Fabric no existe: ${gameVersion} + ${loaderVersion}`);
  }

  console.log(`\nLanzando Minecraft Fabric ${gameVersion} / loader ${loaderVersion}...`);
  await launchMinecraft(auth, { gameVersion, fabricLoaderVersion: loaderVersion, memoryMb });
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Error:", msg);
  process.exit(1);
});
