import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, UserRole } from '../types/passport';
import { mockUser } from '../mocks/passport.mock';
import { config } from '../config';
import { getWalletSigner } from '../wallet/MobileWalletAdapter';
import { loginWithSIWS } from '../api/siws';
import { setTokens, clearTokens } from '../api/client';
import { loadSession, clearSession as clearStored } from '../api/storage';

// Sessão do app — mock OU real (SIWS). Quando config.useStub=true, todo o fluxo
// é curto-circuitado pra que demos sem device/gateway continuem rodando.
// Quando flipa pra real, `loginWithWallet()` faz challenge → MWA → verify e
// persiste o JWT em AsyncStorage; `bootstrap()` restaura sessão no startup.

export interface Session {
  user: User;
  /** ISO timestamp em que a sessão foi emitida */
  issuedAt: string;
  /** Pubkey conectada (vazio em login mock email/password) */
  pubkey?: string;
}

interface SessionContextValue {
  session: Session | null;
  /** Pronto após bootstrap (load tokens / decide se já está logado). */
  ready: boolean;
  /** Mock email/password — só funciona em config.useStub. */
  login: (email: string, _password: string) => Promise<void>;
  /** Wallet login — em stub vira mock, em real faz SIWS completo. */
  loginWithWallet: (opts?: { role?: UserRole; agentName?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Bootstrap — em real mode, restaura sessão do AsyncStorage se válida.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (config.useStub) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const stored = await loadSession();
        if (stored && !cancelled) {
          setTokens(stored.accessToken, stored.refreshToken);
          setSession({
            user: {
              ...mockUser,
              walletPublicKey: stored.pubkey,
              role: (stored.role as UserRole) || mockUser.role,
            },
            issuedAt: new Date().toISOString(),
            pubkey: stored.pubkey,
          });
        }
      } catch {
        // Ignora — bootstrap silencioso. Falha leva pro login screen.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    if (!config.useStub) {
      throw new Error('Login por email/senha está desabilitado em produção — use a carteira.');
    }
    await new Promise<void>((r) => { setTimeout(r, 400); });
    setSession({
      user: { ...mockUser, email: email || mockUser.email },
      issuedAt: new Date().toISOString(),
    });
  }, []);

  const loginWithWallet = useCallback(
    async (opts: { role?: UserRole; agentName?: string } = {}) => {
      if (config.useStub) {
        await new Promise<void>((r) => { setTimeout(r, 400); });
        setSession({
          user: { ...mockUser, walletPublicKey: '8h4nE9dG2pQuYxJrTfX1aZ7kVbW3sLcPmDnQyB5RhKv6' },
          issuedAt: new Date().toISOString(),
          pubkey: '8h4nE9dG2pQuYxJrTfX1aZ7kVbW3sLcPmDnQyB5RhKv6',
        });
        return;
      }
      const result = await loginWithSIWS(getWalletSigner(), {
        cluster: config.cluster,
        role: opts.role,
        agentName: opts.agentName,
      });
      setSession({
        user: {
          ...mockUser,
          walletPublicKey: result.pubkey,
          role: result.role ?? mockUser.role,
        },
        issuedAt: new Date().toISOString(),
        pubkey: result.pubkey,
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    setSession(null);
    clearTokens();
    if (!config.useStub) {
      try { await clearStored(); } catch { /* silent */ }
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, ready, login, loginWithWallet, logout }),
    [session, ready, login, loginWithWallet, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
