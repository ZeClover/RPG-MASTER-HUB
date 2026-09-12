"use client";

import { create } from "zustand";

export type SyncStatus = "synced" | "saving" | "pending" | "offline" | "error";

interface SyncState {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
  /** Quantas escritas do Modo Sessão estão na fila offline aguardando reconexão (Fase 3). */
  pendingWrites: number;
  setPendingWrites: (count: number) => void;
}

/**
 * Fonte única do indicador de sincronização mostrado na topbar. Alimentado
 * por dois sinais: conectividade real (online/offline, desde a Fase 0) e,
 * a partir da Fase 3, o tamanho da fila de escrita offline do Modo Sessão
 * (`offline-queue.ts`) — `pending` significa "offline com escritas
 * aguardando", não um "salvo" fingido.
 */
export const useSyncStore = create<SyncState>((set) => ({
  status: "synced",
  setStatus: (status) => set({ status }),
  pendingWrites: 0,
  setPendingWrites: (count) => set({ pendingWrites: count }),
}));
