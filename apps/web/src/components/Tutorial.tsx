import { useState } from "react";

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: "🌱",
    title: "Bem-vindo ao Kolibri",
    body: "Imagine que você é um dispensário de cannabis medicinal. O Kolibri rastreia cada planta — do nascimento à dispensação — com prova imutável na Solana, sem nunca expor dados sensíveis do paciente.",
  },
  {
    icon: "🔑",
    title: "1. Entre com sua carteira",
    body: "Conecte uma carteira Solana (Phantom, Solflare ou MetaMask) e clique \"Entrar com Solana\". É só uma assinatura de prova de identidade — nada é cobrado, e funciona em qualquer rede.",
  },
  {
    icon: "🌿",
    title: "2. Registre uma planta",
    body: "No painel, clique \"+ Nova planta\" e informe a origem (cultivar, genética). Ao salvar, a planta é ancorada on-chain e ganha um NFT — o certificado dela.",
  },
  {
    icon: "⛓️",
    title: "3. Registre os eventos do ciclo",
    body: "Abra a planta e adicione eventos (colheita, laudo do laboratório, embalagem, dispensação…). Cada um ancora um hash sha256 na Solana. Dados sensíveis (CPF/CNS) viram hash no próprio navegador — nunca vão on-chain.",
  },
  {
    icon: "🔍",
    title: "4. Passaporte + verificação",
    body: "Cada planta tem um passaporte público (acessível por QR). Qualquer um abre, vê a linha do tempo e clica \"Verificar on-chain\": o navegador recomputa o hash e confere direto na blockchain. Procedência provada ponta a ponta.",
  },
  {
    icon: "✅",
    title: "Pronto pra testar!",
    body: "Conecte sua carteira e registre sua primeira planta. Em ~1 minuto você vê a prova on-chain no explorer da Solana e o NFT na carteira do dispensário.",
  },
];

export function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  if (!open) return null;
  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Passo {i + 1} de {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 transition hover:text-neutral-700"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 text-center">
          <div className="text-5xl">{step.icon}</div>
          <h2 className="mt-4 text-xl font-bold text-ink">{step.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.body}</p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {STEPS.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 rounded-full transition-all ${
                k === i ? "w-5 bg-brand-600" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (i === 0 ? onClose() : setI(i - 1))}
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-800"
          >
            {i === 0 ? "Pular" : "Anterior"}
          </button>
          <button
            type="button"
            onClick={() => (last ? onClose() : setI(i + 1))}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {last ? "Começar" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
