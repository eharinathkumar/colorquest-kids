import { useEffect, useMemo, useState } from "react";
import { SpeakButton, useAutoSpeak } from "./SpeechProvider";
import { getStoryBook, getStoryBooks } from "./story-data";
import type { StoryBook } from "./story-data";
import "./StorybookBoard.css";

/** Speak the book title once, then keep later page narration inside the story. */
export function narrationForStoryPage(story: StoryBook, storyPage: number) {
  const current = story.pages[storyPage];
  return storyPage === 0 ? [story.title, current.text] : current.text;
}

export default function StorybookBoard({
  age,
  page,
  onSelectBook,
  onComplete,
}: {
  age: number;
  page: number;
  onSelectBook: (page: number) => void;
  onComplete: () => void;
}) {
  const books = getStoryBooks(age);
  const story = getStoryBook(age, page);
  const [storyPage, setStoryPage] = useState(0);
  const current = story.pages[storyPage];
  const fullStory = useMemo(() => [story.title, ...story.pages.map((item) => item.text)], [story]);

  useEffect(() => setStoryPage(0), [story.id]);
  useAutoSpeak(narrationForStoryPage(story, storyPage), `story:${story.id}:${storyPage}`);

  const next = () => setStoryPage((currentPage) => Math.min(story.pages.length - 1, currentPage + 1));
  const previous = () => setStoryPage((currentPage) => Math.max(0, currentPage - 1));
  const lastPage = storyPage === story.pages.length - 1;

  return (
    <section className="storybook-board" aria-labelledby="storybook-title">
      <div className="storybook-shelf" aria-label="Storybook shelf">
        {books.map((book, index) => (
          <button
            type="button"
            key={book.id}
            className={book.id === story.id ? "active" : ""}
            onClick={() => onSelectBook(index + 1)}
            aria-pressed={book.id === story.id}
          >
            <img src={`${import.meta.env.BASE_URL}${book.pages[0].image}`} alt="" />
            <span><strong>{book.emoji} {book.title}</strong><small>{book.blurb}</small></span>
          </button>
        ))}
      </div>

      <article className="storybook-reader">
        <header>
          <div>
            <p className="storybook-kicker">Picture story · {storyPage + 1} of {story.pages.length}</p>
            <h3 id="storybook-title">{story.title}</h3>
          </div>
          <SpeakButton id={`story-full-${story.id}`} text={fullStory} label="Read whole story" />
        </header>

        <div className="storybook-spread" key={`${story.id}-${storyPage}`}>
          <figure>
            <img src={`${import.meta.env.BASE_URL}${current.image}`} alt={current.alt} />
          </figure>
          <div className="storybook-copy">
            <span className="storybook-page-number" aria-hidden="true">{storyPage + 1}</span>
            <p>{current.text}</p>
            <SpeakButton id={`story-page-${story.id}-${storyPage}`} text={current.text} label="Hear this page" />
          </div>
        </div>

        <div className="storybook-page-dots" aria-label="Story pages">
          {story.pages.map((item, index) => (
            <button
              type="button"
              key={item.image}
              className={index === storyPage ? "active" : ""}
              onClick={() => setStoryPage(index)}
              aria-label={`Go to story page ${index + 1}`}
              aria-current={index === storyPage ? "page" : undefined}
            >{index + 1}</button>
          ))}
        </div>

        <div className="storybook-controls">
          <button type="button" className="storybook-back" onClick={previous} disabled={storyPage === 0}>← Back</button>
          {!lastPage
            ? <button type="button" className="primary-button" onClick={next}>Turn the page →</button>
            : <button type="button" className="primary-button" onClick={onComplete}>I finished this book! 🌟</button>}
        </div>

        <div className="storybook-afterword">
          <div><span>💬</span><p><strong>Word to notice: {story.noticeWord}</strong>{story.wordMeaning}</p></div>
          <div><span>💭</span><p><strong>Talk or imagine</strong>{story.talkAbout}</p></div>
        </div>
      </article>
    </section>
  );
}
