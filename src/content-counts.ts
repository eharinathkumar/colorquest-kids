import { countPuzzles } from "./puzzle-data";
import { getLearningLessons } from "./learning-data";
import { getScienceLabs } from "./lab-data";
import { DISCOVERY_COUNTS } from "./discovery-data";
import { getStoryBooks } from "./story-data";
import type { ActivityKey } from "./profile-data";

/**
 * How much content actually exists, per activity and age world.
 *
 * Every activity used to show "of 400" regardless of what stood behind it —
 * coloring had ten scenes, drawing had six prompts, and the puzzle banks ran
 * dry well before page 400. The number a parent reads should be one they can
 * verify by paging to the end, so all of these are derived from the content
 * itself rather than written down.
 */

/** Distinct coloring scenes drawn in `ColoringScene`. */
export const COLORING_SCENE_COUNT = 10;

/** Distinct creative prompts per age band in the Drawing Studio. */
export const DRAW_PROMPT_COUNT = 6;

/**
 * Drawing is an open canvas, not a finite set of pages: a child can start a new
 * picture forever. This is how many blank pages the studio offers before the
 * prompt rotation repeats — enough to feel unlimited without claiming a total
 * the app cannot back up.
 */
export const DRAW_PAGE_COUNT = 60;

export function activityCount(activity: ActivityKey, ageWorld: number): number {
  switch (activity) {
    case "color":
      return COLORING_SCENE_COUNT;
    case "draw":
      return DRAW_PAGE_COUNT;
    case "puzzle":
      return countPuzzles(ageWorld);
    case "stories":
      return getStoryBooks(ageWorld).length;
    case "math":
    case "science":
      return getLearningLessons(activity, ageWorld).length;
    case "lab":
      return getScienceLabs(ageWorld).length;
    case "discover":
      return DISCOVERY_COUNTS.missions;
    default:
      return 1;
  }
}

/** What one unit of this activity is called, for "Concept 3 of 8" style labels. */
export function activityUnit(activity: ActivityKey): string {
  switch (activity) {
    case "math":
    case "science":
      return "Concept";
    case "lab":
      return "Lab";
    case "color":
      return "Page";
    case "draw":
      return "Canvas";
    case "puzzle":
      return "Puzzle";
    case "discover":
      return "Mission";
    case "stories":
      return "Book";
    default:
      return "Activity";
  }
}

/** Plural noun for summary lines: "10 coloring pages". */
export function activityNoun(activity: ActivityKey, count: number): string {
  const plural = count === 1 ? "" : "s";
  switch (activity) {
    case "math":
    case "science":
      return `concept${plural}`;
    case "lab":
      return `lab${plural}`;
    case "color":
      return `coloring page${plural}`;
    case "draw":
      return `blank canvas${count === 1 ? "" : "es"}`;
    case "puzzle":
      return `puzzle${plural}`;
    case "discover":
      return `mission${plural}`;
    case "stories":
      return `storybook${plural}`;
    default:
      return `activity${count === 1 ? "" : "ies"}`;
  }
}
