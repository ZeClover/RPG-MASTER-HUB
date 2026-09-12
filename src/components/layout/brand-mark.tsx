export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className ?? "size-7"} aria-hidden="true">
      <defs>
        <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f2a93c" />
        </linearGradient>
      </defs>
      <polygon
        points="50,3 91,26 91,74 50,97 9,74 9,26"
        fill="none"
        stroke="url(#brand-gradient)"
        strokeWidth="7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
