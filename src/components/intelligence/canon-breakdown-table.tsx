import type { CanonStatusBreakdownRow } from "@/modules/intelligence/brain/queries";
import { CONTENT_TYPE_LABELS_PLURAL } from "@/modules/intelligence/content-types";
import { CANON_STATUS_OPTIONS } from "@/components/wiki/status-config";

/** Barra empilhada simples (sem lib de gráfico) — cada segmento é um `canonStatus`, proporcional ao total do tipo. */
function CanonStatusBar({ row }: { row: CanonStatusBreakdownRow }) {
  if (row.total === 0) {
    return <div className="h-2 flex-1 rounded-full bg-surface-elevated" />;
  }

  return (
    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-elevated">
      {CANON_STATUS_OPTIONS.map(([status]) => {
        const count = row.counts[status];
        if (count === 0) return null;
        const pct = (count / row.total) * 100;
        return (
          <div
            key={status}
            title={`${status}: ${count}`}
            style={{ width: `${pct}%` }}
            className={
              status === "CANON"
                ? "bg-success"
                : status === "DRAFT" || status === "PROPOSED"
                  ? "bg-accent"
                  : status === "APPROVED"
                    ? "bg-primary"
                    : "bg-muted-foreground/40"
            }
          />
        );
      })}
    </div>
  );
}

export function CanonBreakdownTable({ rows }: { rows: CanonStatusBreakdownRow[] }) {
  const withContent = rows.filter((row) => row.total > 0);

  if (withContent.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum NPC, Local, Facção, Lore, Monstro, Item ou Poder criado ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {withContent.map((row) => (
        <div key={row.type} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
            {CONTENT_TYPE_LABELS_PLURAL[row.type]}
          </span>
          <CanonStatusBar row={row} />
          <span className="w-10 shrink-0 text-right text-xs font-medium">{row.total}</span>
        </div>
      ))}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" /> Rascunho/Proposto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" /> Aprovado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" /> Canônico
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/40" /> Obsoleto/Arquivado
        </span>
      </div>
    </div>
  );
}
