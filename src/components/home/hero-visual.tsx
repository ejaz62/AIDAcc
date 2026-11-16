/** Decorative neural-network illustration for the hero. Purely presentational. */
const layers = [
  [70, 150, 230, 310],
  [40, 115, 190, 265, 340],
  [70, 150, 230, 310],
  [110, 190, 270],
];
const xs = [60, 190, 320, 440];

export function HeroVisual() {
  const nodes = layers.flatMap((ys, li) => ys.map((y) => ({ x: xs[li], y, li })));
  const edges: Array<[number, number, number, number, number]> = [];
  layers.forEach((ys, li) => {
    if (li === layers.length - 1) return;
    ys.forEach((y1, a) =>
      layers[li + 1].forEach((y2, b) => edges.push([xs[li], y1, xs[li + 1], y2, (a + b + li) % 5])),
    );
  });

  return (
    <div className="relative mx-auto w-full max-w-lg" aria-hidden>
      <div className="absolute -inset-8 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="relative rounded-(--radius-card) border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-sm sm:p-6">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
        </div>
        <svg viewBox="0 0 500 380" className="h-auto w-full">
          <defs>
            <linearGradient id="hero-edge" x1="0" x2="1">
              <stop offset="0" stopColor="#7086ff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id="hero-node">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#9db1ff" />
            </radialGradient>
          </defs>
          {edges.map(([x1, y1, x2, y2, k], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#hero-edge)"
              strokeWidth={k === 0 ? 1.6 : 0.8}
              strokeOpacity={k === 0 ? 0.9 : 0.35}
              strokeDasharray={k === 0 ? "6 6" : undefined}
              style={k === 0 ? { animation: "dash-flow 1.6s linear infinite" } : undefined}
            />
          ))}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={14} fill="#4c5efa" opacity={0.18} />
              <circle
                cx={n.x}
                cy={n.y}
                r={n.li === 3 ? 8 : 6}
                fill={n.li === 3 ? "#22d3ee" : "url(#hero-node)"}
                style={{ animation: `pulse-node ${2.2 + (i % 4) * 0.4}s ease-in-out infinite` }}
              />
            </g>
          ))}
        </svg>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center font-mono text-[0.65rem] tracking-wide text-ink-400 uppercase sm:text-xs">
          <span>Input</span>
          <span>Learn</span>
          <span>Output</span>
        </div>
      </div>
    </div>
  );
}
