import { describe, expect, it } from "vitest";
import { isNewToChild, pickUnseenPage, unseenPages } from "./novelty";

describe("novelty helpers", () => {
  it("lists only pages not yet completed in the given age world", () => {
    const completed = ["0:2", "0:4", "1:2"]; // age world 1's key must not count for world 0
    expect(unseenPages(5, completed, 0)).toEqual([1, 3, 5]);
  });

  it("marks a page new only when it has not been completed", () => {
    const completed = ["0:3"];
    expect(isNewToChild(3, completed, 0)).toBe(false);
    expect(isNewToChild(1, completed, 0)).toBe(true);
    expect(isNewToChild(3, completed, 1)).toBe(true); // different age world
  });

  it("picks an unseen page and never returns the current one", () => {
    const completed = ["0:1", "0:2"]; // pages 3,4,5 unseen
    for (let seed = 0; seed < 20; seed += 1) {
      const pick = pickUnseenPage(5, completed, 0, 3, seed);
      expect([4, 5]).toContain(pick); // unseen, excluding current page 3
    }
  });

  it("is deterministic for a given seed", () => {
    const completed: string[] = [];
    expect(pickUnseenPage(10, completed, 0, 1, 7)).toBe(pickUnseenPage(10, completed, 0, 1, 7));
  });

  it("falls back to advancing when everything is completed", () => {
    const completed = ["0:1", "0:2", "0:3"];
    expect(pickUnseenPage(3, completed, 0, 3, 0)).toBe(1); // wraps past the last page
    expect(pickUnseenPage(3, completed, 0, 1, 0)).toBe(2);
  });

  it("returns the current page when there is only one item", () => {
    expect(pickUnseenPage(1, [], 0, 1, 5)).toBe(1);
  });
});
