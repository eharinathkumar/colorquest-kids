import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { deleteDraft, draftKey, loadDraft, saveDraft } from "./canvas-drafts";
import { SpeakButton, useAutoSpeak } from "./SpeechProvider";

type BrushKind = "marker" | "pencil" | "crayon" | "chalk" | "watercolor" | "rainbow" | "sparkle" | "eraser";
type StampShape = "circle" | "square" | "triangle" | "diamond" | "star" | "heart" | "moon" | "cloud";

type ShapeItem = {
  id: string;
  shape: StampShape;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
};

type CanvasHistory = { ink: string; shapes: ShapeItem[]; background: string };
type MobileToolPanel = "brush" | "paint" | "shape";

const COLORS = ["#ff604f", "#ffd65a", "#24bca4", "#55aaf5", "#7857d6", "#f58bbb", "#173b6d", "#ffffff"];
const BRUSHES: Array<{ id: BrushKind; icon: string; label: string }> = [
  { id: "marker", icon: "🖌️", label: "Paint" },
  { id: "pencil", icon: "✏️", label: "Pencil" },
  { id: "crayon", icon: "🖍️", label: "Crayon" },
  { id: "chalk", icon: "▰", label: "Chalk" },
  { id: "watercolor", icon: "💧", label: "Watercolor" },
  { id: "rainbow", icon: "🌈", label: "Rainbow" },
  { id: "sparkle", icon: "✨", label: "Stars" },
  { id: "eraser", icon: "🧽", label: "Eraser" },
];
const SHAPES: Array<{ shape: StampShape; icon: string; label: string }> = [
  { shape: "circle", icon: "●", label: "Circle" },
  { shape: "square", icon: "■", label: "Square" },
  { shape: "triangle", icon: "▲", label: "Triangle" },
  { shape: "diamond", icon: "◆", label: "Diamond" },
  { shape: "star", icon: "★", label: "Star" },
  { shape: "heart", icon: "♥", label: "Heart" },
  { shape: "moon", icon: "☾", label: "Moon" },
  { shape: "cloud", icon: "☁", label: "Cloud" },
];
const BACKGROUNDS = [
  { id: "paper", label: "Paper", style: "#fffef9", colors: ["#fffef9"] },
  { id: "sunshine", label: "Sunshine", style: "#fff1b8", colors: ["#fff1b8"] },
  { id: "mint", label: "Mint", style: "#dff8ee", colors: ["#dff8ee"] },
  { id: "ocean", label: "Ocean", style: "linear-gradient(160deg,#bcecff,#4f9fea)", colors: ["#bcecff", "#4f9fea"] },
  { id: "sunset", label: "Sunset", style: "linear-gradient(160deg,#ffd77a,#f58bbb,#7c65d8)", colors: ["#ffd77a", "#f58bbb", "#7c65d8"] },
  { id: "space", label: "Space", style: "linear-gradient(160deg,#172c55,#321a56,#090f24)", colors: ["#172c55", "#321a56", "#090f24"] },
];

const YOUNG_PROMPTS = [
  "Turn three shapes into a funny animal",
  "Draw a garden using dots and lines",
  "Make a star family in the night sky",
  "Invent a house for a tiny creature",
  "Draw music using colors",
  "Build a robot from circles and squares",
];
const OLDER_PROMPTS = [
  "Design a vehicle that travels through ocean and space",
  "Invent a landscape with its own laws of nature",
  "Create a geometric city that grows upward",
  "Draw the map of a world no one has visited",
  "Use symmetry to invent a new species",
  "Illustrate the moment an astronaut discovers life",
];

function creativePrompt(page: number, age: number) {
  const prompts = age >= 2 ? OLDER_PROMPTS : YOUNG_PROMPTS;
  return prompts[(page + age * 2) % prompts.length];
}

function starPath(x: number, y: number, radius: number) {
  return Array.from({ length: 10 }, (_, index) => {
    const pointRadius = index % 2 === 0 ? radius : radius * 0.44;
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    return `${x + Math.cos(angle) * pointRadius},${y + Math.sin(angle) * pointRadius}`;
  }).join(" ");
}

