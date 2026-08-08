import { useEffect, useRef, useState } from "react";
import { getLearningLesson, getLearningLessons, type Subject } from "./learning-data";
import { getCuratedResource, getLessonGuide, INTERESTS } from "./mentor-data";
import type { InterestKey, MathPracticeOutcome, MathPracticeState } from "./profile-data";
import { GrownUpGate } from "./GrownUpGate";
import { SpeakButton, useAutoSpeak, useSpeech } from "./SpeechProvider";
import {
  evaluateMathReadiness,
  generateAdaptiveMathQuestion,
  mathMasteryLabel,
  type MathRepresentation,
} from "./adaptive-math";

const AGE_LABELS = ["Ages 1–3", "Ages 4–6", "Ages 7–9", "Ages 10–12"];

function newMathSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `math-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Reading time for a slide when the story is playing silently.
 * The old fixed 4.5s rushed a struggling reader on a long slide and stalled a
 * fast one on a short slide, so pace it by how much text is actually there.
 */
function readingMs(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.min(11000, Math.max(3200, words * 420));
}

function ConceptStory({ slides, lessonId }: { slides: Array<{ icon: string; label: string; text: string }>; lessonId: string }) {
  const { available, say, stop } = useSpeech();
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [slide, setSlide] = useState(0);

  const current = slides[slide];

  useEffect(() => {
    if (!open || !playing) return undefined;
    const advance = () => setSlide((value) => {
      if (value >= slides.length - 1) {
        setPlaying(false);
        return value;
      }
      return value + 1;
    });

    // When read-aloud is on, the narration sets the pace and the slide turns
    // when the sentence finishes — so the picture always matches the voice.
    if (available) {
      const started = say(current.text, { onDone: advance });
      if (started) return stop;
    }

    const timer = window.setTimeout(advance, readingMs(current.text));
    return () => window.clearTimeout(timer);
  }, [open, playing, slide, slides.length, current.text, available, say, stop]);

  // Reset when the lesson changes underneath us.
  useEffect(() => {
    setOpen(false);
    setPlaying(false);
    setSlide(0);
    stop();
  }, [lessonId, stop]);

  const stopAndSet = (next: number) => {
    stop();
    setPlaying(false);
    setSlide(next);
  };

  if (!open) {
    return (
      <button className="concept-story-launch" onClick={() => { setOpen(true); setPlaying(true); setSlide(0); }}>
        ▶ Play concept story{available ? " with narration" : ""}
      </button>
    );
  }

  return (
    <article className="concept-story" aria-live="polite">
      <div className="story-screen">
        <span aria-hidden="true">{current.icon}</span>
        <div><small>{current.label} · {slide + 1} of {slides.length}</small><p>{current.text}</p></div>
      </div>
      <div className="story-controls">
        <button onClick={() => stopAndSet(Math.max(0, slide - 1))} aria-label="Previous concept story slide">←</button>
        <button onClick={() => { if (playing) stop(); setPlaying((value) => !value); }}>
          {playing ? "Pause" : slide === slides.length - 1 ? "Replay" : "Play"}
        </button>
        <button onClick={() => stopAndSet(Math.min(slides.length - 1, slide + 1))} aria-label="Next concept story slide">→</button>
        <button className="close-story" onClick={() => { stop(); setOpen(false); setPlaying(false); }}>Close</button>
      </div>
      <div className="story-dots">{slides.map((item, index) => <i key={item.label} className={index === slide ? "active" : ""} />)}</div>
    </article>
  );
}

function LearnMoreGate({ subject, interest }: { subject: Subject; interest: InterestKey }) {
  const [gate, setGate] = useState(false);
  const [approved, setApproved] = useState(false);
  const resource = getCuratedResource(subject, interest);
  return (
    <article className="learn-more-card">
      <div><span>🔗 GROWN-UP LINK</span><h4>Want to keep exploring?</h4><p>{resource.note}</p></div>
      {!gate && !approved && <button onClick={() => setGate(true)}>Ask a grown-up</button>}
      {gate && !approved && (
        <div className="resource-gate">
          <GrownUpGate
            compact
            title="Grown-up link"
            intro={`This opens ${resource.provider} in a browser, outside ColorQuest.`}
            confirmLabel="Approve this link"
            cancelLabel="Not now"
            onPass={() => { setApproved(true); setGate(false); }}
            onCancel={() => setGate(false)}
          />
        </div>
      )}
      {approved && <a href={resource.url} target="_blank" rel="noreferrer">Open {resource.title} ↗<small>{resource.provider}</small></a>}
    </article>
  );
}

export default function LearningBoard({
  subject,
  age,
  childAge,
  profileId,
  page,
  liked,
  mathPractice,
  mathJourney,
  onComplete,
  onAttempt,
  onMathAnswer,
  onLike,
  onSelectLesson,
}: {
  subject: Subject;
  age: number;
  childAge: number;
  profileId: string;
  page: number;
  liked: boolean;
  mathPractice?: MathPracticeState;
  mathJourney: MathPracticeOutcome[];
  onComplete: () => void;
  onAttempt: () => void;
  onMathAnswer: (result: {
    lessonId: string;
    questionId: string;
    correct: boolean;
    representation: MathRepresentation;
    sessionId: string;
  }) => void;
  onLike: (lessonId: string, interest: InterestKey) => void;
  onSelectLesson: (page: number) => void;
}) {
  const lesson = getLearningLesson(subject, age, page);
  const lessons = getLearningLessons(subject, age);
  const guide = getLessonGuide(lesson, subject, age);
  const adaptiveMath = subject === "math";
  const scoredAdaptiveMath = adaptiveMath && childAge >= 3;
  const mathSessionId = useRef(newMathSessionId());
  const [mathRound, setMathRound] = useState(0);
  const [seenHere, setSeenHere] = useState<string[]>([]);
  const [mathQuestion, setMathQuestion] = useState(() => adaptiveMath
    ? generateAdaptiveMathQuestion({ profileId, childAge, lesson, state: mathPractice, sessionSeed: mathSessionId.current })
    : null);
  const [questSolved, setQuestSolved] = useState(0);
  const [questionSolved, setQuestionSolved] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [unpacked, setUnpacked] = useState(false);
  const prompt = mathQuestion?.prompt || lesson.question;
  const choices: readonly string[] = mathQuestion && childAge <= 3
    ? mathQuestion.choices.filter((option) => option === mathQuestion.answer || option === mathQuestion.choices.find((item) => item !== mathQuestion.answer))
    : mathQuestion?.choices || lesson.choices;
  const expectedAnswer = mathQuestion?.answer || lesson.answer;
  const correct = choice === expectedAnswer;
  const readiness = evaluateMathReadiness(mathJourney);

  // Children who cannot read hear the lesson's big idea and question as it opens.
  useAutoSpeak(
    [lesson.title, lesson.bigIdea, mathQuestion?.speakText || lesson.question],
    `${subject}-${age}-${page}-${mathQuestion?.id || "guided"}`,
  );

  const answer = (nextChoice: string) => {
    if (questionSolved) return;
    setChoice(nextChoice);
    if (scoredAdaptiveMath && mathQuestion) {
      onMathAnswer({
        lessonId: lesson.id,
        questionId: mathQuestion.id,
        correct: nextChoice === mathQuestion.answer,
        representation: mathQuestion.representation,
        sessionId: mathSessionId.current,
      });
    } else {
      onAttempt();
    }
    if (nextChoice === expectedAnswer) {
      setQuestionSolved(true);
      if (adaptiveMath) setQuestSolved((value) => Math.min(5, value + 1));
      if (!completed) {
        setCompleted(true);
        onComplete();
      }
    }
  };

  const nextMathQuestion = () => {
    if (!mathQuestion) return;
    const finishedQuest = questSolved >= 5;
    if (finishedQuest) {
      mathSessionId.current = newMathSessionId();
      setQuestSolved(0);
    }
    const nextRound = mathRound + 1;
    const recentQuestionIds = [mathQuestion.id, ...seenHere, ...(mathPractice?.recentQuestionIds || [])];
    const next = generateAdaptiveMathQuestion({
      profileId,
      childAge,
      lesson,
      state: { ...mathPractice, recentQuestionIds },
      sessionSeed: `${mathSessionId.current}:${nextRound}`,
    });
    setSeenHere((current) => [mathQuestion.id, ...current].slice(0, 12));
    setMathRound(nextRound);
    setMathQuestion(next);
    setChoice(null);
    setQuestionSolved(false);
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
        <SpeakButton
          id={`lesson-${lesson.id}`}
          label="Read lesson"
          className="on-banner"
          text={[lesson.title, lesson.bigIdea, lesson.explanation, lesson.example]}
        />
      </div>

      <ConceptStory slides={guide.slides} lessonId={lesson.id} />

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
            {adaptiveMath && mathQuestion && (
              <div className="adaptive-math-status" aria-label={`Math practice: ${mathMasteryLabel(mathPractice)}`}>
                <div><span>FIFI'S FRESH MATH QUEST</span><strong>{childAge <= 2 ? "Play & notice" : mathMasteryLabel(mathPractice)}</strong></div>
                <div className="math-quest-dots" aria-label={`${questSolved} of 5 questions solved in this quest`}>
                  {[0, 1, 2, 3, 4].map((index) => <i key={index} className={index < questSolved ? "done" : index === questSolved ? "current" : ""} />)}
                </div>
                <small>Level {mathQuestion.level} · New numbers and pictures each time</small>
              </div>
            )}
            <span>{adaptiveMath ? "YOUR FRESH CHALLENGE" : "YOUR TURN"}</span>
            <div className="question-head">
              <h4>{prompt}</h4>
              <SpeakButton
                id={`question-${mathQuestion?.id || lesson.id}`}
                label="Hear question"
                text={[
                  mathQuestion?.speakText || lesson.question,
                  `Your choices are: ${mathQuestion ? choices.map((option) => mathQuestion.choiceLabels[mathQuestion.choices.indexOf(option)]).join(", ") : lesson.choices.join(", ")}`,
                ]}
              />
            </div>
            <div className="answer-grid">
              {choices.map((option) => {
                const isChosen = choice === option;
                const className = isChosen ? (option === expectedAnswer ? "chosen correct" : "chosen incorrect") : "";
                return <button key={option} className={className} onClick={() => answer(option)} aria-pressed={isChosen} disabled={questionSolved} aria-label={mathQuestion ? mathQuestion.choiceLabels[mathQuestion.choices.indexOf(option)] : undefined}>{option}</button>;
              })}
            </div>
            {choice && (
              <div className={`answer-explanation ${correct ? "correct" : "try-again"}`} role="status">
                <strong>{correct ? (childAge <= 2 ? "You found it!" : "Yes—your reasoning works!") : (childAge <= 2 ? "Let’s look together." : "Good try. Let’s use a clue.")}</strong>
                <p>{correct ? (mathQuestion?.why || lesson.why) : (mathQuestion?.hint || guide.hint)}</p>
                {!correct && scoredAdaptiveMath && (mathPractice?.supportLevel || 0) >= 2 && (
                  <small className="math-support-note">Fifi made the clue more concrete. Take your time—this level will stay gentle until it feels comfortable.</small>
                )}
                <SpeakButton
                  id={`feedback-${mathQuestion?.id || lesson.id}-${correct ? "yes" : "no"}`}
                  label="Hear this"
                  text={[correct ? (childAge <= 2 ? "You found it!" : "Yes, your reasoning works.") : (childAge <= 2 ? "Let's look together." : "Good try. Let's use a clue."), correct ? (mathQuestion?.why || lesson.why) : (mathQuestion?.hint || guide.hint)]}
                />
                {!correct && <button onClick={() => setUnpacked(true)}>Show me another explanation</button>}
                {correct && adaptiveMath && (
                  <button className="next-math-question" onClick={nextMathQuestion}>
                    {questSolved >= 5 ? "Start another fresh quest" : "Try another question"} →
                  </button>
                )}
              </div>
            )}
          </article>

          {correct && (!adaptiveMath || questSolved >= 5) && (
            <article className="mentor-celebration">
              <span>🌱 MENTOR NOTE</span><p>{adaptiveMath ? (readiness.ready ? "You used several kinds of Math thinking across more than one quest. You’re ready for a new challenge—or you can keep practicing here." : "You finished a five-question quest at your own pace. Can you explain one strategy in your own words?") : "You learned this at your own pace. Can you explain it in your own words?"}</p>
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
