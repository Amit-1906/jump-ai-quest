import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  arrayText: string;
  onArrayChange: (s: string) => void;
  onRun: (algo: AlgoKey | "all") => void;
  onRandom: () => void;
  parsed: { ok: boolean; arr: number[]; error?: string };
  busy: boolean;
};

export type AlgoKey = "greedy" | "dp" | "bfs" | "rl";

const ALGOS: { key: AlgoKey; label: string; complexity: string; color: string }[] = [
  { key: "greedy", label: "Greedy", complexity: "O(n)", color: "text-neon-cyan" },
  { key: "dp", label: "Dynamic Programming", complexity: "O(n²)", color: "text-neon-amber" },
  { key: "bfs", label: "BFS Graph", complexity: "O(V+E)", color: "text-neon-lime" },
  { key: "rl", label: "AI · Q-Learning", complexity: "O(E·n)", color: "text-neon-magenta" },
];

export function InputPanel({ arrayText, onArrayChange, onRun, onRandom, parsed, busy }: Props) {
  const [selected, setSelected] = useState<AlgoKey>("greedy");

  return (
    <div className="panel p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="chip">01 · Input</span>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
            Define the jump array <span className="text-glow-cyan text-[var(--neon-cyan)]">arr[]</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Each value = max forward jump length from that index. Index 0 is source S, last index is destination D.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
          Array (comma or space separated)
        </label>
        <Input
          value={arrayText}
          onChange={(e) => onArrayChange(e.target.value)}
          placeholder="e.g. 2, 3, 1, 1, 2, 4, 2, 0, 1, 1"
          className="font-mono bg-[oklch(0.2_0.03_265)] border-[oklch(0.4_0.05_265/0.5)] focus-visible:ring-[var(--neon-cyan)]"
        />
        {!parsed.ok ? (
          <p className="text-xs text-destructive font-mono">⚠ {parsed.error}</p>
        ) : (
          <p className="text-xs text-muted-foreground font-mono">
            n = {parsed.arr.length} · valid ✓
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
          Algorithm
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ALGOS.map((a) => {
            const active = selected === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setSelected(a.key)}
                className={[
                  "text-left rounded-md px-3 py-2 border transition-all",
                  active
                    ? "border-[var(--neon-cyan)] bg-[oklch(0.85_0.18_195/0.08)] glow-cyan"
                    : "border-[oklch(0.4_0.05_265/0.4)] bg-[oklch(0.22_0.03_265/0.6)] hover:border-[oklch(0.6_0.08_265/0.7)]",
                ].join(" ")}
              >
                <div className="text-sm font-medium">{a.label}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{a.complexity}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          onClick={() => onRun(selected)}
          disabled={!parsed.ok || busy}
          className="bg-[var(--neon-cyan)] text-[var(--primary-foreground)] hover:bg-[oklch(0.92_0.18_195)] glow-cyan"
        >
          ▶ Run {ALGOS.find((a) => a.key === selected)!.label}
        </Button>
        <Button
          onClick={() => onRun("all")}
          disabled={!parsed.ok || busy}
          variant="outline"
          className="border-[var(--neon-magenta)] text-[var(--neon-magenta)] hover:bg-[oklch(0.78_0.22_330/0.1)] hover:text-[var(--neon-magenta)] glow-magenta"
        >
          ⚡ Run All & Compare
        </Button>
        <Button onClick={onRandom} variant="ghost" className="text-muted-foreground hover:text-foreground">
          🎲 Random
        </Button>
      </div>
    </div>
  );
}
