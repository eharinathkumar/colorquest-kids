export type ArtPaint = {
  id: string;
  label: string;
  colors: string[];
};

export const SOLID_PAINTS: ArtPaint[] = [
  { id: "coral", label: "Coral red", colors: ["#ff604f"] },
  { id: "orange", label: "Tangerine", colors: ["#ff963d"] },
  { id: "sun", label: "Sunshine", colors: ["#ffd65a"] },
  { id: "lime", label: "Lime", colors: ["#9bd64a"] },
  { id: "leaf", label: "Leaf green", colors: ["#39a866"] },
  { id: "mint", label: "Mint", colors: ["#24bca4"] },
  { id: "aqua", label: "Aqua", colors: ["#33c9dc"] },
  { id: "sky", label: "Sky blue", colors: ["#55aaf5"] },
  { id: "ocean", label: "Ocean blue", colors: ["#2978d1"] },
  { id: "navy", label: "Midnight blue", colors: ["#173b6d"] },
  { id: "grape", label: "Grape", colors: ["#7857d6"] },
  { id: "violet", label: "Violet", colors: ["#a95dde"] },
  { id: "pink", label: "Bubblegum pink", colors: ["#f58bbb"] },
  { id: "rose", label: "Rose", colors: ["#df477b"] },
  { id: "cocoa", label: "Cocoa brown", colors: ["#8b5a3c"] },
  { id: "sand", label: "Sandy tan", colors: ["#d9aa68"] },
  { id: "charcoal", label: "Charcoal", colors: ["#33445a"] },
  { id: "snow", label: "Snow white", colors: ["#ffffff"] },
];

export const GRADIENT_PAINTS: ArtPaint[] = [
  { id: "sunset-glow", label: "Sunset glow", colors: ["#ffd65a", "#ff7c63", "#b05bd7"] },
  { id: "ocean-wave", label: "Ocean wave", colors: ["#63e1d1", "#3e9cea", "#3151aa"] },
  { id: "rainbow", label: "Rainbow", colors: ["#ff604f", "#ffd65a", "#39bd79", "#55aaf5", "#8b5bd8"] },
  { id: "berry", label: "Berry swirl", colors: ["#ff91c1", "#c75de0", "#6a57c8"] },
  { id: "forest", label: "Forest light", colors: ["#d9ef6f", "#43bd78", "#167464"] },
  { id: "fire", label: "Dragon fire", colors: ["#fff068", "#ff963d", "#ef3f52"] },
  { id: "galaxy", label: "Galaxy", colors: ["#273b87", "#7a4fc7", "#e36eaf"] },
  { id: "ice", label: "Icy sparkle", colors: ["#f4ffff", "#8ce2f2", "#6f9ee8"] },
];

export const ART_PAINTS = [...SOLID_PAINTS, ...GRADIENT_PAINTS];
export const DEFAULT_PAINT = SOLID_PAINTS[0].id;

export function getArtPaint(idOrLegacyColor: string): ArtPaint {
  const found = ART_PAINTS.find((paint) => paint.id === idOrLegacyColor);
  if (found) return found;
  if (idOrLegacyColor.startsWith("#")) {
    return { id: idOrLegacyColor, label: "Saved color", colors: [idOrLegacyColor] };
  }
  return SOLID_PAINTS[0];
}

export function paintCss(idOrLegacyColor: string) {
  const paint = getArtPaint(idOrLegacyColor);
  return paint.colors.length === 1
    ? paint.colors[0]
    : `linear-gradient(135deg, ${paint.colors.join(", ")})`;
}

export function canvasPaint(
  context: CanvasRenderingContext2D,
  idOrLegacyColor: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const paint = getArtPaint(idOrLegacyColor);
  if (paint.colors.length === 1 || typeof context.createLinearGradient !== "function") return paint.colors[0];
  const gradient = context.createLinearGradient(fromX, fromY, toX || fromX + 1, toY || fromY + 1);
  paint.colors.forEach((color, index) => gradient.addColorStop(index / (paint.colors.length - 1), color));
  return gradient;
}

export function safeSvgId(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "-");
}
