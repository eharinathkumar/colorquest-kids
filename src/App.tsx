"use client";
/* eslint-disable @next/next/no-img-element */

import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { buildDiscoveryMission, DISCOVERY_COUNTS } from "./discovery-data";
import LearningBoard from "./LearningBoard";
import VariedPuzzleBoard from "./PuzzleBoard";
import { getLearningLessons, type Subject } from "./learning-data";

type Activity = "draw" | "color" | "puzzle" | "math" | "science" | "discover";

const AGE_GROUPS = [
  {
    label: "Ages 1–3",
    short: "1–3",
    icon: "🧸",
    color: "mint",
    copy: "Explore colors, shapes, and first words.",
    skill: "Big shapes · simple choices",
  },
  {
    label: "Ages 4–6",
    short: "4–6",
    icon: "🦁",
    color: "sun",
    copy: "Practice letters, numbers, and creativity.",
    skill: "Letters · counting · patterns",
  },
  {
    label: "Ages 7–9",
    short: "7–9",
    icon: "🚀",
    color: "sky",
    copy: "Explore Earth, space, science, and visual stories.",
    skill: "Earth · space · science stories",
  },
  {
    label: "Ages 10–12",
    short: "10–12",
    icon: "🔬",
    color: "lilac",
    copy: "Think like an artist, astronaut, and mathematician.",
    skill: "Design · astronomy · geography · math",
  },
];

const ACTIVITY_META: Record<Activity, { icon: string; title: string; copy: string }> = {
  draw: { icon: "✏️", title: "Draw", copy: "A blank canvas for every idea" },
  color: { icon: "🎨", title: "Color", copy: "400 pages for every age" },
  puzzle: { icon: "🧩", title: "Build puzzles", copy: "Match, sort, sequence, reason" },
  math: { icon: "🧮", title: "Math", copy: "Big ideas made visible" },
  science: { icon: "🧪", title: "Science", copy: "Ask, observe, explain" },
  discover: { icon: "🔭", title: "Discovery Lab", copy: "Real places, space, stories & math" },
};

const COLORS = ["#ff604f", "#ffd65a", "#24bca4", "#55aaf5", "#7857d6", "#f58bbb", "#173b6d", "#ffffff"];
const PROMPT_NOUNS = ["kind robot", "dream treehouse", "underwater city", "space garden", "friendly dragon", "future vehicle", "tiny world", "weather machine"];
const PROMPT_ACTIONS = ["invent", "imagine", "design", "draw", "remix", "discover"];
const FACTS = [
  "Elephants use their trunks to smell, drink, and say hello.",
  "A rainbow is sunlight separated into many colors.",
  "Octopuses have three hearts.",
  "Some seeds can wait years before they begin to grow.",
  "The Moon has mountains, valleys, and many craters.",
  "Bees share directions with a tiny waggle dance.",
  "Dinosaurs lived on every continent, including Antarctica.",
  "Mixing blue and yellow paint makes green.",
];

const OLDER_FACTS = [
  "Earth has seven continents, and every one has deserts—even Antarctica.",
  "A canyon is a deep valley often carved slowly by moving water.",
  "Our solar system has eight planets orbiting one star: the Sun.",
  "A light-year measures distance, not time: it is how far light travels in one year.",
  "The shapes of coastlines change through erosion, waves, and moving tectonic plates.",
  "The repeating spirals in sunflowers are connected to a number pattern called the Fibonacci sequence.",
  "Mars has the largest known volcano in the solar system: Olympus Mons.",
  "A map projection turns a round Earth into a flat picture, so every world map stretches something.",
  "Galaxies are enormous groups of stars, planets, gas, and dust held together by gravity.",
  "Glaciers are rivers of ice that move slowly and reshape entire landscapes.",
];

const OLDER_DRAW_PROMPTS = [
  "Draw the final page of an astronaut’s travel journal from an unknown moon",
  "Invent a landscape where mountains float and rivers climb uphill",
  "Design a research station that could survive in Antarctica",
  "Map an island with three climates and one unsolved mystery",
  "Illustrate a city built inside a canyon without harming the canyon",
  "Imagine the first garden grown on Mars",
  "Draw Earth as seen by a tiny robot traveling beyond Neptune",
  "Design an animal perfectly adapted to a desert that rains once a year",
  "Create a new constellation and tell the story behind its shape",
  "Draw a vehicle that can travel through ocean, desert, and space",
  "Turn a mathematical spiral into a living landscape",
  "Illustrate a message you would send to another civilization",
];

function promptFor(page: number, age: number) {
  if (age >= 2) return OLDER_DRAW_PROMPTS[(page * 5 + age) % OLDER_DRAW_PROMPTS.length];
  const verb = PROMPT_ACTIONS[(page + age) % PROMPT_ACTIONS.length];
  const noun = PROMPT_NOUNS[(page * 3 + age) % PROMPT_NOUNS.length];
  return `${verb[0].toUpperCase()}${verb.slice(1)} a ${noun}`;
}

