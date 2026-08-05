import type { DiscoveryTopic } from "./discovery-data";

/**
 * Offline artwork for Discovery Lab missions.
 *
 * This replaces a live `generator=search` query against all of Wikipedia, which
 * rendered whatever lead image the top-ranked article happened to carry that
 * day. In a children's app that is an unbounded content risk — the app had no
 * control over what appeared, and articles change without notice.
 *
 * Every card here is drawn locally from the topic's own data, so Discovery Lab
 * works offline, makes no network calls at all, and shows only what ships in
 * the build. `DiscoveryTopic.image` is the slot for curated photography: fill
 * it in with an approved file and credit and the card uses that instead, one
 * topic at a time, with no code change.
 */

export type SceneKind =
  | "mountain" | "desert" | "water" | "ice" | "forest"
  | "city" | "sky" | "planet" | "deepspace" | "person";

const KIND_TO_SCENE: Record<string, SceneKind> = {
  "Mountain": "mountain", "Mountain range": "mountain", "Mountain landscape": "mountain",
  "Volcano": "mountain", "Canyon": "mountain", "Stone forest": "mountain",
  "Rock landscape": "mountain", "Volcanic islands": "mountain",

  "Hot desert": "desert", "Coastal desert": "desert", "High desert": "desert",
  "Cold desert": "desert", "Chalk desert": "desert", "Living desert": "desert",
  "Rock desert": "desert",

  "Waterfall": "water", "River system": "water", "Rift lake": "water",
  "Inland delta": "water", "Ocean current": "water", "Coral reef": "water",

  "Polar desert": "ice", "Ice sheet": "ice", "Glacial lagoon": "ice",

  "Tropical forest": "forest", "Temperate forest": "forest", "Mangrove forest": "forest",
  "Island forest": "forest", "Grassland": "forest", "Island ecosystem": "forest",

  "Historic city": "city", "Rock-cut city": "city", "Human landscape": "city",
  "Architecture": "city", "Island culture": "city", "Lagoon city": "city",
  "Mountain city": "city",

  "Storm": "sky", "Seasonal weather": "sky", "Severe weather": "sky",
  "Water cycle": "sky", "Light": "sky", "Electricity": "sky", "Space weather": "sky",

  "Planet": "planet", "Gas giant": "planet", "Ringed planet": "planet",
  "Dwarf planet": "planet", "Ice giant": "planet", "Moon": "planet",
  "Hazy moon": "planet", "Ocean moon": "planet", "Icy moon": "planet",
  "Ocean planet": "planet", "Small worlds": "planet",

  "Galaxy": "deepspace", "Star": "deepspace", "Star nursery": "deepspace",
  "Black hole": "deepspace", "Supernova remnant": "deepspace",
  "Interstellar cloud": "deepspace", "Planetary system": "deepspace",
  "Icy traveler": "deepspace",

  "Thinker": "person", "Astronaut": "person",
  "Space mathematician": "person", "Science communicator": "person",
};

export function sceneFor(topic: DiscoveryTopic): SceneKind {
  return KIND_TO_SCENE[topic.kind] || "mountain";
}

/** Stable per-topic hash, so a topic always looks the same but no two match. */
function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

type Palette = { sky: [string, string]; near: string; mid: string; far: string; accent: string };

/** Base palettes per scene, nudged in hue per topic so cards feel individual. */
function paletteFor(scene: SceneKind, seed: number): Palette {
  const drift = (seed % 24) - 12;
  const h = (base: number, s: number, l: number) => `hsl(${(base + drift + 360) % 360} ${s}% ${l}%)`;
  switch (scene) {
    case "desert":
      return { sky: [h(32, 82, 76), h(24, 72, 62)], far: h(28, 46, 60), mid: h(30, 58, 52), near: h(28, 62, 42), accent: h(45, 90, 66) };
    case "water":
      return { sky: [h(196, 72, 78), h(205, 62, 62)], far: h(200, 40, 58), mid: h(196, 58, 44), near: h(200, 62, 32), accent: h(170, 66, 62) };
    case "ice":
      return { sky: [h(205, 62, 84), h(212, 52, 68)], far: h(206, 34, 74), mid: h(200, 40, 62), near: h(210, 44, 48), accent: h(190, 70, 82) };
    case "forest":
      return { sky: [h(150, 46, 80), h(160, 40, 64)], far: h(146, 34, 52), mid: h(140, 42, 38), near: h(136, 48, 26), accent: h(88, 62, 58) };
    case "city":
      return { sky: [h(38, 66, 80), h(28, 52, 64)], far: h(30, 26, 62), mid: h(26, 30, 48), near: h(24, 34, 34), accent: h(200, 54, 62) };
    case "sky":
      return { sky: [h(220, 46, 76), h(232, 42, 54)], far: h(226, 28, 60), mid: h(228, 32, 44), near: h(230, 36, 30), accent: h(52, 92, 68) };
    case "planet":
      return { sky: [h(248, 44, 22), h(258, 48, 12)], far: h(268, 34, 30), mid: h(20, 58, 52), near: h(14, 62, 40), accent: h(38, 88, 68) };
    case "deepspace":
      return { sky: [h(258, 52, 18), h(268, 56, 8)], far: h(280, 44, 34), mid: h(300, 48, 46), near: h(214, 62, 40), accent: h(190, 84, 72) };
    case "person":
      return { sky: [h(268, 38, 74), h(258, 34, 58)], far: h(262, 26, 62), mid: h(250, 30, 46), near: h(246, 34, 32), accent: h(40, 84, 68) };
    default:
      return { sky: [h(206, 66, 80), h(214, 56, 64)], far: h(212, 26, 62), mid: h(215, 30, 48), near: h(218, 34, 34), accent: h(48, 88, 66) };
  }
}

