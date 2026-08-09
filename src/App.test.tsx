import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import ColorQuestApp from "./App";
import { buildDiscoveryMission, DISCOVERY_COUNTS } from "./discovery-data";
import { getLearningLesson, getLearningLessons, LEARNING_COUNTS } from "./learning-data";
import { getScienceLabs, LAB_COUNTS } from "./lab-data";
import { getCuratedResource, getFavoriteInterest, getLessonGuide, getMentorRecommendations } from "./mentor-data";
import { buildPuzzle, countPuzzles, getPuzzle, getPuzzleDeck, PUZZLE_FAMILIES } from "./puzzle-data";
import { activityCount, COLORING_SCENE_COUNT } from "./content-counts";
import { isSpeechSupported, joinForSpeech, rateForAge, shouldAutoRead, speak, stopSpeaking, toSpokenText } from "./speech";
import { makeGateChallenge } from "./GrownUpGate";
import { artCredit, DiscoveryArt, sceneFor } from "./discovery-art";
import { draftKey, loadDraft, saveDraft } from "./canvas-drafts";
import { emptyProgress, PROFILE_STORAGE_KEY, recordCompletion, recordLocation, type FamilyData } from "./profile-data";
import {
  activityGroupsForAge,
  isActivityAvailable,
  safePageForActivity,
  safeResumeLocation,
} from "./activity-organization";

vi.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE" },
  Filesystem: { writeFile: vi.fn() },
}));

vi.mock("@capacitor/share", () => ({
  Share: { share: vi.fn() },
}));

const canvasContext = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  bezierCurveTo: vi.fn(),
  closePath: vi.fn(),
  clearRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  drawImage: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  rect: vi.fn(),
  restore: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  setLineDash: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  fillStyle: "",
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  lineCap: "round",
  lineJoin: "round",
  lineWidth: 1,
  strokeStyle: "",
};

