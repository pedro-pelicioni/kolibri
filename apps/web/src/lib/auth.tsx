import { createContext, type ReactNode, useContext, useState } from "react";
import { clearTokens, setTokens } from "./api";
import type { VerifyResult } from "./siws";

interface Dispensary {
  id: string;
  walletPubkey: string;
  name: string | null;
}

interface AuthState {
  dispensary: Dispensary | null;
  isAuthed: boolean;
  onLoggedIn: (r: VerifyResult) => void;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);
const DISP_KEY = "kolibri_dispensary";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [dispensary, setDispensary] = useState<Dispensary | null>(() => {
    const raw = localStorage.getItem(DISP_KEY);
    return raw ? (JSON.parse(raw) as Dispensary) : null;
  });

  const onLoggedIn = (r: VerifyResult) => {
    setTokens(r.accessToken, r.refreshToken);
    setDispensary(r.dispensary);
    localStorage.setItem(DISP_KEY, JSON.stringify(r.dispensary));
  };

  const logout = () => {
    clearTokens();
    localStorage.removeItem(DISP_KEY);
    setDispensary(null);
  };

  return (
    <Ctx.Provider value={{ dispensary, isAuthed: !!dispensary, onLoggedIn, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
}
