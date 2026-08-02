import { useEffect, useState } from "react";
import { getLearningLesson, getLearningLessons, type Subject } from "./learning-data";
import { getCuratedResource, getLessonGuide, INTERESTS } from "./mentor-data";
import type { InterestKey } from "./profile-data";

const AGE_LABELS = ["Ages 1–3", "Ages 4–6", "Ages 7–9", "Ages 10–12"];

function ConceptStory({ slides }: { slides: Array<{ icon: string; label: string; text: string }> }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setSlide((current) => {
        if (current >= slides.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [playing, slides.length]);

  if (!open) return <button className="concept-story-launch" onClick={() => { setOpen(true); setPlaying(true); }}>▶ Play concept story</button>;
  const current = slides[slide];
  return (
    <article className="concept-story" aria-live="polite">
      <div className="story-screen">
        <span>{current.icon}</span>
        <div><small>{current.label} · {slide + 1} of {slides.length}</small><p>{current.text}</p></div>
      </div>
      <div className="story-controls">
        <button onClick={() => setSlide((value) => Math.max(0, value - 1))} aria-label="Previous concept story slide">←</button>
        <button onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : slide === slides.length - 1 ? "Replay" : "Play"}</button>
        <button onClick={() => setSlide((value) => Math.min(slides.length - 1, value + 1))} aria-label="Next concept story slide">→</button>
        <button className="close-story" onClick={() => { setOpen(false); setPlaying(false); }}>Close</button>
      </div>
      <div className="story-dots">{slides.map((item, index) => <i key={item.label} className={index === slide ? "active" : ""} />)}</div>
    </article>
  );
}

function LearnMoreGate({ subject, interest }: { subject: Subject; interest: InterestKey }) {
  const [gate, setGate] = useState(false);
  const [answer, setAnswer] = useState("");
  const [approved, setApproved] = useState(false);
  const resource = getCuratedResource(subject, interest);
  return (
    <article className="learn-more-card">
      <div><span>🔗 GROWN-UP LINK</span><h4>Want to keep exploring?</h4><p>{resource.note}</p></div>
      {!gate && <button onClick={() => setGate(true)}>Ask a grown-up</button>}
      {gate && !approved && (
        <div className="resource-gate">
          <label>Grown-up check: What is 6 + 2?<input value={answer} inputMode="numeric" onChange={(event) => setAnswer(event.target.value)} /></label>
          <button onClick={() => setApproved(answer.trim() === "8")}>Check</button>
          {answer && answer.trim() !== "8" && <small>Ask a grown-up to help open this link.</small>}
        </div>
      )}
      {approved && <a href={resource.url} target="_blank" rel="noreferrer">Open {resource.title} ↗<small>{resource.provider}</small></a>}
    </article>
  );
}

export default function LearningBoard({
  subject,
  age,
  page,
  liked,
  onComplete,
  onAttempt,
  onLike,
  onSelectLesson,
}: {
  subject: Subject;
  age: number;
  page: number;
  liked: boolean;
  onComplete: () => void;
  onAttempt: () => void;
  onLike: (lessonId: string, interest: InterestKey) => void;
  onSelectLesson: (page: number) => void;
}) {
  const lesson = getLearningLesson(subject, age, page);
  const lessons = getLearningLessons(subject, age);
  const guide = getLessonGuide(lesson, subject, age);
  const [choice, setChoice] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [unpacked, setUnpacked] = useState(false);
  const correct = choice === lesson.answer;

  const answer = (nextChoice: string) => {
    setChoice(nextChoice);
    onAttempt();
    if (nextChoice === lesson.answer && !completed) {
      setCompleted(true);
      onComplete();
    }
  };

  return (
    <div className={`creative-board learning-board ${subject}`}>
      <div className="lesson-banner">
        <span className="lesson-icon" aria-hidden="true">{lesson.icon}</span>
        <div>
          <p>{subject === "math" ? "MATH TRAIL" : "SCIENCE TRAIL"} · {AGE_LABELS[age]}</p>
          <h3>{lesson.title}</h3>
          <small className="path-label">🧭 {guide.path}</small>
        </div>
        <span className="lesson-position">Concept {page} of {lessons.length}</span>
      </div>

      <ConceptStory slides={guide.slides} />

      <div className="lesson-layout">
        <section className="concept-column">
          <article className="big-idea-card">
            <span>THE BIG IDEA</span>
            <h4>{lesson.bigIdea}</h4>
            <p>{lesson.explanation}</p>
            <button className="unpack-button" onClick={() => setUnpacked((value) => !value)}>{unpacked ? "Hide extra explanation" : "Explain it another way"}</button>
            {unpacked && <div className="unpacked-explanation"><strong>Let’s unpack it</strong><p>{guide.anotherWay}</p><small>{guide.whyItMatters}</small></div>}
          </article>

          <article className="example-card">
            <span>SEE IT</span>
            <p>{lesson.example}</p>
          </article>

          <article className="move-card">
            <span>TRY IT AWAY FROM THE SCREEN</span>
            <p>{lesson.activity}</p>
          </article>
        </section>

        <section className="practice-column">
          <article className="question-card">
            <span>YOUR TURN</span>
            <h4>{lesson.question}</h4>
            <div className="answer-grid">
              {lesson.choices.map((option) => {
                const isChosen = choice === option;
                const className = isChosen ? (option === lesson.answer ? "chosen correct" : "chosen incorrect") : "";
                return <button key={option} className={className} onClick={() => answer(option)} aria-pressed={isChosen}>{option}</button>;
              })}
            </div>
            {choice && (
              <div className={`answer-explanation ${correct ? "correct" : "try-again"}`} role="status">
                <strong>{correct ? "Yes—your reasoning works!" : "Good try. Let’s use a clue."}</strong>
                <p>{correct ? lesson.why : guide.hint}</p>
                {!correct && <button onClick={() => setUnpacked(true)}>Show me another explanation</button>}
              </div>
            )}
          </article>

          {correct && (
            <article className="mentor-celebration">
              <span>🌱 MENTOR NOTE</span><p>You learned this at your own pace. Can you explain it in your own words?</p>
              <button className={liked ? "liked" : ""} disabled={liked} onClick={() => onLike(lesson.id, guide.interest)}>
                {liked ? "✓ Added to my interests" : `${INTERESTS[guide.interest].icon} I liked this—show me more`}
              </button>
            </article>
          )}

          <article className="word-lab">
            <span>WORD LAB</span>
            <div>{lesson.words.map(([word, meaning]) => <p key={word}><strong>{word}</strong><small>{meaning}</small></p>)}</div>
          </article>
        </section>
      </div>

      <LearnMoreGate subject={subject} interest={guide.interest} />

      <section className="topic-map" aria-label={`${subject} concepts in this age group`}>
        <strong>Explore this {AGE_LABELS[age]} trail</strong>
        <div>{lessons.map((item, index) => <button key={item.id} className={index + 1 === page ? "active" : ""} onClick={() => onSelectLesson(index + 1)} aria-label={`Open ${item.title}`}><span>{item.icon}</span>{item.title}</button>)}</div>
      </section>
    </div>
  );
}