beforeEach(() => {
  const family: FamilyData = {
    version: 3,
    profiles: [{ id: "profile-test", name: "Maya", age: 6, avatar: "🦊", createdAt: "2026-08-02T00:00:00.000Z" }],
    activeProfileId: "profile-test",
    progress: { "profile-test": emptyProgress() },
  };
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(family));
  window.localStorage.removeItem("colorquest-draft-fallback");
  Object.values(canvasContext).forEach((value) => {
    if (typeof value === "function" && "mockClear" in value) value.mockClear();
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    canvasContext as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,test");
});


/**
 * The grown-up gate now asks a freshly generated multiplication, so a test
 * cannot hard-code the answer any more than a child can memorise it.
 */
async function passGrownUpGate(user: ReturnType<typeof userEvent.setup>, confirmLabel: string) {
  const sum = document.querySelector(".gate-sum")?.textContent || "";
  const [, left, right] = sum.match(/(\d+)\s*×\s*(\d+)/) || [];
  expect(left).toBeTruthy();
  await user.type(screen.getByLabelText(`Answer to ${left} times ${right}`), String(Number(left) * Number(right)));
  await user.click(screen.getByRole("button", { name: confirmLabel }));
}

async function openHomeActivity(
  user: ReturnType<typeof userEvent.setup>,
  door: "Create" | "Play" | "Learn",
  activity: RegExp,
) {
  await user.click(screen.getByRole("button", { name: new RegExp(`^${door}`) }));
  await user.click(screen.getByRole("button", { name: activity }));
}

describe("ColorQuest core journeys", () => {
  it("greets the active child with Fifi's age-aware speech bubble", () => {
    render(<ColorQuestApp />);
    expect(screen.getByRole("note", { name: "Fifi's tip" })).toBeTruthy();
    expect(screen.getByText("Hi Maya! Fifi just hopped in.")).toBeTruthy();
    expect(screen.getByText(/Ready to draw, count, wonder/)).toBeTruthy();
  });

  it("opens the drawing studio from the home page", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);

    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);

    expect(screen.getByRole("heading", { name: "Creative Studio" })).toBeTruthy();
    expect(screen.getByLabelText("Free drawing canvas")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Leave Creative Studio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "New page" })).toBeTruthy();
    expect(document.querySelector(".canvas-stage .prompt-card")).toBeNull();
    const ideaButton = screen.getByRole("button", { name: "Show me an idea" });
    expect(ideaButton.getAttribute("aria-expanded")).toBe("false");
    await user.click(ideaButton);
    expect(screen.getByText("Use it, remix it, or invent your own idea.")).toBeTruthy();
  });

  it("places and edits square and triangle shapes without blanking or resizing the mobile canvas", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);

    await user.click(screen.getByRole("button", { name: "Add square shapes" }));
    const squareCanvas = screen.getByLabelText("Canvas ready to add square shapes") as HTMLCanvasElement;
    const originalWidth = squareCanvas.width;
    const originalHeight = squareCanvas.height;
    fireEvent.pointerDown(squareCanvas, { clientX: 180, clientY: 260, pointerId: 1 });

    expect(squareCanvas.width).toBe(originalWidth);
    expect(squareCanvas.height).toBe(originalHeight);
    expect(screen.getByRole("button", { name: "Select square" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "＋ Bigger" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Creative Studio" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Add triangle shapes" }));
    const triangleCanvas = screen.getByLabelText("Canvas ready to add triangle shapes") as HTMLCanvasElement;
    fireEvent.pointerDown(triangleCanvas, { clientX: 140, clientY: 210, pointerId: 2 });

    expect(screen.getByRole("button", { name: "Select triangle" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "↻ Rotate" }));
    expect(screen.getByRole("heading", { name: "Creative Studio" })).toBeTruthy();
  });

  it("supports expressive brushes and base paint without replacing the drawing layer", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);

    await user.click(screen.getByRole("button", { name: "Use crayon brush" }));
    const canvas = screen.getByLabelText("Free drawing canvas");
    fireEvent.pointerDown(canvas, { clientX: 70, clientY: 100, pointerId: 3 });
    fireEvent.pointerMove(canvas, { clientX: 130, clientY: 150, pointerId: 3 });
    fireEvent.pointerUp(canvas, { clientX: 130, clientY: 150, pointerId: 3 });

    expect(canvasContext.stroke).toHaveBeenCalledTimes(3);
    await user.click(screen.getByRole("button", { name: "Ocean" }));
    expect(screen.getByRole("button", { name: "Ocean" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Free drawing canvas")).toBeTruthy();
  });

  it("silently autosaves and leaves a drawing without any confirmation popup", async () => {
    const user = userEvent.setup();
    const browserConfirm = vi.spyOn(window, "confirm");
    render(<ColorQuestApp />);
    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);

    const canvas = screen.getByLabelText("Free drawing canvas");
    fireEvent.pointerDown(canvas, { clientX: 60, clientY: 80, pointerId: 7 });
    fireEvent.pointerMove(canvas, { clientX: 110, clientY: 120, pointerId: 7 });
    fireEvent.pointerUp(canvas, { clientX: 110, clientY: 120, pointerId: 7 });
    await user.click(screen.getByRole("button", { name: "Leave Creative Studio" }));
    await user.click(screen.getByRole("button", { name: "Grown-ups" }));

    expect(browserConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { name: "Quick check" })).toBeTruthy();
    browserConfirm.mockRestore();
  });

  it("shows and reopens one of the four silently saved recent canvases", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);
    const canvas = screen.getByLabelText("Free drawing canvas");
    fireEvent.pointerDown(canvas, { clientX: 45, clientY: 65, pointerId: 9 });
    fireEvent.pointerMove(canvas, { clientX: 105, clientY: 125, pointerId: 9 });
    fireEvent.pointerUp(canvas, { clientX: 105, clientY: 125, pointerId: 9 });

    const recentToggle = await screen.findByRole("button", { name: /Recent work/ });
    expect(recentToggle.parentElement?.contains(screen.getByRole("button", { name: "New page" }))).toBe(true);
    await user.click(recentToggle);
    const recent = await screen.findByRole("navigation", { name: "Four most recent creative canvases" });
    expect(recent).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next canvas" }));
    await user.click(screen.getByRole("button", { name: /Draw canvas 1/ }));
    expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("1");
  });

  it("saves privately, then lets a parent use Android's native save/share sheet", async () => {
    const user = userEvent.setup();
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const writeFile = vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: "content://colorquest/picture.png" });
    const share = vi.mocked(Share.share).mockResolvedValue({ activityType: "android.intent.action.SEND" });

    render(<ColorQuestApp />);
    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);
    await user.click(screen.getByRole("button", { name: "Save to gallery" }));
    expect(screen.getByRole("status").textContent).toContain("Saved privately");

    await user.click(screen.getByRole("button", { name: "Leave Creative Studio" }));
    await user.click(screen.getByRole("button", { name: "Grown-ups" }));
    await passGrownUpGate(user, "Open parent corner");
    const exportButton = await screen.findByRole("button", { name: "Download / share" });
    await user.click(exportButton);

    await waitFor(() => expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: "maya-s-creation-1.png" })));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: ["content://colorquest/picture.png"] }));
  });

  it("colors a drawing and keeps the coloring activity usable", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await openHomeActivity(user, "Create", /^Color,/);

    const picture = screen.getByRole("img", { name: /Color / });
    const palette = screen.getByRole("region", { name: "Coloring tools" });
    expect(picture.compareDocumentPosition(palette) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Choose Sunshine" }));
    const background = screen.getByRole("button", { name: "Color picture background" });
    await user.click(background);
    expect(background.querySelector("rect")?.getAttribute("fill")).toBe("#ffd65a");
    const firstPart = screen.getByRole("button", { name: "Color part 1" });
    await user.click(firstPart);

    expect(firstPart.querySelector("circle, ellipse, path, rect")?.getAttribute("fill")).toBe("#ffd65a");
    expect(screen.getByRole("heading", { name: "Creative Studio" })).toBeTruthy();
  });
});

