import fs from "node:fs/promises";
import path from "node:path";

const MODRINTH_API = "https://api.modrinth.com/v2";
const USER_AGENT = "PapuClient/0.1.0";

export type ModrinthSearchInput = {
  query: string;
  gameVersion: string;
  category: string;
  sort: string;
  offset: number;
  limit: number;
};

export type ModrinthSearchResult = {
  totalHits: number;
  hits: Array<{
    id: string;
    projectId: string;
    slug: string;
    title: string;
    author: string;
    description: string;
    category: string;
    categories: string[];
    downloads: number;
    updatedAt: string;
    compatible: string[];
    versions: string[];
    iconUrl: string;
  }>;
};

type SearchResponse = {
  total_hits: number;
  hits: Array<{
    slug: string;
    project_id: string;
    title: string;
    author: string;
    description: string;
    categories?: string[];
    downloads: number;
    date_modified: string;
    versions?: string[];
    icon_url?: string | null;
  }>;
};

type VersionResponse = Array<{
  id: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: Array<{
    url: string;
    filename: string;
    primary?: boolean;
  }>;
}>;

function searchIndex(sort: string): string {
  if (sort === "downloads") return "downloads";
  if (sort === "updated") return "updated";
  if (sort === "newest") return "newest";
  return "relevance";
}

function buildFacets(input: ModrinthSearchInput): string {
  const facets = [["project_type:mod"]];

  // Keep the browser launcher-focused without over-constraining discovery.
  facets.push(["categories:fabric"]);

  if (input.gameVersion) {
    facets.push([`versions:${input.gameVersion}`]);
  }

  if (input.category && input.category !== "all" && input.category !== "Instalado") {
    facets.push([`categories:${input.category.toLowerCase()}`]);
  }

  return JSON.stringify(facets);
}

async function modrinthFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT
    }
  });
}

export async function searchModrinthMods(input: ModrinthSearchInput): Promise<ModrinthSearchResult> {
  const params = new URLSearchParams({
    query: input.query || "",
    facets: buildFacets(input),
    index: searchIndex(input.sort),
    offset: String(input.offset),
    limit: String(input.limit)
  });

  const response = await modrinthFetch(`${MODRINTH_API}/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Modrinth respondio con ${response.status}`);
  }

  const payload = await response.json() as SearchResponse;
  const hits = Array.isArray(payload?.hits) ? payload.hits : [];

  return {
    totalHits: Number(payload?.total_hits || 0),
    hits: hits.map((hit) => ({
      id: hit.slug || hit.project_id,
      projectId: hit.project_id,
      slug: hit.slug || hit.project_id,
      title: hit.title,
      author: hit.author,
      description: hit.description,
      category: Array.isArray(hit.categories) && hit.categories.length ? hit.categories[0] : "mod",
      categories: Array.isArray(hit.categories) ? hit.categories : [],
      downloads: Number(hit.downloads || 0),
      updatedAt: hit.date_modified || "",
      compatible: Array.isArray(hit.versions) ? hit.versions : [],
      versions: Array.isArray(hit.versions) ? hit.versions : [],
      iconUrl: hit.icon_url || ""
    }))
  };
}

export async function installModrinthMod(input: {
  projectId: string;
  gameVersion: string;
  loader: string;
  instanceDir: string;
}): Promise<{ fileName: string; version: string }> {
  const params = new URLSearchParams({
    loaders: JSON.stringify([input.loader]),
    game_versions: JSON.stringify([input.gameVersion])
  });

  const response = await modrinthFetch(`${MODRINTH_API}/project/${input.projectId}/version?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`No se pudieron consultar versiones en Modrinth (${response.status})`);
  }

  const versions = await response.json() as VersionResponse;
  const safeVersions = Array.isArray(versions) ? versions : [];
  const version = safeVersions[0];
  if (!version) {
    throw new Error("No hay versiones compatibles para este mod.");
  }

  const fileList = Array.isArray(version.files) ? version.files : [];
  const file = fileList.find((entry) => entry.primary) ?? fileList[0];
  if (!file?.url || !file.filename) {
    throw new Error("La version seleccionada no tiene archivo descargable.");
  }

  const modsDir = path.join(input.instanceDir, "mods");
  await fs.mkdir(modsDir, { recursive: true });

  const download = await modrinthFetch(file.url);
  if (!download.ok) {
    throw new Error(`No se pudo descargar el mod (${download.status})`);
  }

  const buffer = Buffer.from(await download.arrayBuffer());
  await fs.writeFile(path.join(modsDir, file.filename), buffer);

  return {
    fileName: file.filename,
    version: version.version_number
  };
}
