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
import ArtworkGallery from "./ArtworkGallery";
import DrawingStudio from "./DrawingStudio";
import LearningBoard from "./LearningBoard";
import ScienceLabBoard from "./ScienceLab";
import { ProfileHub, ProfileSetup } from "./ProfileViews";
import VariedPuzzleBoard from "./PuzzleBoard";
import { addArtwork } from "./artwork-store";
import { getLearningLessons, type Subject } from "./learning-data";
import { getScienceLabs } from "./lab-data";
import { activityCount, activityUnit, COLORING_SCENE_COUNT } from "./content-counts";
import { artCredit, DiscoveryArt } from "./discovery-art";
import { GrownUpGate } from "./GrownUpGate";
import { SpeakButton, SpeechProvider, useAutoSpeak, useSpeech } from "./SpeechProvider";
import { isSpeechSupported, voiceProfileForAge } from "./speech";
import FifiGuide from "./FifiGuide";
import { getBookSuggestions, getFavoriteInterest, getMentorRecommendations, INTERESTS } from "./mentor-data";
import {
  ageWorldFor,
  completedCount,
  emptyProgress,
  loadFamilyData,
  makeProfile,
  recordCompletion,
  recordInterest,
  recordLearningAttempt,
  recordLocation,
  saveFamilyData,
  type ActivityKey,
  type ChildProfile,
  type FamilyData,
  type InterestKey,
  type ProfileProgress,
} from "./profile-data";

type Activity = ActivityKey;

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
  color: { icon: "🎨", title: "Color", copy: `${COLORING_SCENE_COUNT} scenes to fill with color` },
  puzzle: { icon: "🧩", title: "Build puzzles", copy: "Match, sort, sequence, reason" },
  math: { icon: "🧮", title: "Math", copy: "Big ideas made visible" },
  science: { icon: "🧪", title: "Science", copy: "Ask, observe, explain" },
  lab: { icon: "🥼", title: "Science Lab", copy: "Predict, test safely, explain" },
  discover: { icon: "🔭", title: "Discovery Lab", copy: "Real places, space, stories & math" },
};

const COLORS = ["#ff604f", "#ffd65a", "#24bca4", "#55aaf5", "#7857d6", "#f58bbb", "#173b6d", "#ffffff"];
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