function drawStamp(ctx: CanvasRenderingContext2D, item: ShapeItem) {
  const { shape, x, y, size: radius, color, rotation } = item;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-x, -y);
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = color === "#ffffff" ? "#9aabba" : color;
  ctx.lineWidth = 3;

  if (shape === "circle") ctx.arc(x, y, radius, 0, Math.PI * 2);
  else if (shape === "square") ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
  else if (shape === "triangle") {
    ctx.moveTo(x, y - radius); ctx.lineTo(x + radius, y + radius); ctx.lineTo(x - radius, y + radius); ctx.closePath();
  } else if (shape === "diamond") {
    ctx.moveTo(x, y - radius); ctx.lineTo(x + radius, y); ctx.lineTo(x, y + radius); ctx.lineTo(x - radius, y); ctx.closePath();
  } else if (shape === "star") {
    for (let index = 0; index < 10; index += 1) {
      const pointRadius = index % 2 === 0 ? radius : radius * 0.44;
      const angle = -Math.PI / 2 + index * Math.PI / 5;
      const pointX = x + Math.cos(angle) * pointRadius;
      const pointY = y + Math.sin(angle) * pointRadius;
      if (index === 0) ctx.moveTo(pointX, pointY); else ctx.lineTo(pointX, pointY);
    }
    ctx.closePath();
  } else if (shape === "heart") {
    ctx.moveTo(x, y + radius * 0.82);
    ctx.bezierCurveTo(x - radius * 1.35, y, x - radius * 0.72, y - radius, x, y - radius * 0.3);
    ctx.bezierCurveTo(x + radius * 0.72, y - radius, x + radius * 1.35, y, x, y + radius * 0.82);
    ctx.closePath();
  } else if (shape === "moon") {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.48, y - radius * 0.12, radius * 0.82, Math.PI * 0.45, Math.PI * 1.55, true);
  } else {
    ctx.arc(x - radius * 0.42, y, radius * 0.48, Math.PI, Math.PI * 2);
    ctx.arc(x, y - radius * 0.28, radius * 0.58, Math.PI, Math.PI * 2);
    ctx.arc(x + radius * 0.48, y, radius * 0.44, Math.PI, Math.PI * 2);
    ctx.lineTo(x + radius * 0.9, y + radius * 0.45);
    ctx.lineTo(x - radius * 0.9, y + radius * 0.45);
    ctx.closePath();
  }
  ctx.fill();
  if (color === "#ffffff") ctx.stroke();
  ctx.restore();
}

function backgroundToCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, id: string) {
  const background = BACKGROUNDS.find((item) => item.id === id) || BACKGROUNDS[0];
  if (background.colors.length === 1 || typeof ctx.createLinearGradient !== "function") {
    ctx.fillStyle = background.colors[0];
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    background.colors.forEach((color, index) => gradient.addColorStop(index / (background.colors.length - 1), color));
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, width, height);
}

function ShapeGlyph({ item }: { item: ShapeItem }) {
  const s = item.size;
  if (item.shape === "circle") return <circle cx={item.x} cy={item.y} r={s} />;
  if (item.shape === "square") return <rect x={item.x - s} y={item.y - s} width={s * 2} height={s * 2} rx={s * 0.08} />;
  if (item.shape === "triangle") return <polygon points={`${item.x},${item.y - s} ${item.x + s},${item.y + s} ${item.x - s},${item.y + s}`} />;
  if (item.shape === "diamond") return <polygon points={`${item.x},${item.y - s} ${item.x + s},${item.y} ${item.x},${item.y + s} ${item.x - s},${item.y}`} />;
  if (item.shape === "star") return <polygon points={starPath(item.x, item.y, s)} />;
  if (item.shape === "heart") return <path d={`M ${item.x} ${item.y + s * .82} C ${item.x - s * 1.35} ${item.y}, ${item.x - s * .72} ${item.y - s}, ${item.x} ${item.y - s * .3} C ${item.x + s * .72} ${item.y - s}, ${item.x + s * 1.35} ${item.y}, ${item.x} ${item.y + s * .82} Z`} />;
  if (item.shape === "moon") return <path fillRule="evenodd" d={`M ${item.x} ${item.y - s} A ${s} ${s} 0 1 0 ${item.x} ${item.y + s} A ${s} ${s} 0 1 0 ${item.x} ${item.y - s} M ${item.x + s * .45} ${item.y - s * .75} A ${s * .82} ${s * .82} 0 1 1 ${item.x + s * .45} ${item.y + s * .75} A ${s * .68} ${s * .68} 0 0 0 ${item.x + s * .45} ${item.y - s * .75}`} />;
  return <path d={`M ${item.x - s * .9} ${item.y + s * .45} C ${item.x - s} ${item.y}, ${item.x - s * .55} ${item.y - s * .45}, ${item.x - s * .25} ${item.y - s * .25} C ${item.x - s * .08} ${item.y - s}, ${item.x + s * .55} ${item.y - s * .7}, ${item.x + s * .55} ${item.y - s * .15} C ${item.x + s} ${item.y - s * .1}, ${item.x + s} ${item.y + s * .45}, ${item.x + s * .72} ${item.y + s * .45} Z`} />;
}

