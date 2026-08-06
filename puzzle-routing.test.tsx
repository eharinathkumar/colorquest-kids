import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PuzzleBoard from "./PuzzleBoard";
import { activityCount } from "./content-counts";
import { buildPuzzle, getPuzzle, getPuzzleDeck } from "./puzzle-data";

afterEach(cleanup);

describe("advertised puzzle routing", () => {
  it("maps every advertised page one-to-one onto the unique reachable deck", () => {
    for (const age of [0, 1, 2, 3]) {
      const advertised = activityCount("puzzle", age);
      const deck = getPuzzleDeck(age);
      const reachableIds = Array.from(
        { length: advertised },
        (_, index) => getPuzzle(index + 1, age).id,
      );

      expect(advertised, `age world ${age} advertised count`).toBe(deck.length);
      expect(reachableIds, `age world ${age} page order`).toEqual(deck.map((puzzle) => puzzle.id));
      expect(new Set(reachableIds).size, `age world ${age} unique pages`).toBe(advertised);
    }
  });

  it("renders from the deduplicated deck after the first skipped duplicate", () => {
    for (const age of [0, 1, 2, 3]) {
      const advertised = activityCount("puzzle", age);
      const firstDivergentPage = Array.from(
        { length: advertised },
        (_, index) => index + 1,
      ).find((page) => buildPuzzle(page, age).id !== getPuzzle(page, age).id);

      // This assertion makes sure the fixture really exercises the historical
      // integration bug instead of passing on an early page where both routes
      // happen to produce the same puzzle.
      expect(firstDivergentPage, `age world ${age} regression page`).toBeDefined();

      const page = firstDivergentPage!;
      const { container, unmount } = render(
        <PuzzleBoard page={page} age={age} onComplete={() => undefined} />,
      );
      expect(container.querySelector("[data-puzzle-id]")?.getAttribute("data-puzzle-id"))
        .toBe(getPuzzle(page, age).id);
      unmount();
    }
  });
});