function AppHeader({
  compact = false,
  profile,
  onHome,
  onStart,
  onParents,
  onProfiles,
}: {
  compact?: boolean;
  profile?: ChildProfile;
  onHome: () => void;
  onStart: () => void;
  onParents: () => void;
  onProfiles: () => void;
}) {
  return (
    <header className={`topbar ${compact ? "compact" : ""}`}>
      <button className="brand" onClick={onHome} aria-label="ColorQuest Kids home">
        <span className="brand-mark">🌈</span>
        <span>ColorQuest <em>Kids</em></span>
      </button>
      <nav aria-label="Main navigation">
        {profile && <button className="profile-pill" onClick={onProfiles} aria-label={`Switch profile, currently ${profile.name}`}><span>{profile.avatar}</span><strong>{profile.name}</strong><small>Age {profile.age}</small></button>}
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
  profileProgress,
  profile,
  canContinue,
  onAge,
  onStart,
  onContinue,
  onParents,
  onProfiles,
  onStartLesson,
}: {
  age: number;
  profileProgress: ProfileProgress;
  profile: ChildProfile;
  canContinue: boolean;
  onAge: (age: number) => void;
  onStart: (activity?: Activity) => void;
  onContinue: () => void;
  onParents: () => void;
  onProfiles: () => void;
  onStartLesson: (subject: Subject, page: number) => void;
}) {
  const recommendations = getMentorRecommendations(age, profileProgress);
  const favorite = getFavoriteInterest(profileProgress);
  const progress = completedCount(profileProgress);
  const welcomeKey = `colorquest-fifi-welcome-v1:${profile.id}`;
  const [fifiWelcomeOpen, setFifiWelcomeOpen] = useState(() => {
    try {
      return window.sessionStorage.getItem(welcomeKey) !== "seen";
    } catch {
      return true;
    }
  });
  const welcomeMessages = [
    "I brought colors, shapes, and a tiny idea just for you. What should we make first?",
    "Ready to draw, count, wonder, and make something nobody has imagined before?",
    "Your next idea could begin with art, a puzzle, a number, or a science question. You choose the path!",
    "Bring your boldest question. We can turn it into a design, an experiment, or a whole new world.",
  ];
  const dismissWelcome = () => {
    try {
      window.sessionStorage.setItem(welcomeKey, "seen");
    } catch {
      /* A private browser can still dismiss Fifi for this render. */
    }
    setFifiWelcomeOpen(false);
  };
  return (
    <main>
      <AppHeader profile={profile} onProfiles={onProfiles} onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} onStart={() => onStart()} onParents={onParents} />

      <section className="hero">
        <div className="hero-copy">
          <div className="welcome-profile"><span>{profile.avatar}</span><p><small>Welcome back</small><strong>{profile.name}</strong></p></div>
          <p className="eyebrow">A free creative playground for ages 1–12</p>
          <h1>Create.<br />Color. Learn.</h1>
          <p className="hero-text">
            Draw, color, build puzzles, and learn through play in a world made
            for curious kids.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onStart()}>Start creating</button>
            {canContinue && <button className="continue-button" onClick={onContinue}>Continue my adventure →</button>}
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

      <section className="mentor-home" aria-label={`${profile.name}'s learning path`}>
        <div className="mentor-home-heading">
          <div><p className="eyebrow">My learning path</p><h2>A small next step, picked for {profile.name}</h2></div>
          <p>{favorite ? `${INTERESTS[favorite].icon} We noticed an interest in ${INTERESTS[favorite].label}. Recommendations will grow as ${profile.name} explores.` : "Try a few lessons and tap “I liked this.” ColorQuest will gently learn what sparks curiosity—without rushing or locking other topics."}</p>
        </div>
        <div className="mentor-path-grid">
          {recommendations.map((item) => (
            <article key={item.subject} className={item.subject}>
              <span>{item.subject === "math" ? "🧮" : "🧪"}</span>
              <div><small>{item.path} · {item.completed}/{item.total} complete</small><h3>{item.lesson.title}</h3><p>{item.reason}</p></div>
              <button onClick={() => onStartLesson(item.subject, item.page)}>Start this step →</button>
            </article>
          ))}
        </div>
        <small className="mentor-promise">No streaks. No locked lessons. Repeat, skip, pause, or explore in any order.</small>
      </section>

      <section className="learning-strip">
        <div><span>4</span><small>age-adapted worlds</small></div>
        <div><span>7</span><small>ways to create and learn</small></div>
        <div><span>64</span><small>guided math &amp; science concepts</small></div>
        <div><span>32</span><small>hands-on science labs</small></div>
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

      <FifiGuide
        open={fifiWelcomeOpen}
        mode="tip"
        autoGreet
        childName={profile.name}
        mascotSrc={`${import.meta.env.BASE_URL}mascot/fifi-color-spark.png`}
        title={`Hi ${profile.name}! Fifi just hopped in.`}
        message={welcomeMessages[age]}
        onDismiss={dismissWelcome}
      />
    </main>
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
  const facts = age >= 2 ? OLDER_FACTS : FACTS;
  const fact = facts[page % facts.length];

  useAutoSpeak(["Pick a color, then tap a part of the picture.", fact], `color-${age}-${page}`);

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
        <p>{fact}</p>
        <SpeakButton id={`color-fact-${age}-${page}`} label="Hear it" text={fact} />
      </div>
      {celebrated && <div className="success-toast" role="status">Beautiful work! You colored every part. ⭐</div>}
    </div>
  );
}

