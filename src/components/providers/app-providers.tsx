"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { type ReactNode, useState } from "react";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position='bottom-center'
        closeButton
        richColors
        toastOptions={{
          className:
            "rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-800 shadow-[0_24px_60px_rgba(15,23,42,0.18)]",
        }}
      />
    </QueryClientProvider>
  );
}
