// Single source of truth para o que muda entre dev/prod/demo.
//
// Para rodar o demo SEM gateway/wallet reais (e.g. apresentação, screenshot
// run), deixe `useStub = true`. Para apontar pro backend de produção da DPO2U
// e o Seed Vault no Seeker, flipar pra `false`.
//
// `useStub` também controla o MobileWalletAdapter (src/wallet/), então a flag
// é única — não tem como ficar "metade real, metade mock" por acidente.

export type Cluster = 'mainnet-beta' | 'devnet' | 'testnet';

export interface AppConfig {
  /** Aponta toda a camada api/ + wallet/ pro modo mock. */
  useStub: boolean;
  /** Base URL do kolibri-gateway. Produção está em dpo2u.com/kolibri. */
  gatewayBaseUrl: string;
  /** Cluster Solana usado por MWA + verificação de PDAs. */
  cluster: Cluster;
  /** Identidade que aparece no consent screen do Seed Vault. */
  appIdentity: { name: string; uri: string; icon: string };
}

export const config: AppConfig = {
  useStub: true,
  gatewayBaseUrl: 'https://dpo2u.com/kolibri',
  cluster: 'devnet',
  appIdentity: {
    name: 'Kolibri',
    uri: 'https://dpo2u.com/kolibri',
    icon: 'favicon.ico',
  },
};
