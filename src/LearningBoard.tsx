import { useState } from "react";
import { getLearningLesson, getLearningLessons, type Subject } from "./learning-data";

const AGE_LABELS = ["Ages 1–3", "Ages 4–6", "Ages 7–9", "Ages 10–12"];

export default function LearningBoard({
  subject,
  age,
  page,
  onComplete,
  onSelectLesson,
}: {
  subject: Subject;
  age: number;
  page: number;
  onComplete: () => void;
  onSelectLesson: (page: number) => void;
}) {
  const lesson = getLearningLesson(subject, age, page);
  const lessons = getLearningLessons(subject, age);
  const [choice, setChoice] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const correct = choice === lesson.answer;

  const answer = (nextChoice: string) => {
    setChoice(nextChoice);
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
        </div>
        <span className="lesson-position">Concept {page} of {lessons.length}</span>
      </div>

      <div className="lesson-layout">
        <section className="concept-column">
          <article className="big-idea-card">
            <span>THE BIG IDEA</span>
            <h4>{lesson.bigIdea}</h4>
            <p>{lesson.explanation}</p>
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
                return (
                  <button
                    key={option}
                    className={className}
                    onClick={() => answer(option)}
                    aria-pressed={isChosen}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {choice && (
              <div className={`answer-explanation ${correct ? "correct" : "try-again"}`} role="status">
                <strong>{correct ? "Yes—your reasoning works!" : "Not quite yet. Try another idea."}</strong>
                <p>{correct ? lesson.why : `Go back to the big idea: ${lesson.bigIdea}`}</p>
              </div>
            )}
          </article>

          <article className="word-lab">
            <span>WORD LAB</span>
            <div>
              {lesson.words.map(([word, meaning]) => (
                <p key={word}><strong>{word}</strong><small>{meaning}</small></p>
              ))}
            </div>
          </article>
        </section>
      </div>

      <section className="topic-map" aria-label={`${subject} concepts in this age group`}>
        <strong>Explore this {AGE_LABELS[age]} trail</strong>
        <div>
          {lessons.map((item, index) => (
            <button
              key={item.id}
              className={index + 1 === page ? "active" : ""}
              onClick={() => onSelectLesson(index + 1)}
              aria-label={`Open ${item.title}`}
            >
              <span>{item.icon}</span>{item.title}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
