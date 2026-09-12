"use client";

/**
 * Fila de escrita offline do Modo Sessão — a peça que faltava desde a Fase 0
 * (ver ARCHITECTURE.md, seção "Sincronização": "fila de escrita offline...
 * chega com o Modo Sessão"). Deliberadamente simples: um único IndexedDB
 * local por navegador, sem merge entre dispositivos — o mestre resolve
 * qualquer conflito rodando a sessão de um dispositivo por vez, que é como
 * uma mesa de RPG funciona na prática. Ver ARCHITECTURE.md para a discussão
 * completa do porquê disso ser suficiente e honesto (não é CRDT).
 */

const DB_NAME = "rpg-master-hub-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-writes";

export interface QueuedWrite {
  id: string;
  op: "createLogEntry" | "addCombatant" | "updateCombatant" | "removeCombatant";
  campaignId: string;
  payload: Record<string, unknown>;
  queuedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueWrite(write: QueuedWrite): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(write);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listQueuedWrites(campaignId: string): Promise<QueuedWrite[]> {
  const db = await openDb();
  const all = await new Promise<QueuedWrite[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as QueuedWrite[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return all.filter((write) => write.campaignId === campaignId).sort((a, b) => a.queuedAt - b.queuedAt);
}

export async function removeQueuedWrite(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
