import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthProvider } from "../lib/auth";
import { SolanaProvider } from "./SolanaProvider";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaProvider>
        <AuthProvider>{children}</AuthProvider>
      </SolanaProvider>
    </QueryClientProvider>
  );
}