const VIEW_W = 800;
/**
 * Deliberately close to square. The card slot is much taller than it is wide on
 * a phone and `slice` crops the sides to fill it — a wide composition lost its
 * whole horizon to that crop and read as flat diagonal slabs.
 */
const VIEW_H = 620;
/** Where land meets sky. Scenes hang their layers off this. */
const HORIZON = 372;

function Stars({ seed, count = 46 }: { seed: number; count?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const a = hash(`star-${seed}-${index}`);
        const r = 0.6 + ((a >> 3) % 18) / 12;
        return (
          <circle key={index} cx={a % VIEW_W} cy={(a >> 7) % VIEW_H} r={r}
            fill="#fff" opacity={0.35 + ((a >> 5) % 55) / 100} />
        );
      })}
    </g>
  );
}

function Peaks({ seed, color, baseline, height, offset = 0, opacity = 1 }: {
  seed: number; color: string; baseline: number; height: number; offset?: number; opacity?: number;
}) {
  // Closed down to the bottom edge so a ridge always reads as solid ground
  // rather than a floating band, whatever the card crops away.
  const points: string[] = [`0,${VIEW_H}`, `0,${baseline}`];
  const steps = 7;
  for (let index = 0; index <= steps; index += 1) {
    const x = (VIEW_W / steps) * index;
    const jitter = (hash(`peak-${seed}-${offset}-${index}`) % 100) / 100;
    points.push(`${Math.round(x)},${Math.round(baseline - height * (0.42 + jitter * 0.58))}`);
  }
  points.push(`${VIEW_W},${baseline}`, `${VIEW_W},${VIEW_H}`);
  return <polygon points={points.join(" ")} fill={color} opacity={opacity} />;
}

function Dunes({ seed, color, baseline, opacity = 1 }: { seed: number; color: string; baseline: number; opacity?: number }) {
  const a = hash(`dune-${seed}`) % 90;
  return (
    <path
      d={`M0,${baseline + 40} C ${140 + a},${baseline - 46} ${300 - a},${baseline + 34} ${430},${baseline - 18}
          C ${560 + a},${baseline - 62} ${700},${baseline + 20} ${VIEW_W},${baseline - 30}
          L ${VIEW_W},${VIEW_H} L 0,${VIEW_H} Z`}
      fill={color}
      opacity={opacity}
    />
  );
}

