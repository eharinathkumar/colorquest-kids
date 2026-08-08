import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StorybookBoard, { narrationForStoryPage } from "./StorybookBoard";
import { getStoryBooks, STORY_COUNTS } from "./story-data";

vi.mock("./SpeechProvider", () => ({
  SpeakButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
  useAutoSpeak: vi.fn(),
}));

describe("young children's storybooks", () => {
  it("offers three distinct four-page books in each young age world", () => {
    expect(STORY_COUNTS).toEqual({ toddler: 3, earlyReader: 3, total: 6, pages: 24 });
    for (const age of [0, 1]) {
      const books = getStoryBooks(age);
      expect(books).toHaveLength(3);
      expect(new Set(books.map((book) => book.id)).size).toBe(3);
      expect(books.every((book) => book.pages.length === 4)).toBe(true);
      expect(books.every((book) => book.pages.every((page) => page.text && page.image.endsWith(".webp") && page.alt))).toBe(true);
      expect(books.every((book) => book.noticeWord && book.wordMeaning && book.talkAbout)).toBe(true);
    }
  });

  it("reads the title once instead of repeating it on every page", () => {
    const story = getStoryBooks(0)[0];
    expect(narrationForStoryPage(story, 0)).toEqual([story.title, story.pages[0].text]);
    expect(narrationForStoryPage(story, 1)).toBe(story.pages[1].text);
    expect(narrationForStoryPage(story, 1)).not.toContain(story.title);
  });

  it("turns illustrated pages and completes only at the end", async () => {
    const user = userEvent.setup();
    const complete = vi.fn();
    render(<StorybookBoard age={0} page={1} onSelectBook={() => undefined} onComplete={complete} />);

    expect(screen.getByRole("heading", { name: "Pip's Hiccuping Hat" })).toBeTruthy();
    expect(screen.getByAltText(/Tiny blue bird Pip/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /I finished this book/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Turn the page →" }));
    await user.click(screen.getByRole("button", { name: "Turn the page →" }));
    await user.click(screen.getByRole("button", { name: "Turn the page →" }));
    await user.click(screen.getByRole("button", { name: /I finished this book/ }));

    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("lets a child switch books from the shelf", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<StorybookBoard age={1} page={1} onSelectBook={select} onComplete={() => undefined} />);
    await user.click(screen.getByRole("button", { name: /The Very Polite Volcano/ }));
    expect(select).toHaveBeenCalledWith(2);
  });
});
