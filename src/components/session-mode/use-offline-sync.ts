"use client";

import { useCallback, useEffect, useRef } from "react";

import { useSyncStore } from "@/lib/sync-store";
import { enqueueWrite, listQueuedWrites, removeQueuedWrite, type QueuedWrite } from "@/lib/offline-queue";
import { createLogEntryAction, type LogEntryInput } from "@/modules/game/session-log/actions";
import {
  addCombatantAction,
  removeCombatantAction,
  updateCombatantAction,
} from "@/modules/game/combat/actions";
import type { CombatantUpdateInput } from "@/modules/game/combat/schemas";

/**
 * Só uma falha de rede de verdade deve virar uma escrita na fila (para
 * reenviar depois) — um erro de aplicação (validação, registro não
 * encontrado) reenviado do mesmo jeito só repetiria o mesmo erro para
 * sempre, escondendo um bug atrás de um `pending` que nunca vira `synced`.
 * `fetch` rejeita com `TypeError` especificamente quando não consegue
 * completar a requisição (sem rede, DNS, CORS) — é a única distinção
 * confiável disponível no cliente.
 */
function isLikelyNetworkError(error: unknown) {
  return !navigator.onLine || (error instanceof TypeError && /fetch/i.test(error.message));
}

async function performWrite(write: QueuedWrite) {
  switch (write.op) {
    case "createLogEntry":
      return createLogEntryAction(write.campaignId, write.payload as unknown as LogEntryInput);
    case "addCombatant":
      return addCombatantAction(
        write.campaignId,
        write.payload.encounterId as string,
        write.payload as unknown as { id: string; name: string; type: "PC" | "NPC"; initiative: number; hpMax?: number },
      );
    case "updateCombatant":
      return updateCombatantAction(
        write.campaignId,
        write.payload.combatantId as string,
        write.payload as unknown as CombatantUpdateInput,
      );
    case "removeCombatant":
      return removeCombatantAction(write.campaignId, write.payload.combatantId as string);
  }
}

/**
 * Ponte entre o Modo Sessão e a fila de escrita offline: toda mutação do
 * Modo Sessão passa por `queueOrRun` em vez de chamar a Server Action
 * direto. Online, tenta a Server Action normalmente; se falhar (rede caiu
 * no meio) ou já estiver offline, enfileira no IndexedDB local e marca o
 * indicador de sincronização como `pending`. Ao reconectar (`online`),
 * reenvia a fila em ordem — cada escrita é idempotente por natureza
 * (upsert por clientId no log, updates parciais no combatente).
 */
export function useOfflineSync(campaignId: string) {
  const setStatus = useSyncStore((state) => state.setStatus);
  const setPendingWrites = useSyncStore((state) => state.setPendingWrites);
  const flushingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const queued = await listQueuedWrites(campaignId);
    setPendingWrites(queued.length);
    if (queued.length > 0 && navigator.onLine) setStatus("pending");
  }, [campaignId, setPendingWrites, setStatus]);

  const flush = useCallback(async () => {
    if (flushingRef.current || !navigator.onLine) return;
    flushingRef.current = true;
    setStatus("saving");
    try {
      const queued = await listQueuedWrites(campaignId);
      for (const write of queued) {
        try {
          await performWrite(write);
          await removeQueuedWrite(write.id);
        } catch (error) {
          if (isLikelyNetworkError(error)) break; // rede caiu de novo — tenta o resto na próxima reconexão
          console.error("Modo Sessão: escrita da fila falhou por um erro real, descartando.", write, error);
          await removeQueuedWrite(write.id); // reenviar não vai corrigir um erro de aplicação
        }
      }
    } finally {
      flushingRef.current = false;
      const remaining = await listQueuedWrites(campaignId);
      setPendingWrites(remaining.length);
      setStatus(remaining.length > 0 ? "pending" : "synced");
      // A fila em si já não tem essas escritas mais, mas os painéis mantêm
      // seu próprio estado otimista local (para funcionar sem esperar o
      // servidor) — avisa por evento, mesmo padrão de baixo acoplamento já
      // usado no Command Palette (Fase 1), para eles saberem que podem
      // marcar as entradas "salvando quando reconectar" como sincronizadas.
      if (remaining.length === 0) {
        window.dispatchEvent(new CustomEvent("session-mode:queue-flushed"));
      }
    }
  }, [campaignId, setStatus, setPendingWrites]);

  useEffect(() => {
    refreshPendingCount();
    window.addEventListener("online", flush);

    // O evento `online` do navegador nem sempre dispara de forma confiável
    // (conexões instáveis, ou ferramentas de emulação de rede que bloqueiam
    // requisições sem alternar `navigator.onLine`) — por isso a fila também
    // tenta descarregar periodicamente, não só reagindo ao evento. Cada
    // tentativa é barata (só lê o IndexedDB local) quando não há nada
    // pendente, e o `flushingRef` evita tentativas sobrepostas.
    const interval = setInterval(flush, 4000);

    return () => {
      window.removeEventListener("online", flush);
      clearInterval(interval);
    };
  }, [flush, refreshPendingCount]);

  const queueOrRun = useCallback(
    async (op: QueuedWrite["op"], payload: Record<string, unknown>): Promise<{ queued: boolean }> => {
      if (navigator.onLine) {
        try {
          await performWrite({ id: "", campaignId, op, payload, queuedAt: 0 });
          return { queued: false };
        } catch (error) {
          if (!isLikelyNetworkError(error)) {
            console.error("Modo Sessão: escrita falhou por um erro real (não é falta de rede).", op, payload, error);
            setStatus("error");
            return { queued: false };
          }
          // rede falhou no meio do request — segue para enfileirar abaixo
        }
      }

      await enqueueWrite({ id: crypto.randomUUID(), campaignId, op, payload, queuedAt: Date.now() });
      await refreshPendingCount();
      setStatus("pending");
      return { queued: true };
    },
    [campaignId, refreshPendingCount, setStatus],
  );

  return { queueOrRun };
}
