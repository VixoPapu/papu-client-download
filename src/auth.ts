import { randomUUID } from "node:crypto";
import { Auth } from "msmc";

export type MinecraftAuth = {
  name: string;
  uuid: string;
  accessToken: string;
  mclcAuth: {
    access_token: string;
    client_token: string;
    uuid: string;
    name: string;
    user_properties: Record<string, unknown>;
    meta: {
      type: "msa";
      demo?: boolean;
    };
  };
};

export async function loginMicrosoft(): Promise<MinecraftAuth> {
  const authManager = new Auth("select_account");
  const xboxManager = await authManager.launch("raw");
  const mcToken = await xboxManager.getMinecraft();
  const mclc = mcToken.mclc();

  if (!mclc.access_token || !mclc.uuid || !mclc.name) {
    throw new Error("No se pudo obtener un perfil completo de Minecraft en la autenticacion.");
  }

  const normalized = {
    access_token: mclc.access_token,
    client_token: mclc.client_token ?? randomUUID(),
    uuid: mclc.uuid,
    name: mclc.name,
    user_properties: (mclc.user_properties ?? {}) as Record<string, unknown>,
    meta: {
      type: "msa" as const,
      demo: mclc.meta?.demo
    }
  };

  return {
    name: normalized.name,
    uuid: normalized.uuid,
    accessToken: normalized.access_token,
    mclcAuth: normalized
  };
}
