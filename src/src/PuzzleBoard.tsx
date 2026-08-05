import { useMemo, useState } from "react";
import { getPuzzle, type PuzzleDefinition } from "./puzzle-data";
import { SpeakButton, useAutoSpeak, useSpeakOnChange } from "./SpeechProvider";

const FAMILY_LABELS = {
  match: "Partner match",
  sort: "Sort & classify",
  sequence: "Put in order",
  pattern: "Pattern rule",
  odd: "Odd one out",
  clue: "Clue solver",
};

function stableShuffle<T extends { label: string }>(items: T[], seed: string) {
  const score = (label: string) => Array.from(`${seed}-${label}`).reduce((total, letter) => (total * 31 + letter.charCodeAt(0)) % 1000003, 7);
  const shuffled = [...items].sort((first, second) => score(first.label) - score(second.label));
  if (shuffled.every((item, index) => item === items[index])) shuffled.reverse();
  return shuffled;
}

/** Names every interactive option so narration is useful without the icons. */
export function puzzleChoiceNarration(puzzle: PuzzleDefinition): string {
  if (puzzle.kind === "match") {
    return `Pieces: ${puzzle.pairs.map((pair) => pair.label).join(", ")}. Partners: ${puzzle.pairs.map((pair) => pair.homeLabel).join(", ")}.`;
  }
  if (puzzle.kind === "sort") {
    return `Items to sort: ${puzzle.items.map((item) => item.label).join(", ")}. Categories: ${puzzle.categories.join(" and ")}.`;
  }
  if (puzzle.kind === "sequence") {
    return `Steps to choose from: ${puzzle.steps.map((step) => step.label).join(", ")}.`;
  }
  return `${puzzle.prompt}. Your choices are: ${puzzle.options.map((option) => option.label).join(", ")}.`;
}

function PuzzleHeader({ puzzle, message }: { puzzle: PuzzleDefinition; message: string }) {
  const family = puzzle.kind === "choice" ? puzzle.family : puzzle.kind;
  const strategy = family === "match"
    ? "Name both pictures or ideas. Ask: Do they share a home, job, change, quantity, or cause?"
    : family === "sort"
      ? "Say the rule for each basket before placing anything. One clear feature should explain every item in that group."
      : family === "sequence"
        ? "Find the beginning first. Then ask what must happen before the next step can happen."
        : family === "pattern"
          ? "Say the repeating rule aloud, cover the last item, and predict what the rule needs next."
          : family === "odd"
            ? "Describe all three. Two will share one important rule; the odd one will break it."
            : "Underline each clue in your mind. The answer must satisfy every clue, not just one.";
  // The running message is the coaching. Spoken as soon as it changes.
  useSpeakOnChange(message);

  return (
    <>
      <div className="puzzle-help varied">
        <span aria-hidden="true">{family === "sort" ? "🧺" : family === "sequence" ? "🪜" : family === "pattern" ? "🔁" : family === "odd" ? "🕵️" : family === "clue" ? "💡" : "🧩"}</span>
        <div>
          <small>{FAMILY_LABELS[family]}</small>
          <strong>{puzzle.title}</strong>
          <p>{message}</p>
        </div>
        <SpeakButton id={`puzzle-${puzzle.id}`} label="Read puzzle" text={[puzzle.title, message, puzzleChoiceNarration(puzzle), strategy]} />
      </div>
      <details className="puzzle-coach">
        <summary>💡 Show me how to think about this</summary>
        <p>{strategy}</p>
        <small>The goal is to explain your rule—not to finish quickly.</small>
      </details>
    </>
  );
}