describe("Private child profiles and pacing", () => {
  it("creates a first profile and chooses content from the child's age", async () => {
    window.localStorage.clear();
    window.localStorage.setItem("colorquest-progress", "4");
    const user = userEvent.setup();
    render(<ColorQuestApp />);

    expect(screen.getByRole("heading", { name: "Who is creating today?" })).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Little artist"), "Aria");
    fireEvent.change(screen.getByRole("slider", { name: /^Age/ }), { target: { value: "9" } });
    await user.click(screen.getByRole("button", { name: /Create Aria's space/ }));

    expect(screen.getByRole("button", { name: "Switch profile, currently Aria" })).toBeTruthy();
    expect(screen.getByText("🚀 Made for age 9")).toBeTruthy();
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "{}") as FamilyData;
      expect(saved.progress[saved.activeProfileId!].legacyCompleted).toBe(4);
    });
  });

  it("records resume locations and unique completion separately", () => {
    const family: FamilyData = {
      version: 3,
      profiles: [{ id: "one", name: "One", age: 8, avatar: "🚀", createdAt: "now" }],
      activeProfileId: "one",
      progress: { one: emptyProgress() },
    };
    const located = recordLocation(family, "one", "science", 5);
    const completed = recordCompletion(located, "one", "science", 2, 5);
    const repeated = recordCompletion(completed, "one", "science", 2, 5);

    expect(repeated.progress.one.lastActivity).toBe("science");
    expect(repeated.progress.one.activities.science.lastPage).toBe(5);
    expect(repeated.progress.one.activities.science.completed).toEqual(["2:5"]);
  });
});

describe("Discovery Lab catalog", () => {
  it("generates 400 distinct missions for both older age worlds", () => {
    expect(DISCOVERY_COUNTS.missions).toBe(400);

    for (const age of [2, 3]) {
      const missions = Array.from({ length: 400 }, (_, index) => buildDiscoveryMission(index + 1, age));
      const titles = new Set(missions.map((mission) => mission.title));
      const stories = new Set(missions.map((mission) => mission.story));

      expect(titles.size).toBe(400);
      expect(stories.size).toBe(400);
      expect(missions.every((mission) => mission.question && Number.isFinite(mission.answer))).toBe(true);
    }
  });
});

