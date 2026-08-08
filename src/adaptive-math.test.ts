import { describe, expect, it } from "vitest";
import { getLearningLesson, getLearningLessons } from "./learning-data";
import {
  applyMathAnswer,
  emptyMathPracticeState,
  evaluateMathReadiness,
  generateAdaptiveMathQuestion,
  recordAdaptiveMathAnswer,
  starterMathLevel,
  type MathAnswerContext,
  type MathRepresentation,
} from "./adaptive-math";
import { emptyFamilyData, emptyProgress, type MathPracticeOutcome } from "./profile-data";

describe("adaptive maths practice for ages 4–6", () => {
  const lesson = getLearningLesson("math", 1, 3); // addition stories
  const context = (representation: MathRepresentation, childAge = 4, sessionId = "visit-a"): MathAnswerContext => ({
    lessonId: lesson.id,
    representation,
    childAge,
    sessionId,
  });

  it("uses distinct exact-age starting points", () => {
    expect([4, 5, 6].map(starterMathLevel)).toEqual([1, 2, 3]);
    const questions = [4, 5, 6].map((childAge) => generateAdaptiveMathQuestion({ profileId: "maya", childAge, lesson, sessionSeed: "first" }));
    expect(questions.map((item) => item.level)).toEqual([1, 2, 3]);
  });

  it("is stable in one turn, varies next time, and supplies spoken labels", () => {
    const state = emptyMathPracticeState();
    const first = generateAdaptiveMathQuestion({ profileId: "maya", childAge: 6, lesson, state, sessionSeed: "open-1" });
    const rerender = generateAdaptiveMathQuestion({ profileId: "maya", childAge: 6, lesson, state, sessionSeed: "open-1" });
    expect(rerender).toEqual(first);
    expect(first.speakText.length).toBeGreaterThan(5);
    expect(first.choiceLabels.every(Boolean)).toBe(true);

    const nextState = applyMathAnswer(state, first.id, true, context(first.representation, 6, "open-1"));
    const next = generateAdaptiveMathQuestion({ profileId: "maya", childAge: 6, lesson, state: nextState, sessionSeed: "open-1" });
    expect(next.id).not.toBe(first.id);
    expect(next.choices).toContain(next.answer);
  });

  it("skips recent signatures and remembers at least forty", () => {
    let state = emptyMathPracticeState();
    state.recentQuestionIds = Array.from({ length: 47 }, (_, index) => `old-${index}`);
    const first = generateAdaptiveMathQuestion({ profileId: "maya", childAge: 5, lesson, state, sessionSeed: "visit-a" });
    state = applyMathAnswer(state, first.id, true, context(first.representation, 5));
    expect(state.recentQuestionIds).toHaveLength(48);
    const reopened = generateAdaptiveMathQuestion({ profileId: "maya", childAge: 5, lesson, state, sessionSeed: "visit-b" });
    expect(reopened.id).not.toBe(first.id);
  });

  it("raises challenge after three of four first-try successes across representations", () => {
    let state = emptyMathPracticeState();
    state = applyMathAnswer(state, "q1", true, context("story"));
    state = applyMathAnswer(state, "q2", false, context("objects"));
    state = applyMathAnswer(state, "q3", true, context("objects"));
    state = applyMathAnswer(state, "q4", true, context("symbols"));
    expect(state.level).toBe(2);
  });

  it("adds support after two first-try misses but only steps down after a larger struggle window", () => {
    let state = { ...emptyMathPracticeState(), level: 4 };
    state = applyMathAnswer(state, "q1", false, context("story", 6));
    state = applyMathAnswer(state, "q2", false, context("objects", 6));
    expect(state.supportLevel).toBe(2);
    expect(state.level).toBe(4);
    const supported = generateAdaptiveMathQuestion({ profileId: "maya", childAge: 6, lesson, state, sessionSeed: "support" });
    expect(supported.level).toBe(3);
    for (const [index, representation] of ["number-line", "symbols", "story", "objects"].entries()) {
      state = applyMathAnswer(state, `q${index + 3}`, false, context(representation as MathRepresentation, 6));
    }
    expect(state.level).toBe(3);
  });

  it("does not count a corrected mistake as first-try mastery", () => {
    let state = emptyMathPracticeState();
    state = applyMathAnswer(state, "q1", false, context("story"));
    state = applyMathAnswer(state, "q1", true, context("story"));
    expect(state.recentOutcomes).toHaveLength(1);
    expect(state.recentOutcomes[0].firstTry).toBe(false);
    expect(state.correct).toBe(1);
  });

  it("marks readiness only after five of six across two quests and three representations", () => {
    const outcomes: MathPracticeOutcome[] = [
      ["q1", "count-to-twenty", "objects", true, "s1"],
      ["q2", "count-to-twenty", "number-line", true, "s1"],
      ["q3", "number-order", "symbols", false, "s1"],
      ["q4", "number-order", "number-line", true, "s2"],
      ["q5", "addition-stories", "story", true, "s2"],
      ["q6", "addition-stories", "objects", true, "s2"],
    ].map(([questionId, lessonId, representation, firstTry, sessionId]) => ({
      questionId: String(questionId), lessonId: String(lessonId), representation: String(representation), firstTry: Boolean(firstTry), sessionId: String(sessionId),
    }));
    expect(evaluateMathReadiness(outcomes)).toMatchObject({ ready: true, successes: 5, quests: 2 });
  });

  it("persists separate paths per child and lesson", () => {
    const family = emptyFamilyData();
    family.profiles = [{ id: "maya", name: "Maya", age: 6, avatar: "🦊", createdAt: "now" }];
    family.activeProfileId = "maya";
    family.progress.maya = emptyProgress();
    const saved = recordAdaptiveMathAnswer(family, "maya", lesson.id, "question-a", true, {
      childAge: 6, representation: "story", sessionId: "s1",
    });
    expect(saved.progress.maya.learning.mathPractice[lesson.id].correct).toBe(1);
    expect(saved.progress.maya.learning.mathJourney).toHaveLength(1);
    expect(family.progress.maya.learning.mathPractice[lesson.id]).toBeUndefined();
  });

  it("generates valid choices across the four first-slice quests", () => {
    for (let page = 1; page <= 4; page += 1) {
      const current = getLearningLesson("math", 1, page);
      for (const childAge of [4, 5, 6]) {
        const question = generateAdaptiveMathQuestion({ profileId: "learner", childAge, lesson: current, sessionSeed: `${page}-${childAge}` });
        expect(question.choices).toHaveLength(3);
        expect(new Set(question.choices).size).toBe(3);
        expect(question.choices).toContain(question.answer);
        expect(question.choiceLabels).toHaveLength(3);
      }
    }
  });

  it("serves ten fresh questions without an exact repeat in each first-slice concept", () => {
    for (let page = 1; page <= 4; page += 1) {
      const current = getLearningLesson("math", 1, page);
      let state = { ...emptyMathPracticeState(), level: starterMathLevel(6) };
      const ids = new Set<string>();
      for (let turn = 0; turn < 10; turn += 1) {
        const question = generateAdaptiveMathQuestion({ profileId: "maya", childAge: 6, lesson: current, state, sessionSeed: `quest-${turn}` });
        expect(ids.has(question.id), `${current.id} repeated ${question.id}`).toBe(false);
        ids.add(question.id);
        state = applyMathAnswer(state, question.id, true, {
          lessonId: current.id,
          representation: question.representation,
          childAge: 6,
          sessionId: "quest",
        });
      }
    }
  });

  it("keeps every Math concept valid and variable across all four age worlds", () => {
    const childAges = [3, 6, 9, 12];
    for (let ageWorld = 0; ageWorld < 4; ageWorld += 1) {
      for (const current of getLearningLessons("math", ageWorld)) {
        const visible = new Set<string>();
        for (let turn = 0; turn < 6; turn += 1) {
          const question = generateAdaptiveMathQuestion({
            profileId: "learner",
            childAge: childAges[ageWorld],
            lesson: current,
            state: { level: Math.min(5, turn + 1), sequence: turn },
            sessionSeed: `${ageWorld}-${turn}`,
          });
          expect(question.choices).toHaveLength(3);
          expect(new Set(question.choices).size, `${current.id}: ${question.choices.join(" | ")}`).toBe(3);
          expect(question.choices).toContain(question.answer);
          expect(question.choiceLabels.every(Boolean)).toBe(true);
          visible.add(`${question.prompt}|${question.answer}`);
        }
        expect(visible.size, `${current.id} did not vary`).toBeGreaterThan(1);
      }
    }
  });
});
