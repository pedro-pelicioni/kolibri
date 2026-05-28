// Persistência de tokens JWT + identidade de sessão.
//
// AsyncStorage NÃO é seguro pra refresh tokens em produção
// (`react-native-keychain` é o caminho correto). Pra MVP devnet vale; antes de
// mainnet trocar pelo keychain.

import AsyncStorage from '@react-native-async-storage/async-storage';

const K_ACCESS = '@kolibri/access_token';
const K_REFRESH = '@kolibri/refresh_token';
const K_TENANT = '@kolibri/tenant_id';
const K_ROLE = '@kolibri/role';
const K_AGENT = '@kolibri/agent_name';
const K_PUBKEY = '@kolibri/pubkey';

export interface PersistedSession {
  accessToken: string;
  refreshToken: string;
  tenantId?: string;
  role?: string;
  agentName?: string;
  pubkey: string;
}

export async function persistSession(s: PersistedSession): Promise<void> {
  await AsyncStorage.multiSet([
    [K_ACCESS, s.accessToken],
    [K_REFRESH, s.refreshToken],
    [K_TENANT, s.tenantId ?? ''],
    [K_ROLE, s.role ?? ''],
    [K_AGENT, s.agentName ?? ''],
    [K_PUBKEY, s.pubkey],
  ]);
}

export async function loadSession(): Promise<PersistedSession | null> {
  const entries = await AsyncStorage.multiGet([
    K_ACCESS, K_REFRESH, K_TENANT, K_ROLE, K_AGENT, K_PUBKEY,
  ]);
  const map = Object.fromEntries(entries) as Record<string, string | null>;
  if (!map[K_ACCESS] || !map[K_REFRESH] || !map[K_PUBKEY]) return null;
  return {
    accessToken: map[K_ACCESS]!,
    refreshToken: map[K_REFRESH]!,
    tenantId: map[K_TENANT] || undefined,
    role: map[K_ROLE] || undefined,
    agentName: map[K_AGENT] || undefined,
    pubkey: map[K_PUBKEY]!,
  };
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([K_ACCESS, K_REFRESH, K_TENANT, K_ROLE, K_AGENT, K_PUBKEY]);
}