describe("Varied puzzle catalog", () => {
  it("rotates six puzzle mechanics with varied content in every age world", () => {
    for (const age of [0, 1, 2, 3]) {
      const puzzles = Array.from({ length: 60 }, (_, index) => buildPuzzle(index + 1, age));
      const familyOf = (puzzle: ReturnType<typeof buildPuzzle>) =>
        puzzle.kind === "choice" ? puzzle.family : puzzle.kind;

      expect(new Set(puzzles.map((puzzle) => puzzle.id)).size).toBe(60);

      for (let start = 0; start < puzzles.length; start += PUZZLE_FAMILIES.length) {
        expect(new Set(puzzles.slice(start, start + 6).map(familyOf))).toEqual(new Set(PUZZLE_FAMILIES));
      }

      for (const family of PUZZLE_FAMILIES) {
        const content = puzzles
          .filter((puzzle) => familyOf(puzzle) === family)
          .map(({ id: _id, ...puzzle }) => JSON.stringify(puzzle));
        expect(new Set(content).size, `age ${age} ${family} content`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it("moves from matching to sorting to sequencing in the studio", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);

    await openHomeActivity(user, "Play", /^Puzzles/);
    expect(screen.getByText("Partner match")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Next puzzle" }));
    expect(screen.getByText("Sort & classify")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Next puzzle" }));
    expect(screen.getByText("Put in order")).toBeTruthy();
  });
});

describe("Child-friendly activity organization", () => {
  it("places every visible activity in one clear path for each age world", () => {
    for (const age of [0, 1, 2, 3]) {
      const groups = activityGroupsForAge(age);
      expect(groups.map((group) => group.title)).toEqual(["Creative Studio", "Play & Read", "Learn & Discover"]);
      const activities = groups.flatMap((group) => group.activities);
      expect(new Set(activities).size).toBe(activities.length);
      expect(activities.every((activity) => isActivityAvailable(activity, age))).toBe(true);
      expect(activities.includes("stories")).toBe(age < 2);
      expect(activities.includes("discover")).toBe(age >= 2);
    }
  });

  it("repairs old or out-of-range resume targets before opening them", () => {
    const progress = emptyProgress();
    progress.lastActivity = "stories";
    progress.activities.stories.lastPage = 99;
    expect(safeResumeLocation(progress, 3)).toEqual({ activity: "draw", page: 1 });

    progress.lastActivity = "puzzle";
    progress.activities.puzzle.lastPage = 999;
    expect(safeResumeLocation(progress, 1).page).toBe(activityCount("puzzle", 1));
    expect(safePageForActivity("math", 2, 0)).toBe(1);

    progress.lastActivity = "missing-route" as typeof progress.lastActivity;
    expect(safeResumeLocation(progress, 1)).toEqual({ activity: "draw", page: 1 });
  });

  it("shows three simple activity doors on Home", () => {
    render(<ColorQuestApp />);
    expect(screen.getByRole("button", { name: /^Create/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Play/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Learn/ })).toBeTruthy();
    expect(screen.queryByText("0 completed")).toBeNull();
  });

  it("opens a focused workspace without the Home launcher or age selector", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await openHomeActivity(user, "Play", /^Stories/);

    expect(screen.getByRole("heading", { name: "Stories" })).toBeTruthy();
    expect(document.querySelector(".studio-sidebar")).toBeNull();
    expect(document.querySelector(".child-home-v27, .home-door-grid, .activity-section, .age-grid, .topbar")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Create/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Switch profile/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Activities" })).toBeTruthy();
  });

  it("switches activities inside a focused chooser and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await openHomeActivity(user, "Play", /^Puzzles/);
    await user.click(screen.getByRole("button", { name: "Activities" }));
    expect(screen.getByRole("dialog", { name: "What next?" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "What next?" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Activities" }));
    await user.click(screen.getByRole("button", { name: /^Learn:/ }));
    await user.click(screen.getByRole("button", { name: /^Science,/ }));
    expect(screen.getByRole("heading", { name: "Science" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "What next?" })).toBeNull();
    expect(document.querySelector(".child-home-v27, .home-door-grid, .activity-section, .age-grid, .topbar")).toBeNull();
    expect(screen.queryByRole("button", { name: /Switch profile/ })).toBeNull();
  });

  it("keeps every outside resource HTTPS and on an approved education host", () => {
    const resources = [
      getCuratedResource("science", "space"),
      getCuratedResource("science", "earth"),
      getCuratedResource("science", "experiments"),
      getCuratedResource("math", "numbers"),
    ];
    const approvedHosts = new Set(["spaceplace.nasa.gov", "www.nesdis.noaa.gov", "phet.colorado.edu"]);
    for (const resource of resources) {
      const url = new URL(resource.url);
      expect(url.protocol).toBe("https:");
      expect(approvedHosts.has(url.hostname)).toBe(true);
    }
  });
});

describe("Math and science learning trails", () => {
  it("keeps complete learning trails while older math grows in planned phases", () => {
    expect(LEARNING_COUNTS.total).toBe(72);

    for (const subject of ["math", "science"] as const) {
      for (const age of [0, 1, 2, 3]) {
        const lessons = getLearningLessons(subject, age);
        const expected = subject === "math" && age >= 2 ? 12 : 8;
        expect(lessons).toHaveLength(expected);
        expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(expected);
        expect(new Set(lessons.map((lesson) => lesson.title)).size).toBe(expected);
        expect(lessons.every((lesson) => lesson.choices.length === 3 && lesson.choices.includes(lesson.answer))).toBe(true);
        expect(lessons.every((lesson) => lesson.bigIdea && lesson.explanation && lesson.why && lesson.activity)).toBe(true);
      }
    }
  });

  it("teaches a math idea, checks reasoning, and offers off-screen practice", async () => {
    const user = userEvent.setup();
    const lesson = getLearningLesson("math", 1, 1);
    render(<ColorQuestApp />);

    await openHomeActivity(user, "Learn", /^Number Games/);

    expect(screen.getByRole("heading", { name: "Number Games" })).toBeTruthy();
    expect(screen.getByText(lesson.bigIdea)).toBeTruthy();
    expect(screen.getByText("TRY IT AWAY FROM THE SCREEN")).toBeTruthy();
    const freshChoices = Array.from(document.querySelectorAll<HTMLButtonElement>(".question-card .answer-grid button"));
    for (const answerChoice of freshChoices) {
      if (screen.queryByText("Yes—your reasoning works!")) break;
      await user.click(answerChoice);
    }
    expect(screen.getByRole("status").textContent).toContain("Yes—your reasoning works!");
  });

  it("gives an age-six child a fresh Math question and remembers the result", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await openHomeActivity(user, "Learn", /^Number Games/);

    const firstPrompt = document.querySelector(".question-card h4")?.textContent;
    expect(firstPrompt).toBeTruthy();
    expect(screen.getByText("FIFI'S FRESH MATH QUEST")).toBeTruthy();

    for (const answerChoice of Array.from(document.querySelectorAll<HTMLButtonElement>(".question-card .answer-grid button"))) {
      if (screen.queryByText("Yes—your reasoning works!")) break;
      await user.click(answerChoice);
    }
    await user.click(screen.getByRole("button", { name: /Try another question/ }));

    expect(document.querySelector(".question-card h4")?.textContent).not.toBe(firstPrompt);
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "{}") as FamilyData;
    expect(saved.progress["profile-test"].learning.mathPractice["count-to-twenty"].correct).toBe(1);
  });

  it("keeps age-two Math playful, two-choice, and outside mastery scoring", async () => {
    const family = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "{}") as FamilyData;
    family.profiles[0].age = 2;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(family));
    const user = userEvent.setup();
    render(<ColorQuestApp />);

    await openHomeActivity(user, "Learn", /^Number Games/);
    expect(screen.getByText("Play & notice")).toBeTruthy();
    expect(document.querySelectorAll(".question-card .answer-grid button")).toHaveLength(2);
    await user.click(document.querySelector<HTMLButtonElement>(".question-card .answer-grid button")!);

    const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "{}") as FamilyData;
    expect(saved.progress["profile-test"].learning.mathPractice).toEqual({});
  });

  it("adapts science language and topics for ages 10–12", async () => {
    const family = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "{}") as FamilyData;
    family.profiles[0].age = 11;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(family));
    const user = userEvent.setup();
    const lesson = getLearningLesson("science", 3, 1);
    render(<ColorQuestApp />);

    await openHomeActivity(user, "Learn", /^Science/);

    expect(screen.getByRole("heading", { name: "Science" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: lesson.title })).toBeTruthy();
    expect(screen.getByText(lesson.explanation)).toBeTruthy();
    expect(screen.getByText("Concept 1 of 8")).toBeTruthy();
  });

  it("adds another explanation, a concept story, and remembers a child's interest", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await openHomeActivity(user, "Learn", /^Science/);

    await user.click(screen.getByRole("button", { name: "Explain it another way" }));
    expect(screen.getByText("Let’s unpack it")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Play concept story/ }));
    expect(screen.getByText(/Wonder · 1 of 4/)).toBeTruthy();

    const lesson = getLearningLesson("science", 1, 1);
    await user.click(screen.getByRole("button", { name: lesson.answer }));
    await user.click(screen.getByRole("button", { name: /I liked this—show me more/ }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "{}") as FamilyData;
      expect(saved.progress["profile-test"].learning.likedLessons).toContain(lesson.id);
      expect(getFavoriteInterest(saved.progress["profile-test"])).not.toBeNull();
    });
  });
});

