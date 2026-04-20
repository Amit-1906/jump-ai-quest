// Algorithms for Minimum Number of Jumps
// Each returns: { jumps, path (indices visited including start & end), steps (for visualization), complexity }

export type Step = {
  i: number;
  maxReach: number;
  currEnd: number;
  jumps: number;
  note: string;
};

export type AlgoResult = {
  name: string;
  jumps: number;
  path: number[];
  steps: Step[];
  complexity: string;
  reachable: boolean;
};

/** Greedy: O(n) — track currEnd & maxReach */
export function greedyJumps(arr: number[]): AlgoResult {
  const n = arr.length;
  const steps: Step[] = [];
  if (n <= 1) return { name: "Greedy", jumps: 0, path: [0], steps, complexity: "O(n)", reachable: true };
  if (arr[0] === 0) return { name: "Greedy", jumps: -1, path: [], steps, complexity: "O(n)", reachable: false };

  let jumps = 0, currEnd = 0, maxReach = 0, jumpFrom = 0;
  const path: number[] = [0];
  const chosen: number[] = []; // index chosen at each jump

  for (let i = 0; i < n - 1; i++) {
    if (i + arr[i] > maxReach) {
      maxReach = i + arr[i];
      jumpFrom = i; // candidate landing point producing best reach
    }
    steps.push({ i, maxReach, currEnd, jumps, note: `Scan i=${i}, maxReach=${maxReach}` });
    if (i === currEnd) {
      jumps++;
      currEnd = maxReach;
      chosen.push(jumpFrom);
      steps.push({ i, maxReach, currEnd, jumps, note: `JUMP → land at ${jumpFrom}, new window ends at ${currEnd}` });
      if (currEnd >= n - 1) break;
    }
  }
  // Build path from chosen landings
  const fullPath = [0, ...chosen.filter((p) => p !== 0), n - 1];
  // dedupe consecutive
  const dedup = fullPath.filter((v, idx) => idx === 0 || v !== fullPath[idx - 1]);
  return {
    name: "Greedy",
    jumps: currEnd >= n - 1 ? jumps : -1,
    path: currEnd >= n - 1 ? dedup : [],
    steps,
    complexity: "O(n)",
    reachable: currEnd >= n - 1,
  };
}

/** Dynamic Programming: O(n^2) — dp[i] = min jumps to reach i */
export function dpJumps(arr: number[]): AlgoResult {
  const n = arr.length;
  const steps: Step[] = [];
  const dp = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  dp[0] = 0;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (j + arr[j] >= i && dp[j] + 1 < dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
        steps.push({ i, maxReach: j + arr[j], currEnd: i, jumps: dp[i], note: `dp[${i}]=${dp[i]} via j=${j}` });
      }
    }
  }
  const reachable = dp[n - 1] !== Infinity;
  const path: number[] = [];
  if (reachable) {
    let cur = n - 1;
    while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
  }
  return {
    name: "Dynamic Programming",
    jumps: reachable ? dp[n - 1] : -1,
    path,
    steps,
    complexity: "O(n²)",
    reachable,
  };
}

