import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { User } from '../types/passport';
import { mockUser } from '../mocks/passport.mock';

// Mock auth session — replace `login()` with a real call to the kolibri-gateway
// SIWS flow when wiring the backend. Persistence (AsyncStorage) is intentionally
// left out for the demo so each launch starts from the login screen.

export interface Session {
  user: User;
  /** ISO timestamp the session was issued */
  issuedAt: string;
}

interface SessionContextValue {
  session: Session | null;
  /** Mock: any non-empty credentials succeed. Hooks the real SIWS later. */
  login: (email: string, _password: string) => Promise<void>;
  /** Used when the user taps "Conectar com carteira" — wraps the existing
   *  connectWallet() stub from src/wallet/MobileWalletAdapter.ts. */
  loginWithWallet: (pubkey: string) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const login = useCallback(async (email: string, _password: string) => {
    // Pretend network round-trip so the loading state on the button is visible
    await new Promise<void>((r) => { setTimeout(r, 600); });
    setSession({
      user: { ...mockUser, email: email || mockUser.email },
      issuedAt: new Date().toISOString(),
    });
  }, []);

  const loginWithWallet = useCallback(async (pubkey: string) => {
    await new Promise<void>((r) => { setTimeout(r, 400); });
    setSession({
      user: { ...mockUser, walletPublicKey: pubkey },
      issuedAt: new Date().toISOString(),
    });
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, login, loginWithWallet, logout }),
    [session, login, loginWithWallet, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
