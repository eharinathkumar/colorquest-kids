import { describe, expect, it } from "vitest";
import { getLearningLessons } from "./learning-data";

const ADDED_AGES_7_TO_9 = [
  "multiply-break-apart",
  "division-fact-families",
  "decimal-tenths-hundredths",
  "measurement-conversions",
];

const ADDED_AGES_10_TO_12 = [
  "coordinate-plane",
  "growing-number-patterns",
  "unit-rates",
  "two-step-equations",
];

describe("older-kids math curriculum", () => {
  it("expands only the two older age worlds and preserves the younger trails", () => {
    expect(getLearningLessons("math", 0)).toHaveLength(8);
    expect(getLearningLessons("math", 1)).toHaveLength(8);
    expect(getLearningLessons("math", 2)).toHaveLength(12);
    expect(getLearningLessons("math", 3)).toHaveLength(12);
  });

  it.each([
    [2, ADDED_AGES_7_TO_9],
    [3, ADDED_AGES_10_TO_12],
  ])("includes the planned concepts for age world %i", (ageWorld, expectedIds) => {
    const ids = getLearningLessons("math", ageWorld).map((lesson) => lesson.id);
    expect(ids).toEqual(expect.arrayContaining(expectedIds));
  });

  it.each([2, 3])("keeps every age-world %i lesson complete, unique, and answerable", (ageWorld) => {
    const lessons = getLearningLessons("math", ageWorld);

    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
    expect(new Set(lessons.map((lesson) => lesson.title)).size).toBe(lessons.length);

    for (const lesson of lessons) {
      expect(lesson.choices).toHaveLength(3);
      expect(new Set(lesson.choices).size).toBe(3);
      expect(lesson.choices).toContain(lesson.answer);
      expect(lesson.bigIdea.length).toBeGreaterThan(20);
      expect(lesson.explanation.length).toBeGreaterThan(50);
      expect(lesson.why.length).toBeGreaterThan(20);
      expect(lesson.activity.length).toBeGreaterThan(20);
      expect(lesson.words.length).toBeGreaterThanOrEqual(2);
      expect(lesson.words.every(([word, meaning]) => word.length > 0 && meaning.length > 0)).toBe(true);
    }
  });
});
