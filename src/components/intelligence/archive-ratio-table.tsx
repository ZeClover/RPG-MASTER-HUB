import type { ArchiveRatioRow } from "@/modules/intelligence/health/queries";
import { CONTENT_TYPE_LABELS_PLURAL } from "@/modules/intelligence/content-types";

export function ArchiveRatioTable({ rows }: { rows: ArchiveRatioRow[] }) {
  const withContent = rows.filter((row) => row.active + row.archived > 0);

  if (withContent.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo criado ainda.</p>;
  }

  const totalActive = withContent.reduce((sum, row) => sum + row.active, 0);
  const totalArchived = withContent.reduce((sum, row) => sum + row.archived, 0);
  const totalPct = totalArchived + totalActive > 0 ? Math.round((totalArchived / (totalArchived + totalActive)) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{totalArchived}</span> de{" "}
        <span className="font-medium text-foreground">{totalActive + totalArchived}</span> itens de conteúdo estão
        arquivados ({totalPct}%).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">Tipo</th>
              <th className="py-1.5 text-right font-normal">Ativos</th>
              <th className="py-1.5 text-right font-normal">Arquivados</th>
              <th className="py-1.5 text-right font-normal">% arquivado</th>
            </tr>
          </thead>
          <tbody>
            {withContent.map((row) => {
              const total = row.active + row.archived;
              const pct = total > 0 ? Math.round((row.archived / total) * 100) : 0;
              return (
                <tr key={row.type} className="border-b border-border/50">
                  <td className="py-1.5">{CONTENT_TYPE_LABELS_PLURAL[row.type]}</td>
                  <td className="py-1.5 text-right">{row.active}</td>
                  <td className="py-1.5 text-right">{row.archived}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
