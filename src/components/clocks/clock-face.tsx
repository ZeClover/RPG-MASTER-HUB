/** Desenha o relógio narrativo como fatias (padrão PbtA/Blades in the Dark) via `conic-gradient` puro — sem SVG/lib. */
export function ClockFace({ segments, filled }: { segments: number; filled: number }) {
  const step = 360 / segments;
  const stops: string[] = [];

  for (let i = 0; i < segments; i++) {
    const start = i * step;
    const end = start + step;
    const gap = Math.min(2, step * 0.08);
    const color = i < filled ? "var(--primary)" : "var(--surface-elevated)";
    stops.push(`${color} ${start}deg ${end - gap}deg`, `var(--border) ${end - gap}deg ${end}deg`);
  }

  return (
    <div
      className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold"
      style={{ background: `conic-gradient(${stops.join(", ")})` }}
      role="img"
      aria-label={`${filled} de ${segments} segmentos preenchidos`}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-surface">
        {filled}/{segments}
      </span>
    </div>
  );
}
