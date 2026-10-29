// Pure ranking and reorder planning, kept free of the plugin API so it can be
// tested without a running bb.

const DAY_MS = 24 * 60 * 60 * 1000;
const PROJECT_SECTION_PREFIX = "project:";

export interface UsageThread {
  projectId: string;
  parentThreadId: string | null;
  updatedAt: number;
}

export interface ProjectUsage {
  projectId: string;
  /** Sum of each thread's recency weight; higher means used more lately. */
  score: number;
  threadCount: number;
  /** Epoch ms of the most recently updated thread, or null with no threads. */
  lastUsedAt: number | null;
}

export interface RankOptions {
  now: number;
  /** A thread last touched this many days ago counts half as much as one touched now. */
  halfLifeDays: number;
  includeChildThreads: boolean;
}

/**
 * Rank projects by usage. Every thread adds 0.5^(age / halfLife), so a
 * project used often and recently rises; one used heavily months ago sinks.
 * Ties keep the current order, so unused projects do not shuffle.
 */
export function rankProjects(
  projectIds: readonly string[],
  threads: readonly UsageThread[],
  options: RankOptions,
): ProjectUsage[] {
  const halfLifeMs = Math.max(options.halfLifeDays, 0.01) * DAY_MS;
  const usage = new Map<string, ProjectUsage>(
    projectIds.map((projectId) => [projectId, { projectId, score: 0, threadCount: 0, lastUsedAt: null }]),
  );
  for (const thread of threads) {
    if (!options.includeChildThreads && thread.parentThreadId !== null) continue;
    const entry = usage.get(thread.projectId);
    if (entry === undefined) continue;
    const age = Math.max(options.now - thread.updatedAt, 0);
    entry.score += 0.5 ** (age / halfLifeMs);
    entry.threadCount += 1;
    entry.lastUsedAt = Math.max(entry.lastUsedAt ?? 0, thread.updatedAt);
  }
  const position = new Map(projectIds.map((id, index) => [id, index]));
  return [...usage.values()].sort(
    (left, right) =>
      right.score - left.score ||
      (right.lastUsedAt ?? 0) - (left.lastUsedAt ?? 0) ||
      (position.get(left.projectId) ?? 0) - (position.get(right.projectId) ?? 0),
  );
}

export interface ReorderMove {
  projectId: string;
  previousProjectId: string | null;
  nextProjectId: string | null;
}

/**
 * The moves that turn `current` into `desired`, one project at a time. Each
 * move names the neighbours it lands between, which are adjacent at that
 * moment, matching the server's `projects.reorder` contract.
 */
export function planReorder(current: readonly string[], desired: readonly string[]): ReorderMove[] {
  const wanted = new Set(desired);
  const working = current.filter((id) => wanted.has(id));
  const moves: ReorderMove[] = [];
  desired.forEach((projectId, index) => {
    if (working[index] === projectId) return;
    const from = working.indexOf(projectId);
    if (from === -1) return;
    moves.push({
      projectId,
      previousProjectId: index > 0 ? desired[index - 1]! : null,
      nextProjectId: working[index] ?? null,
    });
    working.splice(from, 1);
    working.splice(index, 0, projectId);
  });
  return moves;
}

/**
 * Rewrite the built-in sidebar's top-level order: the project entries take the
 * ranked order inside the block where projects already sit, and the other
 * entries (pinned, threads) keep their places. Entries for projects the
 * ranking does not know stay after the ranked ones.
 */
export function rewriteSectionOrder(current: readonly string[], rankedProjectIds: readonly string[]): string[] {
  const ranked = rankedProjectIds.map((id) => `${PROJECT_SECTION_PREFIX}${id}`);
  const rankedSet = new Set(ranked);
  const unknown = current.filter((entry) => entry.startsWith(PROJECT_SECTION_PREFIX) && !rankedSet.has(entry));
  const block = [...ranked, ...unknown];
  const result: string[] = [];
  let inserted = false;
  for (const entry of current) {
    if (!entry.startsWith(PROJECT_SECTION_PREFIX)) {
      if (!inserted && entry === "threads") {
        result.push(...block);
        inserted = true;
      }
      result.push(entry);
      continue;
    }
    if (!inserted) {
      result.push(...block);
      inserted = true;
    }
  }
  if (!inserted) result.push(...block);
  return result;
}

export function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}
