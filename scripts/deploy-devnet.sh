#!/usr/bin/env bash
# Kolibri — deploy do programa na devnet + aponta API/web pra devnet, num passo só.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEVNET_RPC="https://api.devnet.solana.com"
PROGRAM_ID="Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF"
WALLET="$(solana address 2>/dev/null || echo '?')"

echo "▸ Kolibri — deploy na devnet"
echo "  wallet de deploy: $WALLET"

# 1) saldo (precisa de ~1.5 SOL p/ o programa)
BAL="$(solana balance --url "$DEVNET_RPC" 2>/dev/null | awk '{print $1}')"
BAL="${BAL:-0}"
echo "  saldo devnet:     ${BAL} SOL"
if awk "BEGIN{exit !(${BAL} < 1.5)}"; then
  echo ""
  echo "✗ Saldo insuficiente (precisa de ~1.5 SOL). Financie a wallet e rode de novo:"
  echo "    $WALLET"
  echo "  Faucet:  https://faucet.solana.com  (selecione a rede Devnet)"
  echo "  Alt.:    https://faucet.quicknode.com/solana/devnet"
  exit 1
fi

# 2) deploy
echo "▸ anchor deploy (devnet)…"
( cd programs && anchor deploy --provider.cluster devnet )

# 3) aponta API + web pra devnet (sed -i.bak p/ compatibilidade macOS)
echo "▸ apontando .env para devnet…"
sed -i.bak "s|^SOLANA_RPC_URL=.*|SOLANA_RPC_URL=${DEVNET_RPC}|" apps/api/.env && rm -f apps/api/.env.bak
sed -i.bak "s|^VITE_SOLANA_RPC_URL=.*|VITE_SOLANA_RPC_URL=${DEVNET_RPC}|" apps/web/.env && rm -f apps/web/.env.bak
sed -i.bak "s|^VITE_SOLANA_CLUSTER=.*|VITE_SOLANA_CLUSTER=devnet|" apps/web/.env && rm -f apps/web/.env.bak

echo ""
echo "✅ Programa na devnet — visível no explorador público:"
echo "   https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet"
echo ""
echo "Agora reinicie os servidores SEM override local (pare o validador local antes, se estiver rodando):"
echo "   pkill -f solana-test-validator ; pkill -f 'tsx .*server.ts' ; pnpm dev"
echo ""
echo "Aí o NFT minta de verdade, os links viram cluster=devnet e o 'Verificar on-chain' fecha o ciclo."
echo ""
echo "(Opcional) selo 'Verified' no Solscan — precisa do repo público no GitHub:"
echo "   solana-verify verify-from-repo --mount-path programs --library-name kolibri_registry \\"
echo "     --program-id ${PROGRAM_ID} -u ${DEVNET_RPC} https://github.com/<usuario>/<repo>"
