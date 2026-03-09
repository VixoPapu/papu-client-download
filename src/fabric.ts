export type FabricGameVersion = {
  version: string;
  stable: boolean;
};

export type FabricLoaderVersion = {
  version: string;
  stable: boolean;
};

const FABRIC_META = "https://meta.fabricmc.net/v2/versions";

export async function getFabricGameVersions(): Promise<FabricGameVersion[]> {
  const response = await fetch(`${FABRIC_META}/game`);
  if (!response.ok) {
    throw new Error(`No se pudo obtener versiones de juego Fabric: ${response.status}`);
  }

  const data = (await response.json()) as FabricGameVersion[];
  return data;
}

export async function getFabricLoaderVersions(): Promise<FabricLoaderVersion[]> {
  const response = await fetch(`${FABRIC_META}/loader`);
  if (!response.ok) {
    throw new Error(`No se pudo obtener versiones de loader Fabric: ${response.status}`);
  }

  const data = (await response.json()) as FabricLoaderVersion[];
  return data;
}

export async function getFabricLoadersForGameVersion(gameVersion: string): Promise<FabricLoaderVersion[]> {
  const response = await fetch(`${FABRIC_META}/loader/${gameVersion}`);
  if (!response.ok) {
    throw new Error(`No se pudo obtener loaders compatibles para ${gameVersion}: ${response.status}`);
  }

  const data = (await response.json()) as Array<{ loader: FabricLoaderVersion }>;
  return data.map((x) => x.loader);
}

export async function isFabricComboAvailable(gameVersion: string, loaderVersion: string): Promise<boolean> {
  const response = await fetch(`${FABRIC_META}/versions/loader/${gameVersion}/${loaderVersion}/profile/json`);
  return response.ok;
}
