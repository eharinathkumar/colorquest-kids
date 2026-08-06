/**
 * Helpers for surfacing "a wealth of non-repetitive content" — letting a child
 * jump to something they have not finished yet, instead of only paging forward
 * one item at a time. Built entirely from the completion data the app already
 * tracks on-device (`ProfileProgress.activities[key].completed`), so there is
 * no new state, no network, and nothing leaves the device.
 *
 * Completion is stored as `${ageWorld}:${page}` keys (see `recordCompletion`),
 * so these helpers read that same shape.
 */

/** Every page in 1..total that the child has not completed in this age world. */
export function unseenPages(total: number, completed: string[], ageWorld: number): number[] {
  const done = new Set(completed);
  const pages: number[] = [];
  for (let page = 1; page <= total; page += 1) {
    if (!done.has(`${ageWorld}:${page}`)) pages.push(page);
  }
  return pages;
}

/** True when this exact page has never been completed — used for a "new to you" cue. */
export function isNewToChild(page: number, completed: string[], ageWorld: number): boolean {
  return !completed.includes(`${ageWorld}:${page}`);
}

/**
 * Pick a page the child has not finished yet, avoiding the current one.
 * Deterministic given `seed` (pass `Date.now()` at runtime; a fixed value in
 * tests) so behavior is reproducible. Falls back gracefully:
 *  - if some pages are unseen, choose among those;
 *  - if everything is seen, advance to the next page (wrapping) so the button
 *    still does something friendly rather than nothing.
 */
export function pickUnseenPage(
  total: number,
  completed: string[],
  ageWorld: number,
  current: number,
  seed: number,
): number {
  if (total <= 1) return current;
  const candidates = unseenPages(total, completed, ageWorld).filter((page) => page !== current);
  if (candidates.length > 0) {
    const index = Math.abs(Math.floor(seed)) % candidates.length;
    return candidates[index];
  }
  // Everything is done: just move somewhere other than where we are.
  return (current % total) + 1;
}
