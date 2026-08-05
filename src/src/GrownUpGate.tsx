import { useCallback, useState } from "react";

/**
 * A check that a grown-up — not the child using the app — is the one acting.
 *
 * The previous gates asked a fixed "4 + 3" and "6 + 2". Both are taught inside
 * this app's own Ages 4–6 maths trail, so they stopped nobody. This asks a
 * two-digit multiplication drawn fresh on every attempt: it stays trivial for an
 * adult, sits well beyond the Ages 10–12 trail, and cannot be memorised because
 * a wrong answer re-rolls the question.
 */

export type GateChallenge = { left: number; right: number; answer: number };

export function makeGateChallenge(random: () => number = Math.random): GateChallenge {
  // 12–19 × 3–9 keeps the arithmetic instant for an adult while staying outside
  // anything the app teaches, and never lands on a trivially guessable product.
  const left = 12 + Math.floor(random() * 8);
  const right = 3 + Math.floor(random() * 7);
  return { left, right, answer: left * right };
}

export function GrownUpGate({
  title = "Grown-ups only",
  intro,
  confirmLabel = "Continue",
  onPass,
  onCancel,
  cancelLabel = "Back to play",
  compact = false,
}: {
  title?: string;
  intro?: string;
  confirmLabel?: string;
  onPass: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  compact?: boolean;
}) {
  const [challenge, setChallenge] = useState<GateChallenge>(() => makeGateChallenge());
  const [answer, setAnswer] = useState("");
  const [failed, setFailed] = useState(false);

  const check = useCallback(() => {
    if (Number(answer.trim()) === challenge.answer) {
      onPass();
      return;
    }
    // Re-roll so repeated guessing cannot converge on one memorised answer.
    setChallenge(makeGateChallenge());
    setAnswer("");
    setFailed(true);
  }, [answer, challenge.answer, onPass]);

  return (
    <section className={`gate-card ${compact ? "compact" : ""}`.trim()}>
      <span className="gate-icon" aria-hidden="true">👋</span>
      <p className="eyebrow">{title}</p>
      <h2>Quick check</h2>
      <p>{intro || "Please ask a grown-up to answer this."}</p>
      <p className="gate-sum" aria-hidden="true">{challenge.left} × {challenge.right} = ?</p>
      <input
        autoFocus={!compact}
        inputMode="numeric"
        value={answer}
        onChange={(event) => { setAnswer(event.target.value); setFailed(false); }}
        onKeyDown={(event) => { if (event.key === "Enter") check(); }}
        aria-label={`Answer to ${challenge.left} times ${challenge.right}`}
      />
      <button className="primary-button" onClick={check}>{confirmLabel}</button>
      {failed && <small className="gate-error" role="status">Not quite — here is a new question. A grown-up can help.</small>}
      {onCancel && <button className="text-button" onClick={onCancel}>{cancelLabel}</button>}
    </section>
  );
}
