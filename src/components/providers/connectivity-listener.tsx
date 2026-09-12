"use client";

import { useEffect } from "react";

import { useSyncStore } from "@/lib/sync-store";

/**
 * Escuta o estado real de conectividade do navegador e alimenta o
 * indicador de sincronização global. Não tenta simular sincronização —
 * apenas reporta online/offline com honestidade.
 */
export function ConnectivityListener() {
  const setStatus = useSyncStore((state) => state.setStatus);

  useEffect(() => {
    const updateStatus = () => setStatus(navigator.onLine ? "synced" : "offline");
    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [setStatus]);

  return null;
}
