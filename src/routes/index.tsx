import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { InputPanel, type AlgoKey } from "@/components/jumps/InputPanel";
import { ArrayVisualizer } from "@/components/jumps/ArrayVisualizer";
import { GraphView } from "@/components/jumps/GraphView";
import { ResultPanel } from "@/components/jumps/ResultPanel";
import {
  bfsJumps,
  dpJumps,
  greedyJumps,
  rlJumps,
  type AlgoResult,
  type RLEpisode,
} from "@/lib/jumpAlgorithms";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Min Jumps · AI Path Optimization" },
      {
        name: "description",
        content:
          "Compute the minimum number of jumps from source to destination using Greedy, DP, BFS, and an AI Q-Learning agent. Interactive, visual, educational.",
      },
      { property: "og:title", content: "Min Jumps · AI Path Optimization" },
      {
        property: "og:description",
        content: "Greedy vs DP vs BFS vs Reinforcement Learning — visualized.",
      },
    ],
  }),
});

function parseArray(text: string): { ok: boolean; arr: number[]; error?: string } {
  const raw = text.trim();
  if (!raw) return { ok: false, arr: [], error: "Array is empty." };
  const parts = raw.split(/[,\s]+/).filter(Boolean);
  const arr: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { ok: false, arr: [], error: `"${p}" is not an integer.` };
    }
    if (n < 0) return { ok: false, arr: [], error: `Negative value "${p}" not allowed.` };
    if (n > 999) return { ok: false, arr: [], error: `Value "${p}" too large (max 999).` };
    arr.push(n);
  }
  if (arr.length < 1) return { ok: false, arr: [], error: "Need at least 1 element." };
  if (arr.length > 40) return { ok: false, arr: [], error: "Max 40 elements for clean visualization." };
  return { ok: true, arr };
}

function randomArray(): string {
  const n = 8 + Math.floor(Math.random() * 6);
  const arr = Array.from({ length: n }, (_, i) => {
    if (i === n - 1) return Math.floor(Math.random() * 3);
    return 1 + Math.floor(Math.random() * Math.min(5, n - i - 1));
  });
  return arr.join(", ");
}

function Index() {
  const [arrayText, setArrayText] = useState("2, 3, 1, 1, 2, 4, 2, 0, 1, 1");
  const [current, setCurrent] = useState<AlgoResult | null>(null);
  const [allResults, setAllResults] = useState<Record<string, AlgoResult> | null>(null);
  const [rlEpisodes, setRlEpisodes] = useState<RLEpisode[] | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(() => parseArray(arrayText), [arrayText]);

  const run = (algo: AlgoKey | "all") => {
    if (!parsed.ok) return;
    setBusy(true);
    // small async wrap for UX
    setTimeout(() => {
      const arr = parsed.arr;
      if (algo === "all") {
        const g = greedyJumps(arr);
        const d = dpJumps(arr);
        const b = bfsJumps(arr);
        const r = rlJumps(arr);
        const map = { Greedy: g, DP: d, BFS: b, RL: r };
        setAllResults(map);
        setCurrent(g);
        setRlEpisodes(r.episodes);
      } else {
        let res: AlgoResult;
        let eps: RLEpisode[] | null = null;
        if (algo === "greedy") res = greedyJumps(arr);
        else if (algo === "dp") res = dpJumps(arr);
        else if (algo === "bfs") res = bfsJumps(arr);
        else { const r = rlJumps(arr); res = r; eps = r.episodes; }
        setCurrent(res);
        setAllResults(null);
        setRlEpisodes(eps);
      }
      setBusy(false);
    }, 60);
  };

  const bfsForGraph = useMemo(() => {
    if (!parsed.ok) return null;
    if (allResults?.BFS) return allResults.BFS;
    if (current?.name === "BFS") return current;
    return bfsJumps(parsed.arr); // always show graph
  }, [parsed, current, allResults]);

  return (
    <main className="min-h-screen bg-grid">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 md:mb-10">
          <div className="flex items-center gap-2">
            <span className="chip">MJS · Minimum Jump Strategy</span>
            <span className="chip">v1.0</span>
          </div>
          <h1 className="mt-3 font-display text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Minimum Number of Jumps{" "}
            <span className="text-[var(--neon-cyan)] text-glow-cyan">·</span>{" "}
            <span className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-magenta)] bg-clip-text text-transparent">
              AI Path Optimization
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">
            Compare Greedy, Dynamic Programming, BFS, and a Q-Learning agent on the classic
            jump-array problem. Reach the destination D from source S with the fewest jumps possible.
          </p>
        </header>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-5">
            <InputPanel
              arrayText={arrayText}
              onArrayChange={setArrayText}
              onRun={run}
              onRandom={() => setArrayText(randomArray())}
              parsed={parsed}
              busy={busy}
            />
            {parsed.ok && <GraphView arr={parsed.arr} bfsResult={bfsForGraph} />}
          </div>
          <div className="lg:col-span-7 space-y-5">
            {parsed.ok && <ArrayVisualizer arr={parsed.arr} result={current} />}
            <ResultPanel current={current} all={allResults} rlEpisodes={rlEpisodes} />
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-[oklch(0.4_0.05_265/0.3)] text-xs font-mono text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>Built for educational MJS exploration · Greedy · DP · BFS · Q-Learning</span>
          <span>state → action → reward → π*</span>
        </footer>
      </div>
    </main>
  );
}
