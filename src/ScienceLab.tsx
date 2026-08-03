import { useState } from "react";
import { getScienceLab, getScienceLabs } from "./lab-data";
import { SpeakButton, useAutoSpeak } from "./SpeechProvider";

const SAFETY_ICON = { "Child can try": "🟢", "Grown-up nearby": "🟡", "Grown-up required": "🔴" } as const;

export default function ScienceLabBoard({ age, page, onComplete, onSelectLab }: { age: number; page: number; onComplete: () => void; onSelectLab: (page: number) => void }) {
  const lab = getScienceLab(age, page);
  const labs = getScienceLabs(age);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const reveal = () => {
    setRevealed(true);
    onComplete();
  };

  // A lab is done away from the screen with a grown-up, so the safety level and
  // materials matter as much as the question — read all three aloud on open.
  useAutoSpeak([lab.title, `Safety level: ${lab.safety}.`, lab.question], lab.id);

  return (
    <div className="creative-board science-lab-board">
      <header className="lab-header">
        <div className="lab-icon" aria-hidden="true">{lab.icon}</div>
        <div><p>SCIENCE LAB · {lab.field}</p><h3>{lab.title}</h3><small>Lab {page} of {labs.length} · about {lab.time}</small></div>
        <strong className={`safety-${lab.safety.toLowerCase().replaceAll(" ", "-")}`}>{SAFETY_ICON[lab.safety]} {lab.safety}</strong>
        <SpeakButton
          id={`lab-${lab.id}`}
          label="Read the lab"
          className="on-banner"
          text={[
            lab.title,
            `Safety level: ${lab.safety}.`,
            lab.question,
            `You will need: ${lab.materials.join(", ")}.`,
            ...lab.steps.map((step, index) => `Step ${index + 1}. ${step}`),
          ]}
        />
      </header>
      <section className="lab-question">
        <span>1 · ASK</span>
        <div className="lab-question-head">
          <h4>{lab.question}</h4>
          <SpeakButton id={`lab-q-${lab.id}`} label="Hear question" text={lab.question} />
        </div>
        <p>Scientists begin with a question, not an answer.</p>
      </section>
      <div className="lab-grid">
        <section>
          <article className="lab-card prediction-card"><span>2 · PREDICT</span><h4>What do you think?</h4><div>{lab.predictions.map((item) => <button key={item} className={prediction === item ? "active" : ""} onClick={() => setPrediction(item)}>{item}</button>)}</div><small>A prediction is not a grade. It is an idea to test.</small></article>
          <article className="lab-card materials-card"><span>MATERIALS</span><ul>{lab.materials.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </section>
        <section>
          <article className="lab-card steps-card">
            <span>3 · TEST SAFELY</span>
            <div className="lab-card-head">
              <h4>Check each step</h4>
              <SpeakButton
                id={`lab-steps-${lab.id}`}
                label="Read steps"
                text={lab.steps.map((step, index) => `Step ${index + 1}. ${step}`)}
              />
            </div>
            {lab.steps.map((step, index) => <label key={step}><input type="checkbox" checked={checked.includes(index)} onChange={() => setChecked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} /><i>{index + 1}</i><p>{step}</p></label>)}
          </article>
          <article className="lab-card observe-card"><span>4 · OBSERVE</span><p>{lab.observation}</p></article>
        </section>
      </div>
      <section className="lab-explain">
        <div>
          <span>5 · EXPLAIN</span>
          <h4>Compare the evidence with your prediction</h4>
          <p>{revealed ? lab.explanation : "Finish the safe steps, then reveal the science. A result that surprises you is still useful evidence."}</p>
          {revealed && <SpeakButton id={`lab-explain-${lab.id}`} label="Hear the science" text={[lab.explanation, lab.wonder]} />}
        </div>
        <button disabled={!prediction || checked.length < lab.steps.length} onClick={reveal}>{revealed ? "✓ Explanation revealed" : "Reveal the science"}</button>
      </section>
      {revealed && <section className="lab-wonder"><span>🌟 NEXT QUESTION</span><p>{lab.wonder}</p><strong>Draw or write what you would test next.</strong></section>}
      <section className="lab-map"><strong>Choose another investigation</strong><div>{labs.map((item, index) => <button key={item.id} className={index + 1 === page ? "active" : ""} onClick={() => onSelectLab(index + 1)}><span>{item.icon}</span>{item.title}<small>{SAFETY_ICON[item.safety]} {item.safety}</small></button>)}</div></section>
      <p className="lab-safety-note">Never taste lab materials. Never use flames, mains electricity, sealed pressure experiments, or unknown chemicals. Stop if anything breaks, spills dangerously, or becomes hot.</p>
    </div>
  );
}
