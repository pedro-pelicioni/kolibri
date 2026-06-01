import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tutorial } from "../components/Tutorial";
import { useAuth } from "../lib/auth";
import { siwsLogin } from "../lib/siws";

export function Login() {
  const { publicKey, signIn, disconnect } = useWallet();
  const { onLoggedIn, isAuthed } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem("kolibri_tut_seen"),
  );
  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("kolibri_tut_seen", "1");
  };

  // Escape p/ destravar uma carteira presa (ex.: Hana bloqueada): desconecta,
  // limpa a seleção persistida e recarrega — sem precisar mexer no DevTools.
  const resetWallet = async () => {
    try {
      await disconnect();
    } catch {
      // ignora
    }
    localStorage.removeItem("walletName");
    window.location.reload();
  };

  useEffect(() => {
    if (isAuthed) nav("/", { replace: true });
  }, [isAuthed, nav]);

  const handleLogin = async () => {
    if (!publicKey || !signIn) return;
    setLoading(true);
    setErr(null);
    try {
      const result = await siwsLogin(publicKey.toBase58(), signIn);
      onLoggedIn(result);
      nav("/", { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-brand-50 to-neutral-50 px-4">
      <Tutorial open={showTutorial} onClose={closeTutorial} />
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <img src="/be-the-change.svg" alt="Kolibri" className="h-20 w-20" />
          <h1 className="mt-4 text-2xl font-bold text-brand-700">Kolibri</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Rastreabilidade da planta — do nascimento à dispensação, ancorada na Solana.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <WalletMultiButton />
          {publicKey ? (
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !signIn}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Autenticando…" : "Entrar com Solana"}
            </button>
          ) : (
            <p className="text-xs text-neutral-400">
              Conecte sua carteira (Phantom/Solflare) para entrar.
            </p>
          )}
          {publicKey && !signIn && (
            <p className="text-xs text-amber-600">
              Esta carteira não suporta Sign-In With Solana.
            </p>
          )}
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button
            type="button"
            onClick={resetWallet}
            className="mt-1 text-[11px] text-neutral-400 underline hover:text-neutral-600"
          >
            Resetar conexão
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="mt-6 w-full text-center text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          ❓ Como funciona? Ver tutorial
        </button>
        <p className="mt-4 text-center text-[11px] text-neutral-400">
          Para dispensários. Seus dados sensíveis nunca vão on-chain — só hashes.
        </p>
      </div>
    </div>
  );
}
