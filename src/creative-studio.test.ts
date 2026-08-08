import { describe, expect, it, vi } from "vitest";
import { ART_PAINTS, GRADIENT_PAINTS, SOLID_PAINTS, canvasPaint, paintCss } from "./art-palette";
import { COLORING_SCENES } from "./ColoringStudio";
import { COLORING_SCENE_COUNT } from "./content-counts";
import { loadDraft, loadRecentDrafts, saveDraft } from "./canvas-drafts";

describe("Creative Studio content", () => {
  it("ships 27 genuinely distinct coloring scenes", () => {
    expect(COLORING_SCENES).toHaveLength(COLORING_SCENE_COUNT);
    expect(new Set(COLORING_SCENES.map((scene) => scene.id)).size).toBe(COLORING_SCENE_COUNT);
    expect(new Set(COLORING_SCENES.map((scene) => scene.title)).size).toBe(COLORING_SCENE_COUNT);
    expect(COLORING_SCENES.every((scene) => scene.parts.length >= 7)).toBe(true);
  });

  it("includes recognizable animal, nature, fantasy, vehicle, and space subjects", () => {
    const catalog = COLORING_SCENES.map((scene) => `${scene.id} ${scene.aria}`).join(" ");
    for (const subject of ["lion", "elephant", "red panda", "turtle", "penguin", "tulip", "mountain", "astronaut", "dragon", "train"]) {
      expect(catalog).toContain(subject);
    }
  });

  it("offers a broad solid palette and eight named gradients", () => {
    expect(SOLID_PAINTS.length).toBeGreaterThanOrEqual(18);
    expect(GRADIENT_PAINTS).toHaveLength(8);
    expect(ART_PAINTS).toHaveLength(SOLID_PAINTS.length + GRADIENT_PAINTS.length);
    expect(paintCss("sunset-glow")).toContain("linear-gradient");
  });

  it("creates real canvas gradients instead of pretending with a single color", () => {
    const addColorStop = vi.fn();
    const gradient = { addColorStop } as unknown as CanvasGradient;
    const context = { createLinearGradient: vi.fn(() => gradient) } as unknown as CanvasRenderingContext2D;
    expect(canvasPaint(context, "ocean-wave", 0, 0, 100, 100)).toBe(gradient);
    expect(addColorStop).toHaveBeenCalledTimes(3);
  });

  it("keeps only the four most recent working canvases for one child", async () => {
    window.localStorage.clear();
    for (let page = 1; page <= 5; page += 1) {
      await saveDraft({ id: `recent-child:draw:1:${page}`, ink: `data:,${page}`, shapes: [], background: "paper" });
    }
    expect(await loadRecentDrafts("recent-child")).toHaveLength(4);
    expect(await loadDraft("recent-child:draw:1:1")).toBeNull();
    expect((await loadDraft("recent-child:draw:1:5"))?.ink).toBe("data:,5");
  });
});