function MatchPuzzle({ puzzle, onComplete }: { puzzle: Extract<PuzzleDefinition, { kind: "match" }>; onComplete: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [message, setMessage] = useState(puzzle.instruction);
  const homes = useMemo(() => stableShuffle(puzzle.pairs.map((pair) => ({ ...pair, label: pair.homeLabel })), puzzle.id), [puzzle]);

  const tryMatch = (homeLabel: string) => {
    if (!selected) return setMessage("Choose one piece first, then choose its partner.");
    const pair = puzzle.pairs.find((entry) => entry.label === selected);
    if (pair?.homeLabel !== homeLabel) return setMessage(`${selected} does not connect to ${homeLabel} by this puzzle's rule. Ask what ${selected} uses, becomes, equals, or belongs with.`);
    const next = [...placed, selected];
    setPlaced(next);
    setSelected(null);
    setMessage(`Connected: ${pair.label} → ${pair.homeLabel}. Explain the connection aloud.`);
    if (next.length === puzzle.pairs.length) onComplete();
  };

  return (
    <>
      <PuzzleHeader puzzle={puzzle} message={message} />
      <div className="puzzle-stage varied-stage">
        <section>
          <h3>Pieces</h3>
          <div className="piece-bank">
            {puzzle.pairs.map((pair) => (
              <button key={pair.label} className={`match-piece ${selected === pair.label ? "active" : ""} ${placed.includes(pair.label) ? "placed" : ""}`} onClick={() => setSelected(pair.label)} disabled={placed.includes(pair.label)}>
                <span>{pair.item}</span><small>{pair.label}</small>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3>Partners</h3>
          <div className="home-bank">
            {homes.map((home) => {
              const pair = puzzle.pairs.find((entry) => entry.homeLabel === home.homeLabel)!;
              const filled = placed.includes(pair.label);
              return (
                <button key={home.homeLabel} className={`match-home ${filled ? "filled" : ""}`} onClick={() => tryMatch(home.homeLabel)} disabled={filled}>
                  <span>{filled ? pair.item : pair.home}</span><small>{pair.homeLabel}</small>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      {placed.length === puzzle.pairs.length && <div className="success-toast" role="status">Every connection fits—and you know why. ⭐</div>}
    </>
  );
}

function SortPuzzle({ puzzle, onComplete }: { puzzle: Extract<PuzzleDefinition, { kind: "sort" }>; onComplete: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(puzzle.instruction);

  const place = (category: string) => {
    if (!selected) return setMessage("Choose an item before choosing a category.");
    const item = puzzle.items.find((entry) => entry.id === selected)!;
    if (item.category !== category) return setMessage(`“${category}” means every item must share that feature. Describe ${item.label}: does it have that feature, or the other one?`);
    const next = { ...placed, [item.id]: category };
    setPlaced(next);
    setSelected(null);
    setMessage(`${item.label} belongs in ${category}. What feature helped you decide?`);
    if (Object.keys(next).length === puzzle.items.length) onComplete();
  };

  return (
    <>
      <PuzzleHeader puzzle={puzzle} message={message} />
      <div className="sort-bank">
        {puzzle.items.map((item) => (
          <button key={item.id} disabled={Boolean(placed[item.id])} className={`${selected === item.id ? "active" : ""} ${placed[item.id] ? "placed" : ""}`} onClick={() => setSelected(item.id)}>
            <span>{item.icon}</span><small>{item.label}</small>
          </button>
        ))}
      </div>
      <div className="category-bins">
        {puzzle.categories.map((category) => (
          <button key={category} onClick={() => place(category)}>
            <strong>{category}</strong>
            <span>{puzzle.items.filter((item) => placed[item.id] === category).map((item) => item.icon).join(" ") || "Drop ideas here"}</span>
          </button>
        ))}
      </div>
      {Object.keys(placed).length === puzzle.items.length && <div className="success-toast" role="status">Sorted! You used features to build useful groups. ⭐</div>}
    </>
  );
}

function SequencePuzzle({ puzzle, onComplete }: { puzzle: Extract<PuzzleDefinition, { kind: "sequence" }>; onComplete: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [message, setMessage] = useState(puzzle.instruction);
  const shuffled = useMemo(() => stableShuffle(puzzle.steps, puzzle.id), [puzzle]);

  const choose = (label: string) => {
    const expected = puzzle.steps[chosen.length];
    if (label !== expected.label) return setMessage(`${label} belongs later. Before it can happen, the sequence needs ${expected.label}. Look for cause, time, or what the next step requires.`);
    const next = [...chosen, label];
    setChosen(next);
    setMessage(next.length === puzzle.steps.length ? "The whole sequence makes sense from beginning to end." : `Yes. Now what must happen after ${label}?`);
    if (next.length === puzzle.steps.length) onComplete();
  };

  return (
    <>
      <PuzzleHeader puzzle={puzzle} message={message} />
      <div className="sequence-progress" aria-label="Sequence built so far">
        {puzzle.steps.map((_, index) => {
          const step = puzzle.steps.find((item) => item.label === chosen[index]);
          return <div key={index} className={step ? "filled" : ""}><small>{index + 1}</small><span>{step?.icon || "?"}</span><strong>{step?.label || "Choose a step"}</strong></div>;
        })}
      </div>
      <div className="sequence-bank">
        {shuffled.map((step) => (
          <button key={step.label} disabled={chosen.includes(step.label)} onClick={() => choose(step.label)}>
            <span>{step.icon}</span><small>{step.label}</small>
          </button>
        ))}
      </div>
      {chosen.length === puzzle.steps.length && <div className="success-toast" role="status">In order! You followed time and cause carefully. ⭐</div>}
    </>
  );
}

function ChoicePuzzle({ puzzle, onComplete }: { puzzle: Extract<PuzzleDefinition, { kind: "choice" }>; onComplete: () => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const correct = choice === puzzle.answer;

  const choose = (label: string) => {
    setChoice(label);
    if (label === puzzle.answer && !completed) {
      setCompleted(true);
      onComplete();
    }
  };

  return (
    <>
      <PuzzleHeader puzzle={puzzle} message={puzzle.instruction} />
      <section className="choice-puzzle">
        <div className="choice-prompt-head">
          <h3>{puzzle.prompt}</h3>
          <SpeakButton
            id={`choice-${puzzle.id}`}
            label="Hear it"
            text={[puzzle.prompt, `Your choices are: ${puzzle.options.map((option) => option.label).join(", ")}`]}
          />
        </div>
        <div>
          {puzzle.options.map((option) => (
            <button key={option.label} onClick={() => choose(option.label)} className={choice === option.label ? (option.label === puzzle.answer ? "correct" : "incorrect") : ""}>
              <span>{option.icon}</span><strong>{option.label}</strong>
            </button>
          ))}
        </div>
        {choice && <p className={correct ? "choice-feedback correct" : "choice-feedback"} role="status">{correct ? puzzle.explanation : `Good try. “${choice}” misses part of the rule. Describe each option, then choose the one that satisfies every clue.`}</p>}
      </section>
      {correct && <div className="success-toast">Solved with reasoning—not guessing. ⭐</div>}
    </>
  );
}

export default function PuzzleBoard({ page, age, onComplete }: { page: number; age: number; onComplete: () => void }) {
  // The counter is derived from the deduplicated deck, so the visible board
  // must use that same deck. Calling buildPuzzle here used to bypass the
  // deduplication and made children encounter repeats before the advertised
  // final page.
  const puzzle = getPuzzle(page, age);
  useAutoSpeak([puzzle.title, puzzle.instruction, puzzleChoiceNarration(puzzle)], puzzle.id);
  return (
    <div className="creative-board puzzle-board varied-puzzle" data-puzzle-id={puzzle.id}>
      {puzzle.kind === "match" && <MatchPuzzle puzzle={puzzle} onComplete={onComplete} />}
      {puzzle.kind === "sort" && <SortPuzzle puzzle={puzzle} onComplete={onComplete} />}
      {puzzle.kind === "sequence" && <SequencePuzzle puzzle={puzzle} onComplete={onComplete} />}
      {puzzle.kind === "choice" && <ChoicePuzzle puzzle={puzzle} onComplete={onComplete} />}
    </div>
  );
}