describe("Science Lab and mentor paths", () => {
  it("contains distinct, safety-labelled investigations with deeper older-kid catalogs", () => {
    expect(LAB_COUNTS.total).toBe(47);
    const expectedPerAge = [8, 8, 15, 16];
    for (const age of [0, 1, 2, 3]) {
      const labs = getScienceLabs(age);
      expect(labs).toHaveLength(expectedPerAge[age]);
      expect(new Set(labs.map((lab) => lab.id)).size).toBe(expectedPerAge[age]);
      expect(labs.every((lab) => ["Child can try", "Grown-up nearby", "Grown-up required"].includes(lab.safety))).toBe(true);
      expect(labs.every((lab) => lab.steps.length >= 3 && lab.explanation && lab.wonder)).toBe(true);
    }
  });

  it("requires prediction and safe steps before revealing a lab explanation", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await openHomeActivity(user, "Learn", /^Try a Lab/);
    const lab = getScienceLabs(1)[0];
    const reveal = screen.getByRole("button", { name: "Reveal the science" });
    expect(reveal.hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: lab.predictions[0] }));
    for (const checkbox of screen.getAllByRole("checkbox")) await user.click(checkbox);
    expect(reveal.hasAttribute("disabled")).toBe(false);
    await user.click(reveal);
    expect(screen.getByText(lab.explanation)).toBeTruthy();
  });

  it("builds one next-step recommendation for each subject", () => {
    const progress = emptyProgress();
    const recommendations = getMentorRecommendations(2, progress);
    expect(recommendations.map((item) => item.subject)).toEqual(["math", "science"]);
    expect(recommendations.every((item) => item.path && item.page === 1)).toBe(true);
    expect(getLessonGuide(recommendations[0].lesson, "math", 2).slides).toHaveLength(4);
  });
});

