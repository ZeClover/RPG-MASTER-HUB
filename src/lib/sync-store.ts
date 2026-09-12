"use client";

import { create } from "zustand";

export type SyncStatus = "synced" | "saving" | "pending" | "offline" | "error";

interface SyncState {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
}

/**
 * Fonte única do indicador de sincronização mostrado na topbar. Hoje só é
 * alimentado pelo estado de conectividade (online/offline) — filas de
 * escrita offline chegam na Fase 3 (Modo Sessão), reaproveitando este store.
 */
export const useSyncStore = create<SyncState>((set) => ({
  status: "synced",
  setStatus: (status) => set({ status }),
}));