function AppHeader({
  compact = false,
  onHome,
  onStart,
  onParents,
}: {
  compact?: boolean;
  onHome: () => void;
  onStart: () => void;
  onParents: () => void;
}) {
  return (
    <header className={`topbar ${compact ? "compact" : ""}`}>
      <button className="brand" onClick={onHome} aria-label="ColorQuest Kids home">
        <span className="brand-mark">🌈</span>
        <span>ColorQuest <em>Kids</em></span>
      </button>
      <nav aria-label="Main navigation">
        <button className="nav-link" onClick={onHome}>Explore</button>
        <button className="nav-link" onClick={onParents}>Grown-ups</button>
        <button className="grownups" onClick={onParents}>👥 Parent corner</button>
        <button className="nav-cta" onClick={onStart}>Start creating</button>
      </nav>
    </header>
  );
}

function Home({
  age,
  progress,
  onAge,
  onStart,
  onParents,
}: {
  age: number;
  progress: number;
  onAge: (age: number) => void;
  onStart: (activity?: Activity) => void;
  onParents: () => void;
}) {
  return (
    <main>
      <AppHeader onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} onStart={() => onStart()} onParents={onParents} />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A free creative playground for ages 1–12</p>
          <h1>Create.<br />Color. Learn.</h1>
          <p className="hero-text">
            Draw, color, build puzzles, and learn through play in a world made
            for curious kids.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onStart()}>Start creating</button>
            <a className="text-link" href="#activities">See activities ↓</a>
          </div>
          <p className="trust-line">✓ No ads&nbsp;&nbsp; ✓ No sign-up&nbsp;&nbsp; ✓ Kid-safe</p>
        </div>

        <div className="hero-art">
          <img
            src={`${import.meta.env.BASE_URL}hero-production.png`}
            alt="Friendly pencil and paintbrush characters beside an elephant coloring page, rainbow, palette, and puzzle pieces"
          />
        </div>
      </section>

      <section className="age-section" id="explore">
        <div className="section-kicker">Pick your age adventure</div>
        <div className="age-grid">
          {AGE_GROUPS.map((group, index) => (
            <button
              className={`age-card ${group.color} ${age === index ? "selected" : ""}`}
              key={group.label}
              onClick={() => onAge(index)}
              aria-pressed={age === index}
            >
              <span className="age-icon">{group.icon}</span>
              <span className="age-content">
                <strong>{group.label}</strong>
                <small>{group.copy}</small>
              </span>
              <span className="round-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="activity-section" id="activities">
        <div className="activity-grid">
          {(Object.keys(ACTIVITY_META) as Activity[]).map((key) => (
            <button className="activity-card" key={key} onClick={() => onStart(key)}>
              <span className="activity-icon">{ACTIVITY_META[key].icon}</span>
              <span>
                <strong>{ACTIVITY_META[key].title}</strong>
                <small>{ACTIVITY_META[key].copy}</small>
              </span>
              <span className="activity-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="learning-strip">
        <div><span>4</span><small>age-adapted worlds</small></div>
        <div><span>6</span><small>ways to create and learn</small></div>
        <div><span>64</span><small>guided math & science concepts</small></div>
        <div><span>{progress}</span><small>activities completed here</small></div>
        <p>Every activity quietly builds fine-motor skills, focus, vocabulary, creativity, or problem-solving.</p>
      </section>

      <section className="why-section">
        <div>
          <p className="eyebrow">Learning hidden inside play</p>
          <h2>Little hands. Big ideas.</h2>
        </div>
        <div className="why-grid">
          <article><span>🖐️</span><h3>Motor skills</h3><p>Tracing, tapping, and drawing build hand control.</p></article>
          <article><span>💡</span><h3>Creative thinking</h3><p>Open-ended prompts make room for original ideas.</p></article>
          <article><span>🌎</span><h3>Curious minds</h3><p>Every page includes a small nature, word, or science discovery.</p></article>
          <article><span>🛡️</span><h3>Calm and safe</h3><p>No ads, chat, public profiles, or pressure to keep playing.</p></article>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">🌈</span><span>ColorQuest <em>Kids</em></span></div>
        <p>Made for curious kids and the grown-ups who cheer them on.</p>
        <button onClick={onParents}>Parent corner</button>
      </footer>
    </main>
  );
}

type StampShape = "circle" | "square" | "triangle" | "diamond" | "star" | "heart";

const STAMP_SHAPES: Array<{ shape: StampShape; icon: string; label: string }> = [
  { shape: "circle", icon: "●", label: "Circle" },
  { shape: "square", icon: "■", label: "Square" },
  { shape: "triangle", icon: "▲", label: "Triangle" },
  { shape: "diamond", icon: "◆", label: "Diamond" },
  { shape: "star", icon: "★", label: "Star" },
  { shape: "heart", icon: "♥", label: "Heart" },
];

function drawStamp(
  ctx: CanvasRenderingContext2D,
  shape: StampShape,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = color === "#ffffff" ? "#9aabba" : color;
  ctx.lineWidth = 3;

  if (shape === "circle") {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  } else if (shape === "square") {
    ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
  } else if (shape === "triangle") {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius, y + radius);
    ctx.lineTo(x - radius, y + radius);
    ctx.closePath();
  } else if (shape === "diamond") {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius, y);
    ctx.closePath();
  } else if (shape === "star") {
    for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
      const pointRadius = pointIndex % 2 === 0 ? radius : radius * 0.44;
      const angle = -Math.PI / 2 + pointIndex * Math.PI / 5;
      const pointX = x + Math.cos(angle) * pointRadius;
      const pointY = y + Math.sin(angle) * pointRadius;
      if (pointIndex === 0) ctx.moveTo(pointX, pointY);
      else ctx.lineTo(pointX, pointY);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(x, y + radius * 0.82);
    ctx.bezierCurveTo(x - radius * 1.35, y, x - radius * 0.72, y - radius, x, y - radius * 0.3);
    ctx.bezierCurveTo(x + radius * 0.72, y - radius, x + radius * 1.35, y, x, y + radius * 0.82);
    ctx.closePath();
  }

  ctx.fill();
  if (color === "#ffffff") ctx.stroke();
  ctx.restore();
}

function DrawingBoard({ page, age, onComplete }: { page: number; age: number; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(age === 0 ? 18 : 9);
  const [history, setHistory] = useState<string[]>([]);
  const [stampShape, setStampShape] = useState<StampShape | null>(null);

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(600, rect.width * ratio);
    canvas.height = 520 * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#fffef9";
    ctx.fillRect(0, 0, rect.width, 520);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(prepareCanvas, []);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    if (!ctx) return;
    if (stampShape) {
      drawStamp(ctx, stampShape, p.x, p.y, Math.max(24, size * 2.5), color);
      const snapshot = event.currentTarget.toDataURL();
      setHistory((items) => [...items.slice(-7), snapshot]);
      return;
    }
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stop = () => {
    if (!drawing.current || !canvasRef.current) return;
    drawing.current = false;
    setHistory((items) => [...items.slice(-7), canvasRef.current!.toDataURL()]);
  };

  const clear = () => {
    prepareCanvas();
    setHistory([]);
  };

  const undo = () => {
    if (history.length < 2 || !canvasRef.current) {
      clear();
      return;
    }
    const next = history.slice(0, -1);
    const image = new Image();
    image.onload = () => {
      prepareCanvas();
      canvasRef.current?.getContext("2d")?.drawImage(image, 0, 0, canvasRef.current.clientWidth, 520);
    };
    image.src = next[next.length - 1];
    setHistory(next);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const filename = `colorquest-${page}.png`;
    const picture = canvas.toDataURL("image/png");

    if (Capacitor.isNativePlatform()) {
      const saved = await Filesystem.writeFile({
        path: filename,
        data: picture.split(",")[1],
        directory: Directory.Cache,
      });
      await Share.share({
        title: "My ColorQuest picture",
        text: "I made this in ColorQuest Kids!",
        files: [saved.uri],
        dialogTitle: "Save or share your picture",
      });
      onComplete();
      return;
    }

    const link = document.createElement("a");
    link.download = filename;
    link.href = picture;
    link.click();
    onComplete();
  };

  return (
    <div className="creative-board">
      <div className="tool-row" aria-label="Drawing tools">
        <div className="color-tools">
          {COLORS.map((swatch) => (
            <button
              key={swatch}
              aria-label={`Use ${swatch === "#ffffff" ? "eraser" : swatch}`}
              className={`swatch ${color === swatch ? "active" : ""}`}
              style={{ background: swatch }}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>
        <label className="size-control">
          Brush
          <input type="range" min="3" max="30" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <button className="tool-button" onClick={undo}>↶ Undo</button>
        <button className="tool-button" onClick={clear}>Clear</button>
        <button className="save-button" onClick={save}>Save picture</button>
      </div>
      <div className="shape-tray" aria-label="Shape tools">
        <span>Build with shapes</span>
        <button className={stampShape === null ? "active" : ""} onClick={() => setStampShape(null)} aria-pressed={stampShape === null}>
          <b>✏️</b><small>Draw</small>
        </button>
        {STAMP_SHAPES.map((item) => (
          <button
            key={item.shape}
            className={stampShape === item.shape ? "active" : ""}
            onClick={() => setStampShape(item.shape)}
            aria-label={`Add ${item.label.toLowerCase()} shapes`}
            aria-pressed={stampShape === item.shape}
          >
            <b>{item.icon}</b><small>{item.label}</small>
          </button>
        ))}
        <em>{stampShape ? "Tap the canvas to place it. Brush size changes its size." : "Draw freely—or choose a shape, then tap the canvas."}</em>
      </div>
      <div className="canvas-stage">
        <div className="prompt-card"><span>✨ Today&apos;s idea</span><strong>{promptFor(page, age)}</strong><small>Or draw anything you can imagine!</small></div>
        <canvas
          ref={canvasRef}
          className="draw-canvas"
          aria-label={stampShape ? `Canvas ready to add ${stampShape} shapes` : "Free drawing canvas"}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
        />
      </div>
    </div>
  );
}

function PaintPart({
  id,
  fill,
  color,
  onPaint,
  children,
}: {
  id: number;
  fill?: string;
  color: string;
  onPaint: (id: number, color: string) => void;
  children: ReactNode;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Color part ${id + 1}`}
      onClick={() => onPaint(id, color)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onPaint(id, color);
      }}
      style={{ cursor: "pointer", color: fill || "#fffef9" }}
    >
      {children}
    </g>
  );
}

function ColoringScene({
  page,
  selectedColor,
  fills,
  onPaint,
}: {
  page: number;
  selectedColor: string;
  fills: Record<number, string>;
  onPaint: (id: number, color: string) => void;
}) {
  const scene = page % 10;
  const common = { stroke: "#173b6d", strokeWidth: 7, vectorEffect: "non-scaling-stroke" as const };
  if (scene === 0) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color a rocket in space">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="640" cy="105" r="62" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M350 80 C470 150 500 315 380 404 C260 315 230 150 350 80Z" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="365" cy="210" r="53" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M275 275 L175 370 L300 352Z" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M452 275 L555 370 L430 352Z" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M325 395 L365 475 L405 395Z" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M110 95 L126 132 L168 136 L136 162 L146 205 L110 182 L73 205 L84 163 L52 136 L95 132Z" /></PaintPart>
      </svg>
    );
  }
  if (scene === 1) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color a happy garden">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="104" cy="95" r="57" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M85 420 Q120 300 185 255 Q220 365 190 440Z" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="300" cy="210" r="58" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="300" cy="120" r="55" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="390" cy="210" r="55" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="300" cy="300" r="55" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="210" cy="210" r="55" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="300" cy="210" r="38" /></PaintPart>
        <PaintPart id={8} fill={fills[8]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M260 360 L345 360 L380 480 L225 480Z" /></PaintPart>
      </svg>
    );
  }
  if (scene === 2) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color an underwater scene">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="365" cy="250" rx="175" ry="105" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M190 250 L58 145 L58 355Z" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M340 150 Q420 40 480 175Z" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M345 350 Q430 455 490 324Z" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="448" cy="220" r="24" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="600" cy="118" r="34" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="655" cy="60" r="20" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M620 460 Q580 330 635 280 Q670 360 700 300 Q720 390 700 460Z" /></PaintPart>
      </svg>
    );
  }
  if (scene === 3) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color a friendly dinosaur">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="355" cy="290" rx="210" ry="125" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="550" cy="170" r="92" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M170 270 Q42 205 58 420 Q115 330 220 347Z" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><rect {...common} fill="currentColor" x="220" y="360" width="70" height="110" rx="30" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><rect {...common} fill="currentColor" x="420" y="360" width="70" height="110" rx="30" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="285" cy="275" r="34" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="390" cy="320" r="27" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="505" cy="245" r="30" /></PaintPart>
      </svg>
    );
  }
  if (scene === 4) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color a playful elephant">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M20 430 Q190 350 380 420 Q560 345 740 430 L740 500 L20 500Z" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="365" cy="285" rx="205" ry="125" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="555" cy="245" r="105" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="505" cy="235" rx="78" ry="92" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M620 265 Q685 340 630 410 Q600 432 575 398 Q620 365 585 305Z" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><rect {...common} fill="currentColor" x="238" y="345" width="78" height="122" rx="28" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><rect {...common} fill="currentColor" x="420" y="345" width="78" height="122" rx="28" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="105" cy="95" r="58" /></PaintPart>
        <PaintPart id={8} fill={fills[8]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M92 390 Q135 318 177 390 Q135 420 92 390Z M135 390 L135 470" /></PaintPart>
        <circle fill="#173b6d" cx="585" cy="225" r="10" />
        <path d="M570 278 Q595 298 615 277" fill="none" stroke="#173b6d" strokeWidth="7" strokeLinecap="round" />
      </svg>
    );
  }
  if (scene === 5) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color a tulip garden">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M0 385 Q180 330 360 390 Q550 325 760 385 L760 500 L0 500Z" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="105" cy="92" r="55" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M520 105 Q545 55 595 85 Q635 48 670 92 Q716 88 716 130 L520 130Z" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M130 260 Q172 180 215 260 Q255 180 292 260 Q270 340 211 343 Q150 340 130 260Z" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M300 220 Q342 140 385 220 Q425 140 462 220 Q440 300 381 303 Q320 300 300 220Z" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M485 275 Q527 195 570 275 Q610 195 647 275 Q625 355 566 358 Q505 355 485 275Z" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M210 340 L210 475 M210 395 Q155 355 145 415 Q190 430 210 410 M210 415 Q260 365 275 425 Q235 445 210 430" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M381 300 L381 475 M381 370 Q330 335 315 392 Q355 410 381 395 M381 390 Q430 345 445 405 Q408 424 381 410" /></PaintPart>
        <PaintPart id={8} fill={fills[8]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M566 355 L566 475 M566 400 Q515 365 500 422 Q540 442 566 425 M566 420 Q615 375 630 435 Q593 454 566 440" /></PaintPart>
        <PaintPart id={9} fill={fills[9]} color={selectedColor} onPaint={onPaint}>
          <><ellipse {...common} fill="currentColor" cx="650" cy="180" rx="42" ry="28" transform="rotate(-24 650 180)" /><ellipse {...common} fill="currentColor" cx="710" cy="180" rx="42" ry="28" transform="rotate(24 710 180)" /><ellipse {...common} fill="currentColor" cx="680" cy="200" rx="13" ry="42" /></>
        </PaintPart>
      </svg>
    );
  }
  if (scene === 6) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color a butterfly meadow">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M0 405 Q170 345 350 410 Q560 340 760 405 L760 500 L0 500Z" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="300" cy="205" rx="110" ry="82" transform="rotate(28 300 205)" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="330" cy="315" rx="78" ry="62" transform="rotate(-25 330 315)" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="500" cy="205" rx="110" ry="82" transform="rotate(-28 500 205)" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="470" cy="315" rx="78" ry="62" transform="rotate(25 470 315)" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="400" cy="270" rx="34" ry="125" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M88 420 L88 315 M88 330 Q35 280 42 345 Q70 355 88 340 M88 320 Q140 275 145 340 Q112 355 88 340" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="105" cy="95" r="58" /></PaintPart>
        <PaintPart id={8} fill={fills[8]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M550 93 Q575 45 625 78 Q665 43 700 88 Q736 88 742 125 L540 125Z" /></PaintPart>
      </svg>
    );
  }
  if (scene === 7) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color an owl in a moonlit tree">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="110" cy="92" r="62" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M545 500 Q520 330 570 190 Q620 320 645 500Z" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M175 380 Q380 340 610 380 L610 430 Q385 395 175 435Z" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M245 160 L310 115 L370 160 L430 115 L495 160 Q520 360 370 410 Q220 360 245 160Z" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M270 245 Q175 290 265 370 Q325 330 335 245Z" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M470 245 Q565 290 475 370 Q415 330 405 245Z" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="320" cy="220" r="55" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="425" cy="220" r="55" /></PaintPart>
        <PaintPart id={8} fill={fills[8]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M545 155 Q490 95 545 62 Q600 96 575 165Z M630 220 Q680 165 718 215 Q690 267 630 250Z" /></PaintPart>
        <circle fill="#173b6d" cx="320" cy="220" r="13" /><circle fill="#173b6d" cx="425" cy="220" r="13" />
        <path d="M350 265 L372 290 L395 265Z" fill="#173b6d" />
      </svg>
    );
  }
  if (scene === 8) {
    return (
      <svg viewBox="0 0 760 500" aria-label="Color a turtle in a lily pond">
        <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="380" cy="400" rx="345" ry="72" /></PaintPart>
        <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="355" cy="265" rx="185" ry="125" /></PaintPart>
        <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M235 265 Q355 125 475 265 Q355 405 235 265Z M355 142 L355 390 M235 265 L475 265" /></PaintPart>
        <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="555" cy="255" r="72" /></PaintPart>
        <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="220" cy="155" rx="65" ry="36" transform="rotate(35 220 155)" /></PaintPart>
        <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="220" cy="375" rx="65" ry="36" transform="rotate(-35 220 375)" /></PaintPart>
        <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="465" cy="145" rx="65" ry="36" transform="rotate(-30 465 145)" /></PaintPart>
        <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><ellipse {...common} fill="currentColor" cx="465" cy="385" rx="65" ry="36" transform="rotate(30 465 385)" /></PaintPart>
        <PaintPart id={8} fill={fills[8]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M55 355 Q130 285 210 355 Q135 415 55 355Z" /></PaintPart>
        <PaintPart id={9} fill={fills[9]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M118 330 Q80 280 118 245 Q155 280 118 330Z M118 330 Q155 280 192 315 Q155 350 118 330Z" /></PaintPart>
        <circle fill="#173b6d" cx="580" cy="240" r="9" /><path d="M570 278 Q592 292 608 275" fill="none" stroke="#173b6d" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 760 500" aria-label="Color a mountain lake landscape">
      <PaintPart id={0} fill={fills[0]} color={selectedColor} onPaint={onPaint}><circle {...common} fill="currentColor" cx="105" cy="90" r="58" /></PaintPart>
      <PaintPart id={1} fill={fills[1]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M475 90 Q510 40 555 80 Q605 35 642 86 Q695 70 720 125 L468 125Z" /></PaintPart>
      <PaintPart id={2} fill={fills[2]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M35 350 L235 105 L420 350Z" /></PaintPart>
      <PaintPart id={3} fill={fills[3]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M260 350 L495 75 L730 350Z" /></PaintPart>
      <PaintPart id={4} fill={fills[4]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M150 205 L235 105 L315 205 L268 190 L235 220 L200 190Z M400 185 L495 75 L590 185 L535 168 L495 205 L455 168Z" /></PaintPart>
      <PaintPart id={5} fill={fills[5]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M0 350 Q200 315 390 365 Q560 320 760 350 L760 500 L0 500Z" /></PaintPart>
      <PaintPart id={6} fill={fills[6]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M0 440 Q190 395 380 450 Q570 395 760 440 L760 500 L0 500Z" /></PaintPart>
      <PaintPart id={7} fill={fills[7]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M95 430 L140 320 L185 430Z M560 430 L610 300 L660 430Z M625 455 L680 330 L735 455Z" /></PaintPart>
      <PaintPart id={8} fill={fills[8]} color={selectedColor} onPaint={onPaint}><path {...common} fill="currentColor" d="M250 500 Q315 420 380 500Z" /></PaintPart>
    </svg>
  );
}

const COLORING_PART_COUNTS = [7, 9, 8, 8, 9, 10, 9, 9, 10, 9];

function ColoringBoard({ page, age, onComplete }: { page: number; age: number; onComplete: () => void }) {
  const [selectedColor, setSelectedColor] = useState(COLORS[1]);
  const [fills, setFills] = useState<Record<number, string>>({});
  const [celebrated, setCelebrated] = useState(false);
  const needed = COLORING_PART_COUNTS[page % COLORING_PART_COUNTS.length];

  const paint = (id: number, nextColor: string) => {
    const next = { ...fills, [id]: nextColor };
    setFills(next);
    if (!celebrated && Object.keys(next).length >= needed) {
      setCelebrated(true);
      onComplete();
    }
  };

  return (
    <div className="creative-board color-board">
      <div className="tool-row">
        <span className="tool-label">Pick a color</span>
        <div className="color-tools">
          {COLORS.slice(0, 7).map((swatch) => (
            <button
              key={swatch}
              aria-label={`Choose ${swatch}`}
              className={`swatch ${selectedColor === swatch ? "active" : ""}`}
              style={{ background: swatch }}
              onClick={() => setSelectedColor(swatch)}
            />
          ))}
        </div>
        <button className="tool-button" onClick={() => { setFills({}); setCelebrated(false); }}>Start over</button>
      </div>
      <div className="coloring-sheet">
        <ColoringScene page={page} selectedColor={selectedColor} fills={fills} onPaint={paint} />
      </div>
      {age >= 2 && (
        <div className="story-spark">
          <span>📖 Story lens</span>
          <p>
            Imagine this scene is one moment in a larger adventure. What happened
            five minutes before it—and what discovery happens next?
          </p>
        </div>
      )}
      <div className="learn-bubble">
        <span>💡 Did you know?</span>
        <p>{(age >= 2 ? OLDER_FACTS : FACTS)[page % (age >= 2 ? OLDER_FACTS.length : FACTS.length)]}</p>
      </div>
      {celebrated && <div className="success-toast" role="status">Beautiful work! You colored every part. ⭐</div>}
    </div>
  );
}

const DISCOVERY_FALLBACKS = [
  "https://images.unsplash.com/photo-1650709137023-399fe2326bd7?auto=format&fit=crop&fm=jpg&q=80&w=1600",
  "https://images.unsplash.com/photo-1626163450208-0fb18eb43b99?auto=format&fit=crop&fm=jpg&q=80&w=1600",
  "https://images.unsplash.com/photo-1494564605686-2e931f77a8e2?auto=format&fit=crop&fm=jpg&q=80&w=1600",
  "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia23/pia23645/PIA23645.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1200&w=1200",
  "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?crop=faces%2Cfocalpoint&fit=clip&h=1200&w=1800",
];

type CommonsImage = {
  url: string;
  credit: string;
  license: string;
  loading: boolean;
};

function plainText(value?: string) {
  return (value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function useMissionImage(query: string, page: number) {
  const fallback = DISCOVERY_FALLBACKS[(page - 1) % DISCOVERY_FALLBACKS.length];
  const [image, setImage] = useState<CommonsImage>({
    url: fallback,
    credit: "Loading a mission photograph…",
    license: "",
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    const parameters = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "0",
      gsrlimit: "5",
      gsrsort: "relevance",
      prop: "pageimages",
      piprop: "thumbnail|name",
      pithumbsize: "1600",
      format: "json",
      origin: "*",
    });

    fetch(`https://en.wikipedia.org/w/api.php?${parameters.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Image search unavailable");
        return response.json();
      })
      .then((data) => {
        const pages = Object.values(data.query?.pages || {}) as Array<{
          index?: number;
          title?: string;
          pageimage?: string;
          thumbnail?: { source?: string };
        }>;
        const details = pages
          .filter((item) => item.thumbnail?.source)
          .sort((first, second) => (first.index || 999) - (second.index || 999))[0];

        if (!details) throw new Error("No photograph found");
        setImage({
          url: details.thumbnail?.source || fallback,
          credit: plainText(details.title).slice(0, 80) || "Wikipedia",
          license: "Wikimedia Commons",
          loading: false,
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setImage({
          url: fallback,
          credit: "ColorQuest backup image",
          license: "educational display",
          loading: false,
        });
      });

    return () => controller.abort();
  }, [fallback, page, query]);

  return image;
}

function DiscoveryBoard({ page, age, onComplete }: { page: number; age: number; onComplete: () => void }) {
  const mission = buildDiscoveryMission(page, age);
  const image = useMissionImage(mission.imageQuery, page);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [completed, setCompleted] = useState(false);

  const check = () => {
    const correct = Number(answer) === mission.answer;
    setResult(correct ? "Exactly right—you calculated it like a scientist." : `Not yet. Hint: ${mission.hint}`);
    if (correct && !completed) {
      setCompleted(true);
      onComplete();
    }
  };

  return (
    <div className="creative-board discovery-board">
      <div className="mission-atlas" aria-label="Discovery Lab catalog">
        <span>🌍 {DISCOVERY_COUNTS.subjects} subjects</span>
        <span>🔎 {DISCOVERY_COUNTS.lenses} learning lenses</span>
        <strong>✨ {DISCOVERY_COUNTS.missions} distinct missions</strong>
      </div>
      <div className="discovery-hero">
        <div className={`discovery-photo ${image.loading ? "loading" : ""}`}>
          <img src={image.url} alt={`${mission.topicTitle}, ${mission.place}`} />
          <span>{mission.kind} · {mission.lens}</span>
          <small>{image.loading ? image.credit : `Image: ${image.credit} · ${image.license}`}</small>
        </div>
        <div className="field-notes">
          <p className="mission-number">FIELD MISSION {String(page).padStart(3, "0")} · {mission.field.toUpperCase()}</p>
          <h3>{mission.topicTitle}</h3>
          <p className="place-line">📍 {mission.place}</p>
          <p>{mission.fact}</p>
          <div className="observe-list">
            <strong>Look like a scientist</strong>
            {mission.observe.map((prompt, index) => <span key={prompt}>{index + 1}. {prompt}</span>)}
          </div>
        </div>
      </div>

      <div className="thinker-grid">
        <article className="think-card story-card">
          <span>📚 STORY</span>
          <h4>{mission.title}</h4>
          <p>{mission.story}</p>
          <strong>Draw or tell what happens next.</strong>
        </article>
        <article className="think-card imagine-card">
          <span>🪄 IMAGINE</span>
          <h4>Make a world that never existed</h4>
          <p>{mission.imagine}</p>
          <strong>Use real science—even in an imaginary place.</strong>
        </article>
        <article className="think-card math-card">
          <span>📐 SPACE & MAP MATH</span>
          <h4>Calculate the mission</h4>
          <p>{mission.question}</p>
          <div className="math-answer">
            <input inputMode="numeric" value={answer} onChange={(event) => setAnswer(event.target.value)} aria-label="Math challenge answer" />
            <button onClick={check}>Check</button>
          </div>
          {result && <small role="status">{result}</small>}
        </article>
      </div>

      <blockquote className="sagan-card">
        <span>Perspective from astronomer Carl Sagan</span>
        <p>
          {page % 2 === 0
            ? "“Look again at that dot. That’s here. That’s home. That’s us.”"
            : "“The cosmos is within us. We are made of star-stuff.”"}
        </p>
        <small>
          {page % 2 === 0
            ? "From Pale Blue Dot · quotation source: NASA/JPL-Caltech"
            : "From the 1980 Cosmos television series"}
        </small>
      </blockquote>
    </div>
  );
}

function Studio({
  age,
  activity,
  page,
  onAge,
  onActivity,
  onPage,
  onHome,
  onComplete,
  onParents,
}: {
  age: number;
  activity: Activity;
  page: number;
  onAge: (age: number) => void;
  onActivity: (activity: Activity) => void;
  onPage: (page: number) => void;
  onHome: () => void;
  onComplete: () => void;
  onParents: () => void;
}) {
  const activityCount = activity === "math" || activity === "science"
    ? getLearningLessons(activity as Subject, age).length
    : 400;

  return (
    <main className="studio-page">
      <AppHeader compact onHome={onHome} onStart={() => onActivity("draw")} onParents={onParents} />
      <div className="studio-shell">
        <aside className="studio-sidebar">
          <button className="back-home" onClick={onHome}>← Home</button>
          <p className="sidebar-label">My age world</p>
          <div className="age-pills">
            {AGE_GROUPS.map((group, index) => (
              <button key={group.short} className={age === index ? "active" : ""} onClick={() => onAge(index)}>
                <span>{group.icon}</span>{group.short}
              </button>
            ))}
          </div>
          <p className="sidebar-label">Create</p>
          <div className="activity-tabs">
            {(Object.keys(ACTIVITY_META) as Activity[]).filter((key) => age >= 2 || key !== "discover").map((key) => (
              <button key={key} className={activity === key ? "active" : ""} onClick={() => onActivity(key)}>
                <span>{ACTIVITY_META[key].icon}</span>
                <span><strong>{ACTIVITY_META[key].title}</strong><small>{ACTIVITY_META[key].copy}</small></span>
              </button>
            ))}
          </div>
          <div className="screen-break"><span>🌿</span><p>After a few activities, look at something far away and stretch.</p></div>
        </aside>

        <section className="studio-content">
          <div className="studio-heading">
            <div>
              <p>{AGE_GROUPS[age].label} · {AGE_GROUPS[age].skill}</p>
              <h2>{ACTIVITY_META[activity].title} adventure</h2>
            </div>
            <div className="page-picker">
              <button onClick={() => onPage(page === 1 ? activityCount : page - 1)} aria-label="Previous activity">←</button>
              <label>{activity === "math" || activity === "science" ? "Concept" : "Activity"} <input type="number" min="1" max={activityCount} value={page} onChange={(event) => onPage(Math.max(1, Math.min(activityCount, Number(event.target.value))))} /> of {activityCount}</label>
              <button onClick={() => onPage(page === activityCount ? 1 : page + 1)} aria-label="Next activity">→</button>
            </div>
          </div>

          {activity === "draw" && <DrawingBoard key={`d-${page}-${age}`} page={page} age={age} onComplete={onComplete} />}
          {activity === "color" && <ColoringBoard key={`c-${page}-${age}`} page={page} age={age} onComplete={onComplete} />}
          {activity === "puzzle" && <VariedPuzzleBoard key={`p-${page}-${age}`} page={page} age={age} onComplete={onComplete} />}
          {(activity === "math" || activity === "science") && <LearningBoard key={`l-${activity}-${page}-${age}`} subject={activity} page={page} age={age} onComplete={onComplete} onSelectLesson={onPage} />}
          {activity === "discover" && <DiscoveryBoard key={`x-${page}-${age}`} page={page} age={age} onComplete={onComplete} />}

          <div className="next-row">
            <div><span>🌟</span><p><strong>Creative reminder</strong><br />There is no wrong way to make art.</p></div>
            <button className="primary-button" onClick={() => onPage(page === activityCount ? 1 : page + 1)}>Next {activity === "math" || activity === "science" ? "concept" : "activity"} →</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function ParentCorner({ progress, age, onHome }: { progress: number; age: number; onHome: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [answer, setAnswer] = useState("");
  if (!unlocked) {
    return (
      <main className="parent-page">
        <button className="brand" onClick={onHome}><span className="brand-mark">🌈</span><span>ColorQuest <em>Kids</em></span></button>
        <section className="gate-card">
          <span className="gate-icon">👋</span>
          <p className="eyebrow">Grown-ups only</p>
          <h2>Quick check</h2>
          <p>What is 4 + 3?</p>
          <input autoFocus inputMode="numeric" value={answer} onChange={(event) => setAnswer(event.target.value)} aria-label="Answer to four plus three" />
          <button className="primary-button" onClick={() => answer.trim() === "7" && setUnlocked(true)}>Open parent corner</button>
          <button className="text-button" onClick={onHome}>Back to play</button>
        </section>
      </main>
    );
  }
  return (
    <main className="parent-page">
      <AppHeader compact onHome={onHome} onStart={onHome} onParents={() => undefined} />
      <section className="parent-dashboard">
        <p className="eyebrow">Parent corner</p>
        <h1>Creative play, without the noise.</h1>
        <p className="parent-intro">ColorQuest keeps progress on this device. There are no child accounts, ads, social features, or outside links in the play area.</p>
        <div className="parent-stats">
          <article><span>{progress}</span><strong>activities completed</strong><small>on this device</small></article>
          <article><span>{AGE_GROUPS[age].short}</span><strong>current age world</strong><small>{AGE_GROUPS[age].skill}</small></article>
          <article><span>0</span><strong>personal details collected</strong><small>privacy by design</small></article>
        </div>
        <div className="parent-notes">
          <article><h3>🌱 Let the child lead</h3><p>Ask “Tell me about your picture” instead of guessing what it is. This supports language and confidence.</p></article>
          <article><h3>⏱️ Keep sessions light</h3><p>For young children, 10–20 minutes is plenty. The app includes natural stopping points and no streak pressure.</p></article>
          <article><h3>🎨 Process over perfection</h3><p>Coloring outside the lines is not a mistake. Experimenting is where learning happens.</p></article>
        </div>
        <button className="primary-button" onClick={onHome}>Back to ColorQuest</button>
      </section>
    </main>
  );
}

export default function ColorQuestApp() {
  const [view, setView] = useState<"home" | "studio" | "parents">("home");
  const [age, setAge] = useState(1);
  const [activity, setActivity] = useState<Activity>("draw");
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("colorquest-progress");
      if (saved) setProgress(Number(saved) || 0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const complete = () => {
    setProgress((current) => {
      const next = current + 1;
      window.localStorage.setItem("colorquest-progress", String(next));
      return next;
    });
  };

  const start = (nextActivity: Activity = "draw") => {
    if (nextActivity === "discover" && age < 2) setAge(2);
    setActivity(nextActivity);
    setPage(1);
    setView("studio");
    window.scrollTo({ top: 0 });
  };

  const changeAge = (nextAge: number) => {
    setAge(nextAge);
    setPage(1);
    if (nextAge < 2 && activity === "discover") setActivity("draw");
  };

  const changeActivity = (nextActivity: Activity) => {
    setActivity(nextActivity);
    setPage(1);
  };

  if (view === "studio") {
    return <Studio age={age} activity={activity} page={page} onAge={changeAge} onActivity={changeActivity} onPage={setPage} onHome={() => setView("home")} onComplete={complete} onParents={() => setView("parents")} />;
  }
  if (view === "parents") {
    return <ParentCorner progress={progress} age={age} onHome={() => setView("home")} />;
  }
  return <Home age={age} progress={progress} onAge={changeAge} onStart={start} onParents={() => setView("parents")} />;
}
