import os from "node:os";
import path from "node:path";

export function getAppRoot(): string {
  return process.env.PAPUCLIENT_APP_ROOT?.trim() || process.cwd();
}

export function getExtraRoot(): string {
  return process.env.PAPUCLIENT_EXTRA_ROOT?.trim() || getAppRoot();
}

export function getDataRoot(): string {
  return process.env.PAPUCLIENT_DATA_DIR?.trim() || path.join(os.homedir(), ".papuclient");
}