describe("Read-aloud", () => {
  it("strips emoji so a prompt is intelligible when spoken", () => {
    expect(toSpokenText("🚀 Which group has one star? ⭐")).toBe("Which group has one star?");
    expect(toSpokenText("🍎🍎🍎")).toBe("");
  });

  it("speaks maths notation as words rather than symbols", () => {
    expect(toSpokenText("6×4")).toBe("6 times 4");
    expect(toSpokenText("20÷4")).toBe("20 divided by 4");
    expect(toSpokenText("75%")).toBe("75 percent");
    expect(toSpokenText("A rover travels 40 km")).toContain("kilometres");
  });

  it("joins fragments with pauses and drops empty ones", () => {
    expect(joinForSpeech("Counting to 20", "", undefined, "What comes after 16?"))
      .toBe("Counting to 20. What comes after 16?");
  });

  it("reads to the youngest children automatically and leaves older ones in control", () => {
    const settings = { enabled: true, rate: 0.85, autoRead: "young" as const };
    expect(shouldAutoRead(settings, 0)).toBe(true);
    expect(shouldAutoRead(settings, 1)).toBe(true);
    expect(shouldAutoRead(settings, 2)).toBe(false);
    expect(shouldAutoRead({ ...settings, autoRead: "always" }, 3)).toBe(true);
    expect(shouldAutoRead({ ...settings, enabled: false }, 0)).toBe(false);
  });

  it("slows the voice down for younger age worlds", () => {
    const settings = { enabled: true, rate: 0.85, autoRead: "young" as const };
    expect(rateForAge(settings, 0)).toBeLessThan(rateForAge(settings, 3));
    expect(rateForAge({ ...settings, rate: 1.2 }, 3)).toBeLessThanOrEqual(1.2);
    expect(rateForAge({ ...settings, rate: 0.5 }, 0)).toBeGreaterThanOrEqual(0.5);
  });

  it("degrades to silence rather than throwing where speech is unavailable", () => {
    expect(isSpeechSupported()).toBe(false);
    expect(() => stopSpeaking()).not.toThrow();
    expect(speak("hello")).toBe(false);
  });
});

