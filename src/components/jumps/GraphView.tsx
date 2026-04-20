import type { AlgoResult } from "@/lib/jumpAlgorithms";

type Props = {
  arr: number[];
  bfsResult: AlgoResult | null;
};

/** Renders BFS levels as a layered graph. */
export function GraphView({ arr, bfsResult }: Props) {
  const n = arr.length;
  // Compute BFS levels from arr (independent of result)
  const dist = new Array(n).fill(-1);
  const prev = new Array(n).fill(-1);
  if (n > 0) {
    dist[0] = 0;
    const q: number[] = [0];
    while (q.length) {
      const u = q.shift()!;
      for (let k = 1; k <= arr[u] && u + k < n; k++) {
        const v = u + k;
        if (dist[v] === -1) { dist[v] = dist[u] + 1; prev[v] = u; q.push(v); }
      }
    }
  }
  const maxLevel = Math.max(0, ...dist.filter((d) => d >= 0));
  const levels: number[][] = Array.from({ length: maxLevel + 1 }, () => []);
  dist.forEach((d, idx) => { if (d >= 0) levels[d].push(idx); });

  const pathSet = new Set(bfsResult?.path ?? []);

  return (
    <div className="panel p-5 md:p-6 space-y-4">
      <div>
        <span className="chip">03 · BFS Graph</span>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Traversal levels — each level = +1 jump
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Edges represent valid jumps from index <span className="font-mono">i</span> to <span className="font-mono">i+1..i+arr[i]</span>.
        </p>
      </div>

      <div className="space-y-3">
        {levels.map((nodes, lvl) => (
          <div key={lvl} className="flex items-center gap-3">
            <div className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
              L{lvl} <span className="text-[var(--neon-cyan)]">·</span> {lvl} jump{lvl === 1 ? "" : "s"}
            </div>
            <div className="flex-1 flex flex-wrap gap-2">
              {nodes.map((idx) => {
                const inPath = pathSet.has(idx);
                const isEnd = idx === n - 1;
                return (
                  <div
                    key={idx}
                    className={[
                      "min-w-10 h-10 px-2 rounded-full flex items-center justify-center font-mono text-sm border",
                      inPath
                        ? "bg-[oklch(0.78_0.22_330/0.18)] border-[var(--neon-magenta)] text-[var(--neon-magenta)] text-glow-magenta"
                        : "bg-[oklch(0.22_0.03_265/0.7)] border-[oklch(0.4_0.05_265/0.5)] text-foreground",
                      isEnd && "ring-1 ring-[var(--neon-amber)]",
                    ].join(" ")}
                    title={`index ${idx} · arr=${arr[idx]}`}
                  >
                    {idx}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {levels.length === 1 && levels[0].length <= 1 && (
          <p className="text-xs text-muted-foreground font-mono">No reachable nodes beyond source.</p>
        )}
      </div>
    </div>
  );
}