export default function DrawingStudio({
  page,
  age,
  profileId,
  profileName,
  onComplete,
  onSaveArtwork,
  onDirtyChange,
  onRequestStartOver,
}: {
  page: number;
  age: number;
  profileId: string;
  profileName: string;
  onComplete: () => void;
  onSaveArtwork: (dataUrl: string, title: string) => Promise<void>;
  /** Lets the studio warn before navigation would discard unsaved work. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Opens the app's friendly confirmation UI instead of a browser dialog. */
  onRequestStartOver?: (confirm: () => void) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<CanvasHistory[]>([]);
  const drawing = useRef(false);
  const previousPoint = useRef<{ x: number; y: number } | null>(null);
  const dragShape = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const completed = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(age === 0 ? 18 : 10);
  const [brush, setBrush] = useState<BrushKind>("marker");
  const [stampShape, setStampShape] = useState<StampShape | null>(null);
  const [shapeSize, setShapeSize] = useState(age === 0 ? 48 : 38);
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [background, setBackground] = useState("paper");
  const [savedMessage, setSavedMessage] = useState("");
  const [restored, setRestored] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobileToolPanel>("brush");
  const dirty = useRef(false);
  const draftTimer = useRef<number | null>(null);
  const pendingDraft = useRef<Parameters<typeof saveDraft>[0] | null>(null);
  const draftId = draftKey(profileId, "draw", age, page);
  const prompt = creativePrompt(page, age);

  useAutoSpeak(["Today's idea:", prompt, "Or draw anything you can imagine."], draftId);

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.max(320, rect.width || 800);
    const displayHeight = Math.max(440, rect.height || 560);
    canvas.width = Math.round(displayWidth * ratio);
    canvas.height = Math.round(displayHeight * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const markDirty = useCallback((value: boolean) => {
    if (dirty.current === value) return;
    dirty.current = value;
    onDirtyChange?.(value);
  }, [onDirtyChange]);

  const flushDraft = useCallback(() => {
    if (draftTimer.current !== null) {
      window.clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    const next = pendingDraft.current;
    pendingDraft.current = null;
    if (next) void saveDraft(next);
  }, []);

  const scheduleDraft = useCallback((next: Parameters<typeof saveDraft>[0]) => {
    pendingDraft.current = next;
    if (draftTimer.current !== null) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(flushDraft, 320);
  }, [flushDraft]);

  useEffect(() => () => flushDraft(), [flushDraft]);

  /**
   * Restore whatever this child was last drawing on this page, so leaving and
   * coming back — or being interrupted by a closed app — keeps the picture.
   */
  useEffect(() => {
    let cancelled = false;
    prepareCanvas();
    const blank = canvasRef.current?.toDataURL() || "";
    historyRef.current = [{ ink: blank, shapes: [], background: "paper" }];
    setRestored(false);

    loadDraft(draftId).then((draft) => {
      if (cancelled || !draft) return;
      setBackground(draft.background);
      setShapes((draft.shapes as ShapeItem[]).map((item) => ({ ...item })));
      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.clientWidth, canvas.clientHeight);
        historyRef.current = [{ ink: draft.ink, shapes: draft.shapes as ShapeItem[], background: draft.background }];
        setRestored(true);
        markDirty(true);
      };
      image.src = draft.ink;
    });

    return () => { cancelled = true; };
    // Re-runs when the child moves to another page, age world or profile.
  }, [draftId, markDirty]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const capture = (nextShapes = shapes, nextBackground = background) => {
    const ink = canvasRef.current?.toDataURL() || "";
    historyRef.current = [...historyRef.current.slice(-15), { ink, shapes: nextShapes.map((item) => ({ ...item })), background: nextBackground }];
    markDirty(true);
    scheduleDraft({ id: draftId, ink, shapes: nextShapes.map((item) => ({ ...item })), background: nextBackground });
  };

  const placeShape = (x: number, y: number) => {
    if (!stampShape) return;
    const item: ShapeItem = {
      id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      shape: stampShape,
      x,
      y,
      size: shapeSize,
      color,
      rotation: 0,
    };
    const next = [...shapes, item];
    setShapes(next);
    setSelectedShapeId(item.id);
    capture(next);
  };

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const p = point(event);
    if (stampShape) {
      placeShape(p.x, p.y);
      return;
    }
    drawing.current = true;
    previousPoint.current = p;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const drawSegment = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
    ctx.save();
    ctx.lineCap = brush === "chalk" ? "butt" : "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = brush === "eraser" ? "destination-out" : "source-over";
    ctx.globalAlpha = brush === "watercolor" ? 0.22 : brush === "chalk" ? 0.65 : 1;
    ctx.lineWidth = brush === "pencil" ? Math.max(2, size * 0.35) : brush === "watercolor" ? size * 1.9 : size;
    ctx.strokeStyle = color;
    if (brush === "rainbow" && typeof ctx.createLinearGradient === "function") {
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x + 1, to.y + 1);
      ["#ff604f", "#ffd65a", "#24bca4", "#55aaf5", "#7857d6"].forEach((item, index) => gradient.addColorStop(index / 4, item));
      ctx.strokeStyle = gradient;
    }
    if (brush === "chalk") ctx.setLineDash([Math.max(2, size * .32), Math.max(1, size * .12)]);

    const stroke = (offsetX = 0, offsetY = 0) => {
      ctx.beginPath(); ctx.moveTo(from.x + offsetX, from.y + offsetY); ctx.lineTo(to.x + offsetX, to.y + offsetY); ctx.stroke();
    };
    if (brush === "crayon") {
      ctx.globalAlpha = .52;
      stroke(); stroke(size * .12, -size * .08); stroke(-size * .1, size * .1);
    } else if (brush === "sparkle") {
      drawStamp(ctx, { id: "brush-star", shape: "star", x: to.x, y: to.y, size: Math.max(5, size * .7), color, rotation: 0 });
    } else {
      stroke();
    }
    ctx.restore();
  };

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !previousPoint.current) return;
    const ctx = event.currentTarget.getContext("2d");
    const next = point(event);
    if (!ctx) return;
    drawSegment(ctx, previousPoint.current, next);
    previousPoint.current = next;
  };

  const stop = () => {
    if (!drawing.current) return;
    drawing.current = false;
    previousPoint.current = null;
    capture();
  };

  const restoreInk = (dataUrl: string) => {
    const image = new Image();
    image.onload = () => {
      prepareCanvas();
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.clientWidth, canvas.clientHeight);
    };
    image.src = dataUrl;
  };

  const undo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const previous = historyRef.current[historyRef.current.length - 1];
    setShapes(previous.shapes.map((item) => ({ ...item })));
    setBackground(previous.background);
    setSelectedShapeId(null);
    restoreInk(previous.ink);
    markDirty(true);
    scheduleDraft({ id: draftId, ink: previous.ink, shapes: previous.shapes.map((item) => ({ ...item })), background: previous.background });
  };

  const clearForNewPage = () => {
    if (draftTimer.current !== null) window.clearTimeout(draftTimer.current);
    draftTimer.current = null;
    pendingDraft.current = null;
    prepareCanvas();
    setShapes([]);
    setSelectedShapeId(null);
    setBackground("paper");
    setRestored(false);
    const ink = canvasRef.current?.toDataURL() || "";
    historyRef.current = [{ ink, shapes: [], background: "paper" }];
    markDirty(false);
    void deleteDraft(draftId);
    setSavedMessage("Fresh canvas ready!");
  };

  const startOver = () => {
    if (dirty.current && onRequestStartOver) {
      onRequestStartOver(clearForNewPage);
      return;
    }
    clearForNewPage();
  };

  const changeBackground = (id: string) => {
    setBackground(id);
    capture(shapes, id);
  };

  const updateSelected = (change: (item: ShapeItem) => ShapeItem) => {
    if (!selectedShapeId) return;
    const next = shapes.map((item) => item.id === selectedShapeId ? change(item) : item);
    setShapes(next);
    capture(next);
  };

  const deleteSelected = () => {
    if (!selectedShapeId) return;
    const next = shapes.filter((item) => item.id !== selectedShapeId);
    setShapes(next); setSelectedShapeId(null); capture(next);
  };

  const duplicateSelected = () => {
    const selected = shapes.find((item) => item.id === selectedShapeId);
    if (!selected) return;
    const copy = { ...selected, id: `shape-${Date.now()}`, x: selected.x + 24, y: selected.y + 24 };
    const next = [...shapes, copy];
    setShapes(next); setSelectedShapeId(copy.id); capture(next);
  };

  const exportPicture = () => {
    const ink = canvasRef.current;
    if (!ink) return "";
    const output = document.createElement("canvas");
    output.width = ink.width;
    output.height = ink.height;
    const ctx = output.getContext("2d");
    if (!ctx) return ink.toDataURL("image/png");
    backgroundToCanvas(ctx, output.width, output.height, background);
    ctx.drawImage(ink, 0, 0);
    const ratioX = output.width / Math.max(1, ink.clientWidth);
    const ratioY = output.height / Math.max(1, ink.clientHeight);
    ctx.save(); ctx.scale(ratioX, ratioY); shapes.forEach((item) => drawStamp(ctx, item)); ctx.restore();
    return output.toDataURL("image/png");
  };

  const save = async () => {
    flushDraft();
    await onSaveArtwork(exportPicture(), `${profileName}'s creation ${page}`);
    // Now that it lives in the gallery, leaving the page is no longer a loss.
    markDirty(false);
    setSavedMessage("Saved privately to your artwork gallery! ⭐");
    if (!completed.current) { completed.current = true; onComplete(); }
  };

  const availableBrushes = age === 0 ? BRUSHES.filter((item) => ["marker", "crayon", "rainbow", "sparkle", "eraser"].includes(item.id)) : BRUSHES;
  const backgroundStyle = BACKGROUNDS.find((item) => item.id === background)?.style;
  const selectedShape = shapes.find((item) => item.id === selectedShapeId);

  return (
    <div className="creative-board drawing-studio-v2">
      <nav className="mobile-art-dock" aria-label="Drawing tools">
        {([
          ["brush", "🖌️", "Brushes"],
          ["paint", "🎨", "Base paint"],
          ["shape", "🔷", "Shapes"],
        ] as const).map(([panel, icon, label]) => (
          <button
            key={panel}
            type="button"
            className={mobilePanel === panel ? "active" : ""}
            aria-pressed={mobilePanel === panel}
            onClick={() => setMobilePanel(panel)}
          >
            <span aria-hidden="true">{icon}</span><small>{label}</small>
          </button>
        ))}
      </nav>

      <section className={`art-tool-section mobile-tool-panel ${mobilePanel === "brush" ? "mobile-active" : ""}`} aria-label="Brush studio">
        <div className="tool-section-title"><span>🖌️</span><strong>Brush studio</strong><small>Every brush makes a different kind of mark</small></div>
        <div className="brush-picker">
          {availableBrushes.map((item) => (
            <button key={item.id} className={!stampShape && brush === item.id ? "active" : ""} onClick={() => { setBrush(item.id); setStampShape(null); }} aria-label={`Use ${item.label.toLowerCase()} brush`} aria-pressed={!stampShape && brush === item.id}>
              <span>{item.icon}</span><small>{item.label}</small>
            </button>
          ))}
        </div>
        <div className="art-options-row">
          <div className="color-tools" aria-label="Paint colors">
            {COLORS.map((swatch) => <button key={swatch} aria-label={`Choose ${swatch}`} className={`swatch ${color === swatch ? "active" : ""}`} style={{ background: swatch }} onClick={() => setColor(swatch)} />)}
          </div>
          <div className="stroke-size-studio">
            <span>Stroke size</span>
            <div role="group" aria-label="Quick brush stroke sizes">
              {([['Tiny', 4], ['Small', 8], ['Big', 18], ['Giant', 32]] as const).map(([label, value]) => <button key={label} className={Math.abs(size - value) <= 2 ? "active" : ""} onClick={() => setSize(value)} aria-label={`Use ${label.toLowerCase()} brush stroke`}>{label}<i style={{ width: Math.max(4, value / 2), height: Math.max(4, value / 2) }} /></button>)}
            </div>
            <label className="size-control">Fine tune<input type="range" min="3" max="36" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label>
          </div>
          <button className="tool-button" onClick={undo}>↶ Undo</button>
          <button className="tool-button" onClick={startOver}>New page</button>
          <button className="save-button" onClick={save}>Save to gallery</button>
        </div>
      </section>

      <section className={`art-tool-section background-section mobile-tool-panel ${mobilePanel === "paint" ? "mobile-active" : ""}`} aria-label="Canvas background">
        <div className="tool-section-title"><span>🎨</span><strong>Base paint</strong><small>Fill the board first, then create on top</small></div>
        <div className="background-picker">
          {BACKGROUNDS.map((item) => <button key={item.id} className={background === item.id ? "active" : ""} onClick={() => changeBackground(item.id)} aria-pressed={background === item.id}><i style={{ background: item.style }} />{item.label}</button>)}
        </div>
      </section>

      <section className={`art-tool-section shape-studio mobile-tool-panel ${mobilePanel === "shape" ? "mobile-active" : ""}`} aria-label="Shape studio">
        <div className="tool-section-title"><span>🔷</span><strong>Shape studio</strong><small>Place, move, resize, rotate and combine</small></div>
        <div className="shape-picker">
          {SHAPES.map((item) => (
            <button key={item.shape} className={stampShape === item.shape ? "active" : ""} onClick={() => setStampShape(item.shape)} aria-label={`Add ${item.label.toLowerCase()} shapes`} aria-pressed={stampShape === item.shape}>
              <b>{item.icon}</b><small>{item.label}</small>
            </button>
          ))}
          <label>New shape size<input type="range" min="20" max="90" value={shapeSize} onChange={(event) => setShapeSize(Number(event.target.value))} /></label>
        </div>
        {selectedShape && (
          <div className="shape-edit-bar" role="group" aria-label="Edit selected shape">
            <strong>{selectedShape.shape} selected</strong>
            <button onClick={() => updateSelected((item) => ({ ...item, size: Math.max(14, item.size - 10) }))}>− Smaller</button>
            <button onClick={() => updateSelected((item) => ({ ...item, size: Math.min(130, item.size + 10) }))}>＋ Bigger</button>
            <button onClick={() => updateSelected((item) => ({ ...item, rotation: item.rotation + 15 }))}>↻ Rotate</button>
            <button onClick={duplicateSelected}>⧉ Copy</button>
            <button onClick={() => updateSelected((item) => ({ ...item, color }))}>🎨 Recolor</button>
            <button onClick={deleteSelected}>🗑 Remove</button>
          </div>
        )}
      </section>

      <div className="canvas-stage advanced" style={{ background: backgroundStyle }}>
        <div className="prompt-card">
          <span>✨ Creative spark</span>
          <strong>{prompt}</strong>
          <small>Use it, remix it, or invent your own idea.</small>
          <SpeakButton id={`draw-prompt-${age}-${page}`} label="Hear the idea" text={[prompt, "Use it, remix it, or invent your own idea."]} />
        </div>
        <canvas
          ref={canvasRef}
          className="draw-canvas"
          aria-label={stampShape ? `Canvas ready to add ${stampShape} shapes` : "Free drawing canvas"}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
        />
        <svg
          className="shape-layer"
          aria-label="Editable shapes"
          onPointerMove={(event) => {
            if (!dragShape.current) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left - dragShape.current.offsetX;
            const y = event.clientY - rect.top - dragShape.current.offsetY;
            setShapes((items) => items.map((item) => item.id === dragShape.current?.id ? { ...item, x, y } : item));
          }}
          onPointerUp={() => { if (dragShape.current) capture(shapes); dragShape.current = null; }}
          onPointerCancel={() => { dragShape.current = null; }}
        >
          {shapes.map((item) => (
            <g
              key={item.id}
              className={item.id === selectedShapeId ? "selected" : ""}
              fill={item.color}
              stroke={item.color === "#ffffff" ? "#9aabba" : item.color}
              strokeWidth="2"
              transform={`rotate(${item.rotation} ${item.x} ${item.y})`}
              role="button"
              tabIndex={0}
              aria-label={`Select ${item.shape}`}
              onPointerDown={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
                setSelectedShapeId(item.id);
                dragShape.current = { id: item.id, offsetX: event.clientX - rect.left - item.x, offsetY: event.clientY - rect.top - item.y };
                event.currentTarget.ownerSVGElement?.setPointerCapture?.(event.pointerId);
              }}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedShapeId(item.id); }}
            >
              <ShapeGlyph item={item} />
              {item.id === selectedShapeId && <circle className="selection-ring" cx={item.x} cy={item.y} r={item.size + 9} />}
            </g>
          ))}
        </svg>
      </div>
      <p className="canvas-tip">{stampShape ? "Tap to place a shape. Tap it again to move or edit it." : "Draw with a finger, mouse, or stylus. Your base paint stays underneath."}</p>
      {restored && <p className="draft-restored" role="status">↩︎ Your picture from last time is back. Keep going, or tap <strong>New page</strong> to start fresh.</p>}
      {savedMessage && <div className="success-toast" role="status">{savedMessage}</div>}
    </div>
  );
}
