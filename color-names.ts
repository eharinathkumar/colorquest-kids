/**
 * Single source of truth for the paint palette and its plain-language names.
 *
 * Both the Coloring board and the Drawing Studio previously defined this same
 * hex array independently, and labelled each swatch `aria-label="Choose #hex"`
 * — a raw hex code is meaningless to a screen-reader user and to a low-vision
 * or color-blind child scanning by name. Naming the colors here keeps the two
 * surfaces in sync and makes color choice available without relying on color.
 */

export const PAINT_COLORS = [
  "#ff604f",
  "#ffd65a",
  "#24bca4",
  "#55aaf5",
  "#7857d6",
  "#f58bbb",
  "#173b6d",
  "#ffffff",
] as const;

export type PaintColor = (typeof PAINT_COLORS)[number];

const COLOR_NAMES: Record<string, string> = {
  "#ff604f": "red",
  "#ffd65a": "yellow",
  "#24bca4": "teal green",
  "#55aaf5": "sky blue",
  "#7857d6": "purple",
  "#f58bbb": "pink",
  "#173b6d": "navy blue",
  "#ffffff": "white",
};

/** Plain-language name for a swatch, e.g. "#55aaf5" -> "sky blue". */
export function colorName(hex: string): string {
  return COLOR_NAMES[hex.toLowerCase()] ?? hex;
}
