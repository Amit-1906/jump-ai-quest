import type { AlgoResult, RLEpisode } from "@/lib/jumpAlgorithms";

type Props = {
  current: AlgoResult | null;
  all: Record<string, AlgoResult> | null;
  rlEpisodes: RLEpisode[] | null;
};

export function ResultPanel({ current, all, rlEpisodes }: Props) {
  const algos = all ? Object.values(all) : current ? [current] : [];
  const maxJumps = Math.max(1, ...algos.map((a) => (a.jumps > 0 ? a.jumps : 1)));

  return (
    <div className="panel p-5 md:p-6 space-y-5">
      <div>
        <span className="chip">04 · Results</span>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Output · path · comparison
        </h2>
      </div>

      {current && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Big label="Min Jumps (J)" value={current.reachable ? String(current.jumps) : "∞"} accent="cyan" />
          <Big label="Algorithm" value={current.name} accent="magenta" />
          <Big label="Complexity" value={current.complexity} accent="lime" />
          <div className="sm:col-span-3 rounded-md border border-[oklch(0.4_0.05_265/0.5)] bg-[oklch(0.18_0.03_265/0.7)] px-3 py-2 font-mono text-sm overflow-x-auto">
            <span className="text-[var(--neon-cyan)]">Path P =</span>{" "}
            {current.reachable ? current.path.join(" → ") : <span className="text-destructive">unreachable</span>}
          </div>
        </div>
      )}

      {/* Comparison bar chart */}
      {algos.length > 1 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Jump count comparison
          </div>
          <div className="space-y-2">
            {algos.map((a) => {
              const w = a.reachable ? (a.jumps / maxJumps) * 100 : 100;
              const color =
                a.name.startsWith("Greedy") ? "var(--neon-cyan)" :
                a.name.startsWith("Dynamic") ? "var(--neon-amber)" :
                a.name.startsWith("BFS") ? "var(--neon-lime)" :
                "var(--neon-magenta)";
              return (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 text-xs font-mono text-muted-foreground truncate">{a.name}</div>
                  <div className="flex-1 h-6 rounded-md bg-[oklch(0.2_0.03_265/0.7)] border border-[oklch(0.4_0.05_265/0.4)] overflow-hidden">
                    <div
                      className="h-full flex items-center justify-end pr-2 text-[11px] font-mono text-[var(--background)] font-semibold transition-all"
                      style={{ width: `${Math.max(8, w)}%`, background: a.reachable ? color : "var(--destructive)" }}
                    >
                      {a.reachable ? a.jumps : "∞"}
                    </div>
                  </div>
                  <div className="w-20 text-right text-[11px] font-mono text-muted-foreground">{a.complexity}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {algos.length > 1 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider font-mono text-muted-foreground border-b border-[oklch(0.4_0.05_265/0.4)]">
                <th className="py-2 pr-3">Algorithm</th>
                <th className="py-2 pr-3">Jumps</th>
                <th className="py-2 pr-3">Complexity</th>
                <th className="py-2 pr-3">Path</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {algos.map((a) => (
                <tr key={a.name} className="border-b border-[oklch(0.4_0.05_265/0.2)]">
                  <td className="py-2 pr-3">{a.name}</td>
                  <td className="py-2 pr-3 text-[var(--neon-cyan)]">{a.reachable ? a.jumps : "∞"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{a.complexity}</td>
                  <td className="py-2 pr-3 text-muted-foreground truncate max-w-[280px]">
                    {a.reachable ? a.path.join(" → ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RL learning curve */}
      {rlEpisodes && rlEpisodes.length > 0 && (
        <RLChart episodes={rlEpisodes} />
      )}
    </div>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent: "cyan" | "magenta" | "lime" }) {
  const c = {
    cyan: "text-[var(--neon-cyan)] text-glow-cyan",
    magenta: "text-[var(--neon-magenta)] text-glow-magenta",
    lime: "text-[var(--neon-lime)]",
  }[accent];
  return (
    <div className="rounded-md border border-[oklch(0.4_0.05_265/0.5)] bg-[oklch(0.2_0.03_265/0.6)] p-4">
      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${c}`}>{value}</div>
    </div>
  );
}

function RLChart({ episodes }: { episodes: RLEpisode[] }) {
  // Sample for chart
  const sample: RLEpisode[] = [];
  const step = Math.max(1, Math.floor(episodes.length / 60));
  for (let i = 0; i < episodes.length; i += step) sample.push(episodes[i]);
  const last = episodes[episodes.length - 1];
  if (sample[sample.length - 1] !== last) sample.push(last);

  const maxJ = Math.max(...sample.map((e) => e.jumps), 1);
  const successRate = (episodes.filter((e) => e.reachedGoal).length / episodes.length) * 100;

  const w = 600, h = 140, pad = 24;
  const xs = (i: number) => pad + (i / (sample.length - 1 || 1)) * (w - pad * 2);
  const ys = (v: number) => h - pad - (v / maxJ) * (h - pad * 2);
  const path = sample.map((e, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(e.jumps).toFixed(1)}`).join(" ");

  return (
    <div className="rounded-md border border-[oklch(0.4_0.05_265/0.5)] bg-[oklch(0.18_0.03_265/0.7)] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
          🧠 RL Agent · Learning curve (jumps per episode)
        </div>
        <div className="text-xs font-mono text-[var(--neon-lime)]">
          success: {successRate.toFixed(0)}% · final jumps: {last.jumps}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <defs>
          <linearGradient id="rlGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.22 330)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.78 0.22 330)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${xs(sample.length - 1)} ${h - pad} L ${xs(0)} ${h - pad} Z`} fill="url(#rlGrad)" />
        <path d={path} fill="none" stroke="oklch(0.78 0.22 330)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
