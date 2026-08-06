import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value: () => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 360,
    bottom: 480,
    width: 360,
    height: 480,
    toJSON: () => ({}),
  }),
});