/** BFS treating each index as a node with edges to i+1..i+arr[i] */
export function bfsJumps(arr: number[]): AlgoResult {
  const n = arr.length;
  const steps: Step[] = [];
  if (n <= 1) return { name: "BFS", jumps: 0, path: [0], steps, complexity: "O(V+E)", reachable: true };
  const visited = new Array(n).fill(false);
  const prev = new Array(n).fill(-1);
  const dist = new Array(n).fill(-1);
  const queue: number[] = [0];
  visited[0] = true; dist[0] = 0;
  while (queue.length) {
    const u = queue.shift()!;
    steps.push({ i: u, maxReach: u + arr[u], currEnd: dist[u], jumps: dist[u], note: `Visit node ${u} (level ${dist[u]})` });
    if (u === n - 1) break;
    for (let k = 1; k <= arr[u] && u + k < n; k++) {
      const v = u + k;
      if (!visited[v]) {
        visited[v] = true; prev[v] = u; dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  const reachable = dist[n - 1] !== -1;
  const path: number[] = [];
  if (reachable) {
    let cur = n - 1;
    while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
  }
  return {
    name: "BFS",
    jumps: reachable ? dist[n - 1] : -1,
    path,
    steps,
    complexity: "O(V+E)",
    reachable,
  };
}

/** Simplified Q-learning RL agent.
 *  State = index, Actions = 1..arr[i], Reward = -1 per step, +100 at goal, -50 if invalid.
 */
export type RLEpisode = { episode: number; jumps: number; reward: number; reachedGoal: boolean };
export type RLResult = AlgoResult & { episodes: RLEpisode[]; qTable: number[][] };

export function rlJumps(arr: number[], opts?: { episodes?: number; alpha?: number; gamma?: number; epsilonStart?: number; epsilonEnd?: number }): RLResult {
  const n = arr.length;
  const episodesCount = opts?.episodes ?? 400;
  const alpha = opts?.alpha ?? 0.2;
  const gamma = opts?.gamma ?? 0.9;
  const eps0 = opts?.epsilonStart ?? 1.0;
  const epsF = opts?.epsilonEnd ?? 0.05;

  const maxA = Math.max(1, ...arr);
  // Q[state][action-1] ; action k means jump k forward
  const Q: number[][] = Array.from({ length: n }, () => new Array(maxA).fill(0));
  const episodes: RLEpisode[] = [];

  if (n <= 1) {
    return { name: "AI (Q-Learning)", jumps: 0, path: [0], steps: [], complexity: "O(E·n)", reachable: true, episodes, qTable: Q };
  }

  for (let ep = 0; ep < episodesCount; ep++) {
    const epsilon = eps0 + (epsF - eps0) * (ep / episodesCount);
    let s = 0; let totalR = 0; let jumps = 0; let reached = false;
    const maxSteps = n * 2;
    for (let t = 0; t < maxSteps; t++) {
      const aMax = arr[s];
      if (aMax <= 0) { totalR -= 50; break; }
      // ε-greedy over valid actions
      let a: number;
      if (Math.random() < epsilon) {
        a = 1 + Math.floor(Math.random() * aMax);
      } else {
        let best = 1, bestV = -Infinity;
        for (let k = 1; k <= aMax; k++) {
          if (Q[s][k - 1] > bestV) { bestV = Q[s][k - 1]; best = k; }
        }
        a = best;
      }
      const sNext = s + a;
      let r = -1;
      let done = false;
      if (sNext >= n - 1) { r = 100; done = true; reached = true; }
      const futureMax = done ? 0 : Math.max(...Q[sNext]);
      Q[s][a - 1] = Q[s][a - 1] + alpha * (r + gamma * futureMax - Q[s][a - 1]);
      totalR += r; jumps++;
      s = sNext;
      if (done) break;
      if (sNext >= n) break;
    }
    episodes.push({ episode: ep + 1, jumps, reward: totalR, reachedGoal: reached });
  }

  // Greedy rollout from learned Q
  const path: number[] = [0];
  const steps: Step[] = [];
  let s = 0; let jumps = 0; let reachable = false;
  const guard = n * 2;
  for (let t = 0; t < guard; t++) {
    const aMax = arr[s];
    if (aMax <= 0) break;
    let best = 1, bestV = -Infinity;
    for (let k = 1; k <= aMax; k++) {
      if (Q[s][k - 1] > bestV) { bestV = Q[s][k - 1]; best = k; }
    }
    const sNext = Math.min(s + best, n - 1);
    jumps++;
    path.push(sNext);
    steps.push({ i: s, maxReach: s + aMax, currEnd: sNext, jumps, note: `RL π(s=${s})=${best} → ${sNext}` });
    s = sNext;
    if (s >= n - 1) { reachable = true; break; }
  }
  return {
    name: "AI (Q-Learning)",
    jumps: reachable ? jumps : -1,
    path: reachable ? path : [],
    steps,
    complexity: "O(E·n)",
    reachable,
    episodes,
    qTable: Q,
  };
}
