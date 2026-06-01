import type { WalletError } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { type ReactNode, useCallback, useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = import.meta.env.VITE_SOLANA_RPC_URL;
  // Phantom/Solflare explícitos; demais (MetaMask, Backpack, Hana…) entram via Wallet Standard.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );
  const onError = useCallback((err: WalletError) => {
    console.warn("[wallet]", err.name, err.message);
  }, []);

  // autoConnect=false: no nosso fluxo o wallet só serve pro login (depois é JWT +
  // server-custody). Reconectar sozinho numa carteira travada (ex.: Hana bloqueada)
  // deixava a página presa "conectando" sem saída.
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
