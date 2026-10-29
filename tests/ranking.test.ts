import { describe, expect, it } from "vitest";
import { planReorder, rankProjects, rewriteSectionOrder } from "../ranking";

const DAY = 24 * 60 * 60 * 1000;
const now = 100 * DAY;
const thread = (projectId: string, daysAgo: number, parentThreadId: string | null = null) => ({
  projectId,
  parentThreadId,
  updatedAt: now - daysAgo * DAY,
});

function applyMoves(current: string[], desired: string[]): string[] {
  const list = [...current];
  for (const move of planReorder(current, desired)) {
    list.splice(list.indexOf(move.projectId), 1);
    const at = move.nextProjectId === null ? list.length : list.indexOf(move.nextProjectId);
    // The neighbours a move names must be adjacent where it lands.
    expect(at === 0 ? null : list[at - 1]).toBe(move.previousProjectId);
    list.splice(at, 0, move.projectId);
  }
  return list;
}

describe("rankProjects", () => {
  const options = { now, halfLifeDays: 14, includeChildThreads: false };

  it("puts a project used often and recently above one used heavily long ago", () => {
    const threads = [
      ...Array.from({ length: 20 }, () => thread("old", 120)),
      thread("recent", 1),
      thread("recent", 2),
      thread("recent", 3),
    ];
    const ranked = rankProjects(["old", "recent", "unused"], threads, options);
    expect(ranked.map((usage) => usage.projectId)).toEqual(["recent", "old", "unused"]);
    expect(ranked[0]).toMatchObject({ threadCount: 3, lastUsedAt: now - DAY });
  });

  it("ignores child threads unless asked to count them", () => {
    const threads = [thread("a", 1), ...Array.from({ length: 5 }, () => thread("b", 1, "parent"))];
    expect(rankProjects(["b", "a"], threads, options).map((usage) => usage.projectId)).toEqual(["a", "b"]);
    expect(
      rankProjects(["b", "a"], threads, { ...options, includeChildThreads: true }).map((usage) => usage.projectId),
    ).toEqual(["b", "a"]);
  });

  it("keeps the current order for projects with no usage and skips unknown projects", () => {
    const ranked = rankProjects(["x", "y", "z"], [thread("gone", 0)], options);
    expect(ranked.map((usage) => usage.projectId)).toEqual(["x", "y", "z"]);
  });
});

describe("planReorder", () => {
  it.each([
    [["a", "b", "c", "d"], ["d", "c", "b", "a"]],
    [["a", "b", "c", "d"], ["a", "b", "c", "d"]],
    [["a", "b", "c", "d"], ["c", "a", "b", "d"]],
    [["a", "b", "c", "d", "e"], ["b", "e", "a", "d", "c"]],
  ])("turns %j into %j with valid neighbour moves", (current, desired) => {
    expect(applyMoves(current, desired)).toEqual(desired);
  });

  it("makes no moves when the order already matches", () => {
    expect(planReorder(["a", "b"], ["a", "b"])).toEqual([]);
  });
});

describe("rewriteSectionOrder", () => {
  it("reorders project entries in place and keeps pinned and threads where they are", () => {
    expect(
      rewriteSectionOrder(["pinned", "project:a", "project:b", "project:c", "threads"], ["c", "a", "b"]),
    ).toEqual(["pinned", "project:c", "project:a", "project:b", "threads"]);
  });

  it("adds projects missing from the stored order and keeps unknown entries after the ranked ones", () => {
    expect(rewriteSectionOrder(["pinned", "project:old", "project:a", "threads"], ["b", "a"])).toEqual([
      "pinned",
      "project:b",
      "project:a",
      "project:old",
      "threads",
    ]);
  });

  it("places the project block before threads when the stored order has no projects", () => {
    expect(rewriteSectionOrder(["pinned", "threads"], ["a"])).toEqual(["pinned", "project:a", "threads"]);
    expect(rewriteSectionOrder([], ["a"])).toEqual(["project:a"]);
  });
});
