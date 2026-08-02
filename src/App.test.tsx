import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import ColorQuestApp from "./App";
import { buildDiscoveryMission, DISCOVERY_COUNTS } from "./discovery-data";
import { getLearningLesson, getLearningLessons, LEARNING_COUNTS } from "./learning-data";
import { getScienceLabs, LAB_COUNTS } from "./lab-data";
import { getFavoriteInterest, getLessonGuide, getMentorRecommendations } from "./mentor-data";
import { buildPuzzle, PUZZLE_FAMILIES } from "./puzzle-data";
import { emptyProgress, PROFILE_STORAGE_KEY, recordCompletion, recordLocation, type FamilyData } from "./profile-data";

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
  Object.values(canvasContext).forEach((value) => {
    if (typeof value === "function" && "mockClear" in value) value.mockClear();
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    canvasContext as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,test");
});

describe("ColorQuest core journeys", () => {
  it("opens the drawing studio from the home page", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);

    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);

    expect(screen.getByRole("heading", { name: "Draw adventure" })).toBeTruthy();
    expect(screen.getByLabelText("Free drawing canvas")).toBeTruthy();
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
    expect(screen.getByRole("heading", { name: "Draw adventure" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Add triangle shapes" }));
    const triangleCanvas = screen.getByLabelText("Canvas ready to add triangle shapes") as HTMLCanvasElement;
    fireEvent.pointerDown(triangleCanvas, { clientX: 140, clientY: 210, pointerId: 2 });

    expect(screen.getByRole("button", { name: "Select triangle" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "↻ Rotate" }));
    expect(screen.getByRole("heading", { name: "Draw adventure" })).toBeTruthy();
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

  it("saves privately, then lets a parent use Android's native save/share sheet", async () => {
    const user = userEvent.setup();
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const writeFile = vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: "content://colorquest/picture.png" });
    const share = vi.mocked(Share.share).mockResolvedValue({ activityType: "android.intent.action.SEND" });

    render(<ColorQuestApp />);
    await user.click(screen.getAllByRole("button", { name: "Start creating" })[0]);
    await user.click(screen.getByRole("button", { name: "Save to gallery" }));
    expect(screen.getByRole("status").textContent).toContain("Saved privately");

    await user.click(screen.getByRole("button", { name: "Grown-ups" }));
    await user.type(screen.getByLabelText("Answer to four plus three"), "7");
    await user.click(screen.getByRole("button", { name: "Open parent corner" }));
    const exportButton = await screen.findByRole("button", { name: "Download / share" });
    await user.click(exportButton);

    await waitFor(() => expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: "maya-s-creation-1.png" })));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: ["content://colorquest/picture.png"] }));
  });

  it("colors a drawing and keeps the coloring activity usable", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await user.click(screen.getByRole("button", { name: /Color400 pages for every age/ }));

    const firstPart = screen.getByRole("button", { name: "Color part 1" });
    await user.click(firstPart);

    expect(firstPart.getAttribute("style")).toContain("rgb(255, 214, 90)");
    expect(screen.getByRole("heading", { name: "Color adventure" })).toBeTruthy();
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
    expect(screen.getByRole("button", { name: /Ages 7–9/ }).getAttribute("aria-pressed")).toBe("true");
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
      const imageQueries = new Set(missions.map((mission) => mission.imageQuery));
      const stories = new Set(missions.map((mission) => mission.story));

      expect(titles.size).toBe(400);
      expect(imageQueries.size).toBe(400);
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

    await user.click(screen.getByRole("button", { name: /Build puzzlesMatch, sort, sequence, reason/ }));
    expect(screen.getByText("Partner match")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Next activity" }));
    expect(screen.getByText("Sort & classify")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Next activity" }));
    expect(screen.getByText("Put in order")).toBeTruthy();
  });
});

describe("Math and science learning trails", () => {
  it("contains eight complete lessons per subject in every age world", () => {
    expect(LEARNING_COUNTS.total).toBe(64);

    for (const subject of ["math", "science"] as const) {
      for (const age of [0, 1, 2, 3]) {
        const lessons = getLearningLessons(subject, age);
        expect(lessons).toHaveLength(8);
        expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(8);
        expect(new Set(lessons.map((lesson) => lesson.title)).size).toBe(8);
        expect(lessons.every((lesson) => lesson.choices.length === 3 && lesson.choices.includes(lesson.answer))).toBe(true);
        expect(lessons.every((lesson) => lesson.bigIdea && lesson.explanation && lesson.why && lesson.activity)).toBe(true);
      }
    }
  });

  it("teaches a math idea, checks reasoning, and offers off-screen practice", async () => {
    const user = userEvent.setup();
    const lesson = getLearningLesson("math", 1, 1);
    render(<ColorQuestApp />);

    await user.click(screen.getByRole("button", { name: /MathBig ideas made visible/ }));

    expect(screen.getByRole("heading", { name: "Math adventure" })).toBeTruthy();
    expect(screen.getByText(lesson.bigIdea)).toBeTruthy();
    expect(screen.getByText("TRY IT AWAY FROM THE SCREEN")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: lesson.answer }));
    expect(screen.getByRole("status").textContent).toContain("Yes—your reasoning works!");
  });

  it("adapts science language and topics for ages 10–12", async () => {
    const user = userEvent.setup();
    const lesson = getLearningLesson("science", 3, 1);
    render(<ColorQuestApp />);

    await user.click(screen.getByRole("button", { name: /Ages 10–12/ }));
    await user.click(screen.getByRole("button", { name: /ScienceAsk, observe, explain/ }));

    expect(screen.getByRole("heading", { name: "Science adventure" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: lesson.title })).toBeTruthy();
    expect(screen.getByText(lesson.explanation)).toBeTruthy();
    expect(screen.getByText("Concept 1 of 8")).toBeTruthy();
  });

  it("adds another explanation, a concept story, and remembers a child's interest", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await user.click(screen.getByRole("button", { name: /ScienceAsk, observe, explain/ }));

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
  it("contains eight distinct, safety-labelled investigations per age world", () => {
    expect(LAB_COUNTS.total).toBe(32);
    for (const age of [0, 1, 2, 3]) {
      const labs = getScienceLabs(age);
      expect(labs).toHaveLength(8);
      expect(new Set(labs.map((lab) => lab.id)).size).toBe(8);
      expect(labs.every((lab) => ["Child can try", "Grown-up nearby", "Grown-up required"].includes(lab.safety))).toBe(true);
      expect(labs.every((lab) => lab.steps.length >= 3 && lab.explanation && lab.wonder)).toBe(true);
    }
  });

  it("requires prediction and safe steps before revealing a lab explanation", async () => {
    const user = userEvent.setup();
    render(<ColorQuestApp />);
    await user.click(screen.getByRole("button", { name: /Science LabPredict, test safely, explain/ }));
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
