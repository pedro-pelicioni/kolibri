import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { shortAddr } from "../lib/format";

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {children}
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { dispensary, logout } = useAuth();

  return (
    <div className="min-h-dvh bg-neutral-50 text-ink">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/be-the-change.svg" alt="Kolibri" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight text-brand-700">Kolibri</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/register">Nova planta</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {dispensary && (
              <span className="hidden text-xs text-neutral-500 md:inline">
                {shortAddr(dispensary.walletPubkey, 4)}
              </span>
            )}
            <WalletMultiButton />
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:text-neutral-800"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
