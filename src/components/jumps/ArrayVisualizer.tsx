import { useEffect, useState } from "react";
import type { AlgoResult, Step } from "@/lib/jumpAlgorithms";
import { Button } from "@/components/ui/button";

type Props = {
  arr: number[];
  result: AlgoResult | null;
};

export function ArrayVisualizer({ arr, result }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [result]);

  useEffect(() => {
    if (!playing || !result) return;
    if (stepIdx >= result.steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStepIdx((s) => s + 1), 450);
    return () => clearTimeout(t);
  }, [playing, stepIdx, result]);

  const current: Step | null = result && result.steps.length > 0 ? result.steps[Math.min(stepIdx, result.steps.length - 1)] : null;
  const pathSet = new Set(result?.path ?? []);

  return (
    <div className="panel p-5 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="chip">02 · Visualization</span>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
            Step-by-step jump trace
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {result ? `Algorithm: ${result.name}` : "Run an algorithm to see the trace."}
          </p>
        </div>
        {result && result.steps.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setStepIdx(0)}>⏮</Button>
            <Button size="sm" variant="outline" onClick={() => setStepIdx((s) => Math.max(0, s - 1))}>◀</Button>
            <Button
              size="sm"
              onClick={() => setPlaying((p) => !p)}
              className="bg-[var(--neon-cyan)] text-[var(--primary-foreground)] hover:bg-[oklch(0.92_0.18_195)]"
            >
              {playing ? "⏸ Pause" : "▶ Play"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStepIdx((s) => Math.min(result.steps.length - 1, s + 1))}>▶</Button>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {Math.min(stepIdx + 1, result.steps.length)}/{result.steps.length}
            </span>
          </div>
        )}
      </div>

      {/* Array cells */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {arr.map((v, i) => {
            const isCurrent = current?.i === i;
            const isMaxReach = current ? i === current.maxReach : false;
            const isCurrEnd = current ? i === current.currEnd : false;
            const inPath = pathSet.has(i);
            const isStart = i === 0;
            const isEnd = i === arr.length - 1;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "relative w-12 h-14 md:w-14 md:h-16 rounded-md flex items-center justify-center font-mono text-lg transition-all",
                    "border bg-[oklch(0.22_0.03_265/0.7)] border-[oklch(0.4_0.05_265/0.5)]",
                    inPath && "border-[var(--neon-magenta)] bg-[oklch(0.78_0.22_330/0.12)]",
                    isCurrent && "border-[var(--neon-cyan)] bg-[oklch(0.85_0.18_195/0.18)] glow-cyan animate-pulse-ring",
                    isStart && "ring-1 ring-[var(--neon-lime)]",
                    isEnd && "ring-1 ring-[var(--neon-amber)]",
                  ].filter(Boolean).join(" ")}
                >
                  <span className={isCurrent ? "text-[var(--neon-cyan)] text-glow-cyan" : "text-foreground"}>{v}</span>
                  {isStart && <span className="absolute -top-2 -left-2 text-[10px] font-mono text-[var(--neon-lime)]">S</span>}
                  {isEnd && <span className="absolute -top-2 -right-2 text-[10px] font-mono text-[var(--neon-amber)]">D</span>}
                  {isMaxReach && !isCurrent && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[var(--neon-magenta)]">max</span>
                  )}
                  {isCurrEnd && !isCurrent && !isMaxReach && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[var(--neon-violet)]">end</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
        <Stat label="i (cursor)" value={current ? String(current.i) : "—"} color="cyan" />
        <Stat label="maxReach" value={current ? String(current.maxReach) : "—"} color="magenta" />
        <Stat label="currEnd" value={current ? String(current.currEnd) : "—"} color="violet" />
        <Stat label="jumps" value={current ? String(current.jumps) : "0"} color="lime" />
      </div>

      {current && (
        <div className="rounded-md border border-[oklch(0.4_0.05_265/0.5)] bg-[oklch(0.18_0.03_265/0.7)] px-3 py-2 font-mono text-xs text-muted-foreground">
          <span className="text-[var(--neon-cyan)]">›</span> {current.note}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: "cyan" | "magenta" | "violet" | "lime" }) {
  const map = {
    cyan: "text-[var(--neon-cyan)]",
    magenta: "text-[var(--neon-magenta)]",
    violet: "text-[var(--neon-violet)]",
    lime: "text-[var(--neon-lime)]",
  };
  return (
    <div className="rounded-md border border-[oklch(0.4_0.05_265/0.4)] bg-[oklch(0.2_0.03_265/0.6)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-base ${map[color]} text-glow-cyan tabular-nums`}>{value}</div>
    </div>
  );
}