function DiscoveryBoard({ page, age, onComplete }: { page: number; age: number; onComplete: () => void }) {
  const mission = buildDiscoveryMission(page, age);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [completed, setCompleted] = useState(false);

  useAutoSpeak(
    [mission.topicTitle, mission.place, mission.fact, mission.story, mission.imagine, mission.question],
    `discover-${age}-${page}`,
  );

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
        <div className="discovery-photo">
          <DiscoveryArt topic={mission.topic} />
          <span>{mission.kind} · {mission.lens}</span>
          <small>{artCredit(mission.topic)}</small>
        </div>
        <div className="field-notes">
          <p className="mission-number">FIELD MISSION {String(page).padStart(3, "0")} · {mission.field.toUpperCase()}</p>
          <div className="field-notes-head">
            <h3>{mission.topicTitle}</h3>
            <SpeakButton
              id={`discover-${age}-${page}`}
              label="Read mission"
              text={[mission.topicTitle, mission.place, mission.fact, ...mission.observe]}
            />
          </div>
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
          <SpeakButton id={`discover-story-${age}-${page}`} label="Hear story" text={[mission.title, mission.story]} />
        </article>
        <article className="think-card imagine-card">
          <span>🪄 IMAGINE</span>
          <h4>Make a world that never existed</h4>
          <p>{mission.imagine}</p>
          <strong>Use real science—even in an imaginary place.</strong>
          <SpeakButton id={`discover-imagine-${age}-${page}`} label="Hear idea" text={mission.imagine} />
        </article>
        <article className="think-card math-card">
          <span>📐 SPACE & MAP MATH</span>
          <h4>Calculate the mission</h4>
          <p>{mission.question}</p>
          <SpeakButton id={`discover-math-${age}-${page}`} label="Hear question" text={mission.question} />
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
  profile,
  profileProgress,
  age,
  activity,
  page,
  onAge,
  onActivity,
  onPage,
  onHome,
  onComplete,
  onLearningAttempt,
  onLikeLesson,
  onParents,
  onProfiles,
  onSaveArtwork,
}: {
  profile: ChildProfile;
  profileProgress: ProfileProgress;
  age: number;
  activity: Activity;
  page: number;
  onAge: (age: number) => void;
  onActivity: (activity: Activity) => void;
  onPage: (page: number) => void;
  onHome: () => void;
  onComplete: () => void;
  onLearningAttempt: (subject: Subject) => void;
  onLikeLesson: (lessonId: string, interest: InterestKey) => void;
  onParents: () => void;
  onProfiles: () => void;
  onSaveArtwork: (dataUrl: string, title: string) => Promise<void>;
}) {
  const total = activityCount(activity, age);
  const unit = activityUnit(activity);
  const [drawingUnsaved, setDrawingUnsaved] = useState(false);
  const [pendingDrawingExit, setPendingDrawingExit] = useState<null | (() => void)>(null);
  const [pendingStartOver, setPendingStartOver] = useState<null | (() => void)>(null);
  const [fifiTipOpen, setFifiTipOpen] = useState(false);
  const fifiMascot = `${import.meta.env.BASE_URL}mascot/fifi-color-spark.png`;

  const fifiTips: Record<Activity, string> = {
    draw: "Try one shape, one brush, and one color you have never combined before. New ideas often begin with a tiny experiment!",
    color: "Colors do not have to copy real life. A purple ocean or golden elephant can begin a wonderful story.",
    puzzle: "Slow thinking is strong thinking. Name the rule before you choose a piece.",
    math: "If a number feels tricky, draw it, build it, or tell a small story about it.",
    science: "Scientists are allowed to change their minds when new evidence appears. That is how learning grows.",
    lab: "Make a prediction first. A surprising result is useful evidence, not a mistake.",
    discover: "Look closely at the real place, then imagine one new detail that could still follow its science.",
  };

  useEffect(() => {
    const key = `colorquest-fifi-tip-v1:${profile.id}:${activity}`;
    try {
      setFifiTipOpen(window.localStorage.getItem(key) !== "seen");
    } catch {
      setFifiTipOpen(true);
    }
  }, [profile.id, activity]);

  const dismissFifiTip = () => {
    try {
      window.localStorage.setItem(`colorquest-fifi-tip-v1:${profile.id}:${activity}`, "seen");
    } catch {
      /* Private browsing may block storage; dismissing still works for this screen. */
    }
    setFifiTipOpen(false);
  };

  /**
   * Leaving the Drawing Studio used to blank the canvas silently — and "Next
   * activity" was the biggest button on the screen. The picture is autosaved
   * now, but a child who taps away still deserves to be told what happens.
   */
  const guard = (action: () => void) => () => {
    if (activity === "draw" && drawingUnsaved && typeof window !== "undefined") {
      setPendingDrawingExit(() => action);
      return;
    }
    action();
  };
  const completedHere = profileProgress.activities[activity].completed.includes(`${age}:${page}`);

  return (
    <main className="studio-page">
      <AppHeader compact profile={profile} onProfiles={guard(onProfiles)} onHome={guard(onHome)} onStart={guard(() => onActivity("draw"))} onParents={guard(onParents)} />
      <div className="studio-shell">
        <aside className="studio-sidebar">
          <button className="back-home" onClick={guard(onHome)}>← Home</button>
          <p className="sidebar-label">My age world</p>
          <div className="age-pills">
            {AGE_GROUPS.map((group, index) => (
              <button key={group.short} className={age === index ? "active" : ""} onClick={guard(() => onAge(index))}>
                <span>{group.icon}</span>{group.short}
              </button>
            ))}
          </div>
          <p className="sidebar-label">Create</p>
          <div className="activity-tabs">
            {(Object.keys(ACTIVITY_META) as Activity[]).filter((key) => age >= 2 || key !== "discover").map((key) => (
              <button key={key} className={activity === key ? "active" : ""} onClick={guard(() => onActivity(key))}>
                <span>{ACTIVITY_META[key].icon}</span>
                <span><strong>{ACTIVITY_META[key].title}</strong><small>{ACTIVITY_META[key].copy}</small><em>{profileProgress.activities[key].completed.length} completed</em></span>
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
              <button onClick={guard(() => onPage(page === 1 ? total : page - 1))} aria-label="Previous activity">←</button>
              <label>{unit} <input type="number" min="1" max={total} value={page} onChange={(event) => {
                const target = Math.max(1, Math.min(total, Number(event.target.value)));
                guard(() => onPage(target))();
              }} /> of {total}</label>
              <span className={`completion-marker ${completedHere ? "done" : ""}`}>{completedHere ? "✓ Done" : "In progress"}</span>
              <button onClick={guard(() => onPage(page === total ? 1 : page + 1))} aria-label="Next activity">→</button>
            </div>
          </div>

          {activity === "draw" && <DrawingStudio key={`d-${page}-${age}-${profile.id}`} page={page} age={age} profileId={profile.id} profileName={profile.name} onComplete={onComplete} onSaveArtwork={onSaveArtwork} onDirtyChange={setDrawingUnsaved} onRequestStartOver={(confirm) => setPendingStartOver(() => confirm)} />}
          {activity === "color" && <ColoringBoard key={`c-${page}-${age}`} page={page} age={age} onComplete={onComplete} />}
          {activity === "puzzle" && <VariedPuzzleBoard key={`p-${page}-${age}`} page={page} age={age} onComplete={onComplete} />}
          {(activity === "math" || activity === "science") && <LearningBoard key={`l-${activity}-${page}-${age}`} subject={activity} page={page} age={age} liked={profileProgress.learning.likedLessons.includes(getLearningLessons(activity, age)[page - 1].id)} onComplete={onComplete} onAttempt={() => onLearningAttempt(activity)} onLike={onLikeLesson} onSelectLesson={onPage} />}
          {activity === "lab" && <ScienceLabBoard key={`lab-${page}-${age}`} page={page} age={age} onComplete={onComplete} onSelectLab={onPage} />}
          {activity === "discover" && <DiscoveryBoard key={`x-${page}-${age}`} page={page} age={age} onComplete={onComplete} />}

          <div className="next-row">
            <div><span>🌟</span><p><strong>Creative reminder</strong><br />There is no wrong way to make art.</p></div>
            <button className="primary-button" onClick={guard(() => onPage(page === total ? 1 : page + 1))}>Next {unit.toLowerCase()} →</button>
          </div>

          <FifiGuide
            open={Boolean(pendingDrawingExit)}
            mode="leave-drawing"
            childName={profile.name}
            mascotSrc={fifiMascot}
            onStay={() => setPendingDrawingExit(null)}
            onLeave={() => {
              const action = pendingDrawingExit;
              setPendingDrawingExit(null);
              action?.();
            }}
          />
          <FifiGuide
            open={Boolean(pendingStartOver)}
            mode="start-over"
            childName={profile.name}
            mascotSrc={fifiMascot}
            onCancel={() => setPendingStartOver(null)}
            onStartOver={() => {
              const action = pendingStartOver;
              setPendingStartOver(null);
              action?.();
            }}
          />
          <FifiGuide
            open={fifiTipOpen && !pendingDrawingExit && !pendingStartOver}
            mode="tip"
            childName={profile.name}
            mascotSrc={fifiMascot}
            title="Fifi's creative spark"
            message={fifiTips[activity]}
            onDismiss={dismissFifiTip}
          />
        </section>
      </div>
    </main>
  );
}

/**
 * Grown-up controls for read-aloud. ColorQuest never requests a microphone or
 * records audio. The browser chooses whether a listed speech voice is installed
 * locally or supplied by an operating-system service, which is why the picker
 * labels that distinction instead of making an inaccurate offline promise.
 */
function ReadAloudSettings() {
  const { settings, updateSettings, voices, selectedVoice, say, ageWorld } = useSpeech();
  const supported = isSpeechSupported();
  const ageVoice = voiceProfileForAge(settings, ageWorld);

  return (
    <section className="read-aloud-settings">
      <div>
        <p className="eyebrow">Read aloud</p>
        <h2>Every screen can read itself out loud</h2>
        <p>
          Children who cannot yet read can hear lessons, puzzles, labs and missions.
          ColorQuest never records them and never asks for microphone access. Voice
          availability and network use depend on the phone or browser&apos;s speech service.
        </p>
      </div>

      {!supported && (
        <p className="read-aloud-unsupported" role="status">
          This device&apos;s browser does not offer a speech voice, so read-aloud is
          unavailable here. On Android, installing Google Text-to-Speech usually enables it.
        </p>
      )}

      <label className="setting-row">
        <input
          type="checkbox"
          checked={settings.enabled}
          disabled={!supported}
          onChange={(event) => updateSettings({ enabled: event.target.checked })}
        />
        <span><strong>Read-aloud available</strong><small>Shows a 🔊 button on lessons, puzzles, labs and missions.</small></span>
      </label>

      <fieldset className="setting-row setting-choice" disabled={!supported || !settings.enabled}>
        <legend>Read the main text automatically when a screen opens</legend>
        {([
          ["young", "For ages 1–6", "Recommended. Older children tap 🔊 when they want it."],
          ["always", "For every age", "Every screen reads itself as it opens."],
          ["never", "Never automatically", "Only when the child taps 🔊."],
        ] as const).map(([value, label, note]) => (
          <label key={value}>
            <input
              type="radio"
              name="auto-read"
              checked={settings.autoRead === value}
              onChange={() => updateSettings({ autoRead: value })}
            />
            <span><strong>{label}</strong><small>{note}</small></span>
          </label>
        ))}
      </fieldset>

      <label className="setting-row setting-voice">
        <span><strong>Voice</strong><small>Auto chooses the clearest available English voice. Installed voices usually work without a connection.</small></span>
        <select
          value={settings.voice?.voiceURI || settings.voice?.name || "auto"}
          disabled={!supported || !settings.enabled || voices.length === 0}
          onChange={(event) => {
            if (event.target.value === "auto") {
              updateSettings({ voice: null });
              return;
            }
            const voice = voices.find((item) => (item.voiceURI || item.name) === event.target.value);
            if (voice) updateSettings({ voice: { voiceURI: voice.voiceURI, name: voice.name } });
          }}
        >
          <option value="auto">Auto — age-aware</option>
          {voices.map((voice) => (
            <option key={`${voice.voiceURI}:${voice.name}`} value={voice.voiceURI || voice.name}>
              {voice.name} · {voice.localService ? "On-device" : "May use network"}
            </option>
          ))}
        </select>
        <em>{selectedVoice ? `${selectedVoice.name} · ${ageVoice.label}` : ageVoice.label}</em>
      </label>

      <label className="setting-row setting-rate">
        <span><strong>Speaking speed</strong><small>Slower helps a child follow along word by word.</small></span>
        <input
          type="range"
          min="0.5"
          max="1.2"
          step="0.05"
          value={settings.rate}
          disabled={!supported || !settings.enabled}
          onChange={(event) => updateSettings({ rate: Number(event.target.value) })}
        />
        <em>{settings.rate <= 0.7 ? "Slow" : settings.rate >= 1.05 ? "Brisk" : "Steady"}</em>
      </label>

      <button
        className="tool-button"
        disabled={!supported || !settings.enabled}
        onClick={() => say(`Hello! I am Fifi. This is my ${ageVoice.label.toLowerCase()} reading voice.`)}
      >
        🔊 Hear a sample
      </button>
    </section>
  );
}

function ParentCorner({
  family,
  activeProfile,
  age,
  artworkRevision,
  onHome,
  onProfiles,
  onUpdateProfile,
  onDeleteProfile,
}: {
  family: FamilyData;
  activeProfile: ChildProfile;
  age: number;
  artworkRevision: number;
  onHome: () => void;
  onProfiles: () => void;
  onUpdateProfile: (profile: ChildProfile) => void;
  onDeleteProfile: (profileId: string) => void;
}) {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) {
    return (
      <main className="parent-page">
        <button className="brand" onClick={onHome}><span className="brand-mark">🌈</span><span>ColorQuest <em>Kids</em></span></button>
        <GrownUpGate
          intro="Parent Corner can delete profiles and export artwork, so please ask a grown-up to answer this."
          confirmLabel="Open parent corner"
          onPass={() => setUnlocked(true)}
          onCancel={onHome}
        />
      </main>
    );
  }
  const progress = completedCount(family.progress[activeProfile.id]);
  const favorite = getFavoriteInterest(family.progress[activeProfile.id] || emptyProgress());
  const books = getBookSuggestions(activeProfile.age, favorite);
  return (
    <main className="parent-page">
      <AppHeader compact profile={activeProfile} onProfiles={onProfiles} onHome={onHome} onStart={onHome} onParents={() => undefined} />
      <section className="parent-dashboard">
        <p className="eyebrow">Parent corner</p>
        <h1>Creative play, without the noise.</h1>
        <p className="parent-intro">ColorQuest keeps progress on this device. There are no child accounts, ads, or social features. A small set of official learning links opens only after a grown-up check.</p>
        <div className="parent-stats">
          <article><span>{progress}</span><strong>activities completed</strong><small>for {activeProfile.name}</small></article>
          <article><span>{AGE_GROUPS[age].short}</span><strong>current age world</strong><small>{AGE_GROUPS[age].skill}</small></article>
          <article><span>{family.profiles.length}</span><strong>private child profiles</strong><small>stored only on this device</small></article>
        </div>
        <section className="profile-management">
          <div><p className="eyebrow">Profiles and pacing</p><h2>Each child gets their own path</h2><p>Change a nickname or age here. Updating age changes the recommended world without deleting earlier work.</p></div>
          <div className="profile-manage-grid">
            {family.profiles.map((profile) => {
              const childProgress = family.progress[profile.id] || emptyProgress();
              return (
                <article key={profile.id}>
                  <span>{profile.avatar}</span>
                  <label>Nickname<input value={profile.name} maxLength={20} onChange={(event) => onUpdateProfile({ ...profile, name: event.target.value.slice(0, 20) })} /></label>
                  <label>Age<input type="number" min="1" max="12" value={profile.age} onChange={(event) => onUpdateProfile({ ...profile, age: Math.max(1, Math.min(12, Number(event.target.value) || 1)) })} /></label>
                  <strong>{completedCount(childProgress)} completed</strong>
                  <small>Continue: {ACTIVITY_META[childProgress.lastActivity].title}, page {childProgress.activities[childProgress.lastActivity].lastPage}</small>
                  <div className="progress-chips">{(["draw", "color", "puzzle", "math", "science", "lab"] as Activity[]).map((key) => <span key={key}>{ACTIVITY_META[key].icon} {childProgress.activities[key].completed.length}</span>)}</div>
                  <button onClick={() => onDeleteProfile(profile.id)}>Delete profile</button>
                </article>
              );
            })}
          </div>
          <button className="tool-button" onClick={onProfiles}>Add or switch profiles</button>
        </section>
        <ReadAloudSettings />
        <div className="parent-notes">
          <article><h3>🌱 Let the child lead</h3><p>Ask “Tell me about your picture” instead of guessing what it is. This supports language and confidence.</p></article>
          <article><h3>⏱️ Keep sessions light</h3><p>For young children, 10–20 minutes is plenty. The app includes natural stopping points and no streak pressure.</p></article>
          <article><h3>🎨 Process over perfection</h3><p>Coloring outside the lines is not a mistake. Experimenting is where learning happens.</p></article>
        </div>
        <section className="book-shelf">
          <div><p className="eyebrow">Curiosity bookshelf</p><h2>Books to continue the conversation</h2><p>{favorite ? `Suggestions begin with ${activeProfile.name}’s growing interest in ${INTERESTS[favorite].label}. Borrowing from a local library is a wonderful first choice.` : "These are age-friendly starting points. As interests emerge, the shelf will move matching books to the front."}</p></div>
          <div className="book-grid">
            {books.map((book) => <article key={book.title}><span>📘</span><small>Ages {book.ages}</small><h3>{book.title}</h3><strong>{book.author}</strong><p>{book.note}</p><em>Search your local library</em></article>)}
          </div>
        </section>
        <ArtworkGallery profiles={family.profiles} revision={artworkRevision} />
        <button className="primary-button" onClick={onHome}>Back to ColorQuest</button>
      </section>
    </main>
  );
}

export default function ColorQuestApp() {
  const [family, setFamily] = useState<FamilyData>(() => loadFamilyData());
  const initialProfile = family.profiles.find((profile) => profile.id === family.activeProfileId) || family.profiles[0];
  const [view, setView] = useState<"home" | "studio" | "parents" | "profiles" | "profile-new">("home");
  const [age, setAge] = useState(() => initialProfile ? ageWorldFor(initialProfile.age) : 1);
  const [activity, setActivity] = useState<Activity>("draw");
  const [page, setPage] = useState(1);
  const [artworkRevision, setArtworkRevision] = useState(0);

  useEffect(() => {
    saveFamilyData(family);
  }, [family]);

  const activeProfile = family.profiles.find((profile) => profile.id === family.activeProfileId) || family.profiles[0];
  const activeProgress = activeProfile ? family.progress[activeProfile.id] || emptyProgress() : emptyProgress();

  const addProfile = (name: string, profileAge: number, avatar: string) => {
    const profile = makeProfile(name, profileAge, avatar);
    const legacyCompleted = family.profiles.length === 0 ? Number(window.localStorage.getItem("colorquest-progress")) || 0 : 0;
    setFamily((current) => ({
      ...current,
      profiles: [...current.profiles, profile],
      activeProfileId: profile.id,
      progress: { ...current.progress, [profile.id]: emptyProgress(legacyCompleted) },
    }));
    setAge(ageWorldFor(profile.age));
    setActivity("draw");
    setPage(1);
    setView("home");
  };

  const selectProfile = (profileId: string) => {
    const profile = family.profiles.find((item) => item.id === profileId);
    if (!profile) return;
    const progress = family.progress[profileId] || emptyProgress();
    setFamily((current) => ({ ...current, activeProfileId: profileId }));
    setAge(ageWorldFor(profile.age));
    setActivity(progress.lastActivity);
    setPage(progress.activities[progress.lastActivity].lastPage);
    setView("home");
  };

  const complete = () => {
    if (!activeProfile) return;
    setFamily((current) => recordCompletion(current, activeProfile.id, activity, age, page));
  };

  const learningAttempt = (subject: Subject) => {
    if (!activeProfile) return;
    setFamily((current) => recordLearningAttempt(current, activeProfile.id, subject, age, page));
  };

  const likeLesson = (lessonId: string, interest: InterestKey) => {
    if (!activeProfile) return;
    setFamily((current) => recordInterest(current, activeProfile.id, lessonId, interest));
  };

  const start = (nextActivity: Activity = "draw", resume = false, requestedPage?: number) => {
    if (!activeProfile) return;
    const nextAge = nextActivity === "discover" && age < 2 ? 2 : age;
    const nextPage = requestedPage || (resume ? activeProgress.activities[nextActivity].lastPage : 1);
    if (nextAge !== age) setAge(nextAge);
    setActivity(nextActivity);
    setPage(nextPage);
    setFamily((current) => recordLocation(current, activeProfile.id, nextActivity, nextPage));
    setView("studio");
    window.scrollTo({ top: 0 });
  };

  const continueAdventure = () => start(activeProgress.lastActivity, true);

  const changeAge = (nextAge: number) => {
    setAge(nextAge);
    setPage(1);
    if (nextAge < 2 && activity === "discover") setActivity("draw");
  };

  const changeActivity = (nextActivity: Activity) => {
    if (!activeProfile) return;
    const nextPage = activeProgress.activities[nextActivity]?.lastPage || 1;
    setActivity(nextActivity);
    setPage(nextPage);
    setFamily((current) => recordLocation(current, activeProfile.id, nextActivity, nextPage));
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    if (activeProfile) setFamily((current) => recordLocation(current, activeProfile.id, activity, nextPage));
  };

  const saveArtwork = async (dataUrl: string, title: string) => {
    if (!activeProfile) return;
    await addArtwork({ profileId: activeProfile.id, title, dataUrl });
    setArtworkRevision((current) => current + 1);
  };

  const updateProfile = (updated: ChildProfile) => {
    setFamily((current) => ({ ...current, profiles: current.profiles.map((profile) => profile.id === updated.id ? updated : profile) }));
    if (updated.id === activeProfile?.id) setAge(ageWorldFor(updated.age));
  };

  const deleteProfile = (profileId: string) => {
    const profile = family.profiles.find((item) => item.id === profileId);
    if (!profile || !window.confirm(`Delete ${profile.name}'s profile and progress? Saved gallery pictures can still be deleted separately.`)) return;
    setFamily((current) => {
      const profiles = current.profiles.filter((item) => item.id !== profileId);
      const progress = { ...current.progress };
      delete progress[profileId];
      return { ...current, profiles, progress, activeProfileId: current.activeProfileId === profileId ? profiles[0]?.id || null : current.activeProfileId };
    });
    const next = family.profiles.find((item) => item.id !== profileId);
    if (activeProfile?.id === profileId && next) setAge(ageWorldFor(next.age));
  };

  if (!activeProfile) return <ProfileSetup onCreate={addProfile} />;

  const screen = view === "profile-new"
    ? <ProfileSetup onCreate={addProfile} onCancel={() => setView("profiles")} />
    : view === "profiles"
      ? <ProfileHub profiles={family.profiles} activeProfileId={activeProfile.id} onSelect={selectProfile} onAdd={() => setView("profile-new")} onBack={() => setView("home")} />
      : view === "studio"
        ? <Studio profile={activeProfile} profileProgress={activeProgress} age={age} activity={activity} page={page} onAge={changeAge} onActivity={changeActivity} onPage={changePage} onHome={() => setView("home")} onComplete={complete} onLearningAttempt={learningAttempt} onLikeLesson={likeLesson} onParents={() => setView("parents")} onProfiles={() => setView("profiles")} onSaveArtwork={saveArtwork} />
        : view === "parents"
          ? <ParentCorner family={family} activeProfile={activeProfile} age={age} artworkRevision={artworkRevision} onHome={() => setView("home")} onProfiles={() => setView("profiles")} onUpdateProfile={updateProfile} onDeleteProfile={deleteProfile} />
          : <Home age={age} profileProgress={activeProgress} profile={activeProfile} canContinue={completedCount(activeProgress) > 0 || activeProgress.activities[activeProgress.lastActivity].lastPage > 1} onAge={changeAge} onStart={start} onStartLesson={(subject, lessonPage) => start(subject, false, lessonPage)} onContinue={continueAdventure} onParents={() => setView("parents")} onProfiles={() => setView("profiles")} />;

  // Read-aloud pace follows the age world the child is currently exploring.
  return <SpeechProvider ageWorld={age}>{screen}</SpeechProvider>;
}
