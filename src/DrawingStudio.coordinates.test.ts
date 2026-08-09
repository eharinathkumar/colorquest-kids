import { describe, expect, it } from "vitest";
import { mapClientPointToCanvas } from "./DrawingStudio";

describe("drawing canvas pointer coordinates", () => {
  it("keeps the brush directly under the finger on an unscaled canvas", () => {
    expect(mapClientPointToCanvas(170, 260, { left: 20, top: 60, width: 600, height: 800 }, 600, 800))
      .toEqual({ x: 150, y: 200 });
  });

  it("maps a tablet canvas resized by responsive layout into logical coordinates", () => {
    expect(mapClientPointToCanvas(420, 650, { left: 20, top: 50, width: 400, height: 600 }, 800, 1200))
      .toEqual({ x: 800, y: 1200 });
  });

  it("uses logical dimensions when a test or hidden canvas has no rendered size", () => {
    expect(mapClientPointToCanvas(130, 190, { left: 30, top: 40, width: 0, height: 0 }, 800, 560))
      .toEqual({ x: 100, y: 150 });
  });
});
