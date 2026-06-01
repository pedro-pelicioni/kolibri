export function shortAddr(addr: string | null | undefined, n = 4): string {
  if (!addr) return "—";
  return addr.length <= n * 2 + 1 ? addr : `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bytesToB64(bytes: Iterable<number>): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

const rpc = import.meta.env.VITE_SOLANA_RPC_URL ?? "";
const cluster = import.meta.env.VITE_SOLANA_CLUSTER ?? "devnet";
const isLocal = /localhost|127\.0\.0\.1/.test(rpc);

// Em local, o Explorer abre o validador local via ?cluster=custom&customUrl=...
// Em devnet/mainnet, usa o moniker normal.
function clusterQuery(): string {
  return isLocal
    ? `cluster=custom&customUrl=${encodeURIComponent(rpc)}`
    : `cluster=${cluster}`;
}

export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?${clusterQuery()}`;
}
export function explorerAddr(address: string): string {
  return `https://explorer.solana.com/address/${address}?${clusterQuery()}`;
}