function Scene({ scene, seed, palette: p }: { scene: SceneKind; seed: number; palette: Palette }) {
  switch (scene) {
    case "mountain":
      return (
        <>
          <circle cx={648} cy={112} r={48} fill={p.accent} opacity={0.9} />
          <Peaks seed={seed} color={p.far} baseline={HORIZON - 10} height={230} offset={1} opacity={0.55} />
          <Peaks seed={seed + 9} color={p.mid} baseline={HORIZON + 90} height={225} offset={2} opacity={0.9} />
          <Peaks seed={seed + 21} color={p.near} baseline={HORIZON + 210} height={200} offset={3} />
        </>
      );
    case "desert":
      return (
        <>
          <circle cx={186} cy={122} r={54} fill={p.accent} opacity={0.95} />
          <Dunes seed={seed} color={p.far} baseline={HORIZON - 26} opacity={0.5} />
          <Dunes seed={seed + 11} color={p.mid} baseline={HORIZON + 62} opacity={0.8} />
          <Dunes seed={seed + 27} color={p.near} baseline={HORIZON + 156} />
        </>
      );
    case "water":
      return (
        <>
          <circle cx={654} cy={116} r={44} fill={p.accent} opacity={0.85} />
          <Peaks seed={seed} color={p.far} baseline={HORIZON} height={150} opacity={0.5} />
          <rect x={0} y={HORIZON} width={VIEW_W} height={VIEW_H - HORIZON} fill={p.mid} />
          {[0, 1, 2, 3, 4, 5, 6].map((index) => {
            const y = HORIZON + 24 + index * 34;
            const a = hash(`wave-${seed}-${index}`) % 120;
            return (
              <path key={index} d={`M${-40 + a},${y} q 60,-14 120,0 t 120,0 t 120,0 t 120,0 t 120,0 t 120,0`}
                fill="none" stroke={p.accent} strokeWidth={4} strokeLinecap="round" opacity={0.3} />
            );
          })}
        </>
      );
    case "ice":
      return (
        <>
          <circle cx={162} cy={112} r={46} fill={p.accent} opacity={0.75} />
          <Peaks seed={seed} color={p.far} baseline={HORIZON} height={180} opacity={0.6} />
          <rect x={0} y={HORIZON} width={VIEW_W} height={VIEW_H - HORIZON} fill={p.mid} />
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const a = hash(`berg-${seed}-${index}`);
            const x = (a % (VIEW_W - 170)) + 50;
            const w = 70 + (a >> 4) % 110;
            const top = HORIZON + 16 + ((a >> 8) % 150);
            return (
              <polygon key={index}
                points={`${x},${top + 58} ${x + w * 0.36},${top} ${x + w * 0.7},${top + 26} ${x + w},${top + 58}`}
                fill={p.accent} opacity={0.85} />
            );
          })}
        </>
      );
    case "forest":
      return (
        <>
          <circle cx={642} cy={110} r={42} fill={p.accent} opacity={0.8} />
          <Peaks seed={seed} color={p.far} baseline={HORIZON} height={140} opacity={0.45} />
          <rect x={0} y={HORIZON} width={VIEW_W} height={VIEW_H - HORIZON} fill={p.mid} />
          {Array.from({ length: 22 }, (_, index) => {
            const a = hash(`tree-${seed}-${index}`);
            const x = 24 + (a % (VIEW_W - 48));
            const scale = 0.7 + ((a >> 6) % 70) / 100;
            const base = HORIZON + 30 + ((a >> 3) % 200);
            const th = 96 * scale;
            const tw = 38 * scale;
            return (
              <g key={index}>
                <rect x={x - 4} y={base - 14} width={8} height={20} fill={p.near} />
                <polygon points={`${x},${base - th} ${x + tw},${base - 8} ${x - tw},${base - 8}`} fill={p.near} opacity={0.92} />
              </g>
            );
          })}
        </>
      );
    case "city":
      return (
        <>
          <circle cx={120} cy={112} r={46} fill={p.accent} opacity={0.85} />
          <Peaks seed={seed} color={p.far} baseline={HORIZON} height={160} opacity={0.4} />
          {Array.from({ length: 13 }, (_, index) => {
            const a = hash(`build-${seed}-${index}`);
            const w = 40 + (a % 34);
            const x = index * 62 + (a % 12);
            const bh = 110 + ((a >> 5) % 260);
            return (
              <g key={index}>
                <rect x={x} y={VIEW_H - bh} width={w} height={bh} fill={index % 2 ? p.mid : p.near} rx={3} />
                {Array.from({ length: Math.max(2, Math.floor(bh / 38)) }, (_, row) => (
                  <rect key={row} x={x + 8} y={VIEW_H - bh + 16 + row * 34} width={w - 16} height={10} fill={p.accent} opacity={0.5} rx={2} />
                ))}
              </g>
            );
          })}
        </>
      );
    case "sky":
      return (
        <>
          {[0, 1, 2, 3].map((index) => {
            const a = hash(`cloud-${seed}-${index}`);
            const x = 80 + (a % (VIEW_W - 240));
            const y = 84 + ((a >> 5) % 170);
            const s = 0.75 + ((a >> 9) % 60) / 100;
            return (
              <g key={index} opacity={0.85}>
                <ellipse cx={x} cy={y} rx={80 * s} ry={36 * s} fill={p.far} />
                <ellipse cx={x + 56 * s} cy={y + 11 * s} rx={58 * s} ry={27 * s} fill={p.far} />
                <ellipse cx={x - 54 * s} cy={y + 13 * s} rx={50 * s} ry={25 * s} fill={p.far} />
              </g>
            );
          })}
          <polygon points="392,262 340,398 388,398 348,516 452,352 398,352 442,262" fill={p.accent} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
            const x = 60 + index * 92;
            const a = hash(`rain-${seed}-${index}`) % 40;
            return <line key={index} x1={x} y1={430 + a} x2={x - 14} y2={512 + a} stroke={p.mid} strokeWidth={5} strokeLinecap="round" opacity={0.5} />;
          })}
          <rect x={0} y={VIEW_H - 60} width={VIEW_W} height={60} fill={p.near} />
        </>
      );
    case "planet": {
      const ringed = hash(`planet-${seed}`) % 3 === 0;
      return (
        <>
          <Stars seed={seed} count={80} />
          <circle cx={400} cy={310} r={168} fill={p.mid} />
          <path d="M232,310 a168,168 0 0 0 336,0 Z" fill={p.near} opacity={0.5} />
          {[0, 1, 2].map((index) => (
            <ellipse key={index} cx={400} cy={248 + index * 62} rx={160 - index * 16} ry={16} fill={p.accent} opacity={0.26} />
          ))}
          <circle cx={348} cy={250} r={33} fill={p.accent} opacity={0.32} />
          {ringed && (
            <ellipse cx={400} cy={318} rx={272} ry={56} fill="none" stroke={p.accent} strokeWidth={16}
              opacity={0.7} transform="rotate(-16 400 318)" />
          )}
        </>
      );
    }
    case "deepspace":
      return (
        <>
          <Stars seed={seed} count={130} />
          <ellipse cx={400} cy={310} rx={318} ry={118} fill={p.mid} opacity={0.28} transform="rotate(-18 400 310)" />
          <ellipse cx={400} cy={310} rx={216} ry={74} fill={p.far} opacity={0.42} transform="rotate(-18 400 310)" />
          <ellipse cx={400} cy={310} rx={117} ry={38} fill={p.accent} opacity={0.55} transform="rotate(-18 400 310)" />
          <circle cx={400} cy={310} r={66} fill={p.accent} opacity={0.22} />
          <circle cx={400} cy={310} r={33} fill="#fff" opacity={0.92} />
        </>
      );
    case "person": {
      // A thinker at work: head, shoulders and an open notebook. Kept narrow and
      // centred so the card's side crop never removes the meaning.
      const a = hash(`person-${seed}`);
      return (
        <>
          <circle cx={400} cy={300} r={196} fill={p.far} opacity={0.32} />
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (Math.PI * 2 * index) / 6 + (a % 60) / 60;
            return (
              <circle key={index} cx={400 + Math.cos(angle) * 236} cy={300 + Math.sin(angle) * 180}
                r={8} fill={p.accent} opacity={0.5} />
            );
          })}
          <circle cx={400} cy={228} r={78} fill={p.accent} />
          <rect x={376} y={292} width={48} height={44} fill={p.accent} opacity={0.92} />
          <path d="M400,330 c-104,0 -168,62 -178,166 h356 c-10,-104 -74,-166 -178,-166 Z" fill={p.mid} />
          <rect x={318} y={430} width={164} height={106} rx={10} fill={p.near} />
          <line x1={400} y1={430} x2={400} y2={536} stroke={p.mid} strokeWidth={3} opacity={0.7} />
          {[0, 1, 2, 3].map((index) => (
            <g key={index} opacity={0.62}>
              <rect x={334} y={450 + index * 21} width={index % 2 ? 40 : 52} height={6} rx={3} fill={p.accent} />
              <rect x={416} y={450 + index * 21} width={index % 2 ? 52 : 40} height={6} rx={3} fill={p.accent} />
            </g>
          ))}
        </>
      );
    }
    default:
      return null;
  }
}

/**
 * The mission card image. Uses curated photography when a topic supplies it,
 * and otherwise draws a scene locally — either way, nothing leaves the device.
 */
export function DiscoveryArt({ topic, className = "" }: { topic: DiscoveryTopic; className?: string }) {
  if (topic.image) {
    return (
      <img
        className={className}
        src={topic.image.src}
        alt={topic.image.alt || `${topic.title}, ${topic.place}`}
        loading="lazy"
      />
    );
  }

  const scene = sceneFor(topic);
  const seed = hash(topic.title);
  const palette = paletteFor(scene, seed);
  const gradientId = `sky-${seed.toString(36)}`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Illustration of ${topic.title}, a ${topic.kind.toLowerCase()} in ${topic.place}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </linearGradient>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${gradientId})`} />
      <Scene scene={scene} seed={seed} palette={palette} />
    </svg>
  );
}

/** Credit line for the card. Curated photos carry their own; drawings say so. */
export function artCredit(topic: DiscoveryTopic): string {
  if (topic.image) return `${topic.image.credit} · ${topic.image.license}`;
  return "ColorQuest illustration · drawn on this device";
}
