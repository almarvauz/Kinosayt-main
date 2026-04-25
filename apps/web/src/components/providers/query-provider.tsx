"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 60 * 1000,   // 30 min — data "fresh" hisoblanadi
            gcTime: 60 * 60 * 1000,       // 1 soat — cache'da saqlanadi
            refetchOnWindowFocus: false,   // tab'ga qaytganda qayta yuklamaydi
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