describe("Honest content counts", () => {
  it("counts only genuinely distinct puzzles, not generated ids", () => {
    for (const age of [0, 1, 2, 3]) {
      const deck = getPuzzleDeck(age);
      const signatures = new Set(deck.map((puzzle) => JSON.stringify(
        puzzle.kind === "match" ? puzzle.pairs.map((pair) => pair.label).sort()
          : puzzle.kind === "sort" ? [puzzle.title, puzzle.items.map((item) => item.id).sort()]
            : puzzle.kind === "sequence" ? puzzle.title
              : [puzzle.prompt, puzzle.answer],
      )));
      expect(signatures.size).toBe(deck.length);
      expect(deck.length).toBeGreaterThan(0);
      expect(deck.length).toBeLessThan(400);
    }
  });

  it("never shows the same puzzle twice in a row across a full pass", () => {
    for (const age of [0, 1, 2, 3]) {
      const total = countPuzzles(age);
      for (let page = 1; page < total; page += 1) {
        expect(getPuzzle(page, age).id).not.toBe(getPuzzle(page + 1, age).id);
      }
    }
  });

  it("reports counts a parent can verify by paging to the end", () => {
    expect(activityCount("color", 0)).toBe(COLORING_SCENE_COUNT);
    expect(activityCount("color", 3)).toBe(COLORING_SCENE_COUNT);
    expect(activityCount("math", 1)).toBe(getLearningLessons("math", 1).length);
    expect(activityCount("lab", 2)).toBe(getScienceLabs(2).length);
    expect(activityCount("discover", 3)).toBe(DISCOVERY_COUNTS.missions);
    for (const age of [0, 1, 2, 3]) {
      expect(activityCount("puzzle", age)).toBe(countPuzzles(age));
      expect(activityCount("puzzle", age)).toBeLessThan(400);
    }
  });
});

describe("Grown-up gate", () => {
  it("asks something beyond the oldest maths trail, and varies it", () => {
    const answers = new Set<number>();
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const challenge = makeGateChallenge();
      expect(challenge.left * challenge.right).toBe(challenge.answer);
      expect(challenge.answer).toBeGreaterThan(20);
      answers.add(challenge.answer);
    }
    // The old gate was a single constant ("4 + 3"); this must not be guessable.
    expect(answers.size).toBeGreaterThan(10);
  });
});

describe("Discovery Lab safety", () => {
  it("makes no network request for mission imagery", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const age of [2, 3]) {
      for (let page = 1; page <= 25; page += 1) {
        const mission = buildDiscoveryMission(page, age);
        render(<DiscoveryArt topic={mission.topic} />);
        cleanup();
      }
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("draws every topic locally until a curated image is approved for it", () => {
    for (let page = 1; page <= DISCOVERY_COUNTS.missions; page += 1) {
      const mission = buildDiscoveryMission(page, 3);
      expect(sceneFor(mission.topic)).toBeTruthy();
      expect(artCredit(mission.topic)).toContain("drawn on this device");
    }
  });
});

describe("Drawing drafts", () => {
  it("scopes a draft to one child, activity, age world and page", () => {
    expect(draftKey("child-a", "draw", 1, 4)).toBe("child-a:draw:1:4");
    expect(draftKey("child-a", "draw", 1, 4)).not.toBe(draftKey("child-b", "draw", 1, 4));
    expect(draftKey("child-a", "draw", 1, 4)).not.toBe(draftKey("child-a", "draw", 2, 4));
    expect(draftKey("child-a", "draw", 1, 4)).not.toBe(draftKey("child-a", "draw", 1, 5));
  });

  it("survives storage being unavailable instead of breaking the canvas", async () => {
    await expect(saveDraft({ id: "x", ink: "data:,", shapes: [], background: "paper" })).resolves.toBeUndefined();
    await expect(loadDraft("does-not-exist")).resolves.toBeNull();
  });
});
