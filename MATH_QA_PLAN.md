# ColorQuest Kids — Math Experience QA Plan

## Audit outcome

**Release recommendation: do not call the current Math trail adaptive or replayable.**

The existing lesson explanations are thoughtful, answer choices are large, read-aloud is available, and the current automated baseline passes (`42/42` targeted Math and app tests). The boredom report is nevertheless reproducible from the source:

- Every concept contains exactly one fixed `question`, one fixed set of three `choices`, and one fixed `answer` in `learning-data.ts`.
- Returning to a concept or reopening the app presents that exact question again.
- `LearningBoard.tsx` records a tap as an attempt, but it does not distinguish first-try correct, eventual correct, hints, or incorrect answers.
- A correct answer marks the concept complete, but does not produce another problem or advance a difficulty level.
- Progress stores completion by age-world and page. There is no per-skill level, mastery window, or recent-question history.
- The four broad age worlds create substantial within-band differences: a 4-year-old and 6-year-old share one trail; a 7-year-old and 9-year-old share one; a 10-year-old and 12-year-old share one.

## Priority findings

| Priority | Finding | Child impact | Required correction |
|---|---|---|---|
| Blocker | One fixed question per concept | A child can memorize all eight Ages 4–6 answers in minutes without practicing the concepts | Parameterized generators with stored recent-question history |
| Blocker | No mastery model | The app cannot know when a child “is getting it” | Record correctness, first-attempt result, help use, concept, and difficulty per question |
| High | No adaptive progression | Correct work never produces a harder problem; errors never trigger a gentler representation | Use a rolling mastery rule and scaffold/step-down behavior |
| High | Attempt count is misleading | Repeated taps and wrong taps all increase the same counter | Separate total attempts, first-try correct, eventual correct, and supported attempts |
| High | Age bands are too wide to set one fixed difficulty | Young children may meet a jump; older children may start bored | Choose a starter level from age, then adapt within the skill without changing profile age |
| High | Youngest visual choices are not intelligible in speech | Emoji-only answer options become empty when emoji are stripped for speech | Give every visual choice a spoken label such as “one star” |
| Medium | A correct answer does not offer an immediate next challenge | Flow ends just when motivation is highest | Show a large “Next challenge” action; automatically prepare a fresh variant |
| Medium | A completed concept can still be answered incorrectly afterward | Feedback can change to “try again” after the concept is already marked complete | Lock the solved question or generate a new one |
| Medium | Topic map allows unrestricted jumps with little guidance | Children can accidentally enter a concept far above current readiness | Keep free exploration, but clearly mark “Best next,” “Practice,” and “Challenge” |
| Medium | Dense secondary text is small on tablets | `11px` topic and vocabulary text can be difficult for early readers and some low-vision users | Use at least 14px effective text for essential child-facing content |

## Proposed adaptive behavior to test

### Unit of progress

Track mastery by **profile + math skill**, not merely by page. A skill state should contain at least:

- current difficulty level;
- the last 10 scored outcomes;
- first-attempt correctness;
- whether a hint/scaffold was used;
- recent question signatures, including parameters and representation;
- total independent correct, supported correct, and incorrect attempts;
- last-practiced time and mastered level.

Response speed must not be required for mastery. Reading, motor, attention, and accessibility differences make speed a poor default signal for children.

### Promotion and support rules

Recommended initial rule for the first release:

1. Start at the age-appropriate entry level, or at the last saved level for that profile and skill.
2. Promote one level after at least **5 first-attempt correct answers in the most recent 6**, with at least 3 consecutive independent correct answers at the end.
3. Never promote from one lucky answer.
4. After 2 consecutive incorrect first attempts, show a visual scaffold or simpler representation while keeping the same idea.
5. If 3 of the last 5 are incorrect, move down one level or enter a bridge level; do not label this as a demotion.
6. After promotion, give 2 bridge questions. If both are missed, return to supported practice at the prior level.
7. A hint-assisted correct answer counts as learning progress but not as an independent mastery answer.
8. Advancement within a concept should not silently unlock an unrelated concept. Show “You’re ready for…” and let the child continue or practice more.

## Child journey matrix

| Profile | Starting journey | Boredom/repetition check | Progression check | Accessibility and comprehension check |
|---|---|---|---|---|
| Age 3 | Count 1–3 objects using touchable pictures; then 1–5 after mastery | Ten consecutive counting challenges use different object counts, layouts, or objects, with no exact repeat | Five of six independent correct answers unlock a gentle 1–5 challenge; two errors trigger one-to-one pointing support | One short instruction at a time; every picture choice has a spoken label; targets at least 60px; no reading required |
| Age 6 | Missing-number, compare, addition and subtraction stories within 10; advance toward 20 | A five-minute run includes different numbers and at least three representations such as dots, ten-frame, number line, or story | Strong addition performance increases operand range before introducing regrouping; subtraction mastery is tracked separately | Narration reads numbers and answer labels; no emoji-only speech; hints demonstrate rather than reveal immediately |
| Age 8 | Place value, two-digit operations, arrays/multiplication, sharing/division, fractions and geometry | Reopening multiplication changes factors/context while preserving current level; recent facts are not repeated | Mastery of equal groups advances factor range/unknown position; it does not promote division merely because multiplication was mastered | Arrays and equations convey the same idea; question remains solvable at 200% zoom and tablet landscape/portrait |
| Age 11 | Fractions, ratios, percent, negatives, expressions, variables, probability and coordinates | Parameterized questions vary values, unknown position, and context without changing the mathematical objective | A 10-year-old can begin with a bridge level; a proficient 12-year-old reaches multi-step work without replaying elementary items | Generated fraction/ratio/equation problems always have valid, unambiguous solutions; narration speaks notation correctly |

## Generator correctness gates

Every question generator must accept an injectable seeded random source so tests are repeatable. Each generated challenge must expose a stable `signature` built from skill, level, representation, parameters, and answer—not from a timestamp.

For every generator and supported level:

- The correct answer appears exactly once.
- All answer choices are distinct after normalization.
- Distractors are plausible but mathematically false.
- The prompt, visual model, answer, explanation, and spoken text agree.
- Subtraction does not produce negative answers before the level explicitly teaches negatives.
- Division produces whole-number answers before remainder/fraction levels.
- Fractions use nonzero denominators and are generated from well-defined equal wholes.
- Equations have the advertised solution and no accidental second solution.
- Values remain within the level’s documented bounds.
- The generator terminates under worst-case recent-history constraints.

## Statistical non-repetition gates

Run these with fixed seeds in CI so failures are deterministic:

1. **Recent-history guarantee:** generate 100 questions per skill-level while storing the last 10 signatures. No signature may match any of the prior 10 when the variant space contains at least 11 valid questions.
2. **Cold-open freshness:** simulate 100 close/reopen cycles for one profile. At least 95 reopenings must differ from the immediately preceding challenge; the stronger preferred behavior is a guaranteed difference through saved history.
3. **Choice-position balance:** over 1,200 generated multiple-choice questions, the correct answer appears in each of the three positions between 30% and 37% of the time.
4. **Range coverage:** over 2,000 questions, every allowed operand bucket and every enabled representation appears. No bucket should fall below 70% or exceed 130% of its configured weight.
5. **Pair coverage:** for bounded fact sets such as multiplication, every configured pair appears at least once in a seeded run sized to 20 times the pair count.
6. **Context diversity:** in any 12-question session, at least 3 visual/story contexts appear when the skill supplies 3 or more contexts.
7. **Distractor quality:** over 10,000 generated questions, zero duplicate choices, zero missing correct answers, zero multiple-correct questions, and zero out-of-range results.

These checks measure meaningful variety. A different random ID attached to the same visible problem does not count as a new signature.

## Adaptive-level acceptance tests

| Test | Setup and actions | Pass condition |
|---|---|---|
| No lucky promotion | New Age 6 profile answers one question correctly | Level remains unchanged |
| Mastery promotion | Submit sequence `C,C,W,C,C,C,C` without hints | Promotion occurs only after the configured 5-of-6 window and final streak are satisfied |
| Hint is not independent mastery | Answer six correctly after opening a hint on each | Child receives encouragement, but independent-mastery threshold remains unmet |
| Gentle support | Submit two consecutive wrong first attempts | Same concept changes to a scaffolded representation; no shaming language appears |
| Step-down/bridge | Submit 3 wrong among the last 5 | Difficulty drops at most one level or enters a bridge level; concept and profile age remain unchanged |
| Promotion stability | Earn promotion, miss the next two bridge items | Return to supported prior-level practice without erasing earlier correct history |
| Strand isolation | Master Age 8 multiplication, then open fractions | Fraction level is unchanged unless its own evidence supports advancement |
| Age ceiling | Master the highest standard Age 6 level | Offer an optional challenge path; do not silently relabel the child as Ages 7–9 |
| Reload persistence | Earn partial progress, reload and reopen Math | Same skill level and rolling evidence persist; next question respects saved recent history |
| Offline equivalence | Complete the same journey with network disabled | Generation, scoring, adaptation, read-aloud fallback, and persistence still work |

## Profile-isolation and migration tests

1. Create Maya, age 6, and Leo, age 8.
2. Give Maya six successful addition outcomes to earn a promotion.
3. Switch to Leo. Confirm Leo’s addition begins from Leo’s age/readiness state, with no Maya mastery, recent signatures, streak, likes, or recommendations.
4. Give Leo repeated errors. Switch to Maya. Confirm Maya remains at her promoted level.
5. Close and reopen the app. Confirm both states persist independently.
6. Delete Leo. Confirm Maya’s state remains intact and no orphaned Leo state is selected.
7. Create a new profile also named Maya. Confirm identity is keyed by profile ID, not display name.
8. Change the first Maya’s age from 6 to 7. Preserve her skill evidence, apply the new age’s permitted level boundaries, and do not copy data into the second Maya.
9. Load a real version-3 profile created before adaptive math. Migration must create empty adaptive state without losing artwork, completed lessons, interests, location, or existing profile identity.
10. Corrupt one skill state in storage. The app should repair only that skill to a safe default, not erase the whole family.

## Accessibility release gates

- All actions work by touch and keyboard, with a visible focus indicator.
- Primary answer targets are at least 48×48 CSS pixels; Ages 1–6 target 60×60 where practical.
- Correct/incorrect status is conveyed by words and accessible status, not color alone.
- Read-aloud speaks prompt, relevant visual description, and each answer choice meaningfully.
- Tapping a selected answer twice cannot inflate scored attempts.
- A solved challenge cannot switch back to incorrect feedback; it is locked until “Try another” is chosen.
- Screen-reader order is prompt, visual description, choices, feedback, then next action.
- Generated content supports 200% text zoom without clipping, horizontal scrolling, or hidden buttons.
- Portrait and landscape tablet layouts keep the question and at least the first answer visible without an excessive scroll.
- Animation and celebration respect reduced-motion preferences.
- Difficulty changes are announced positively and do not use countdowns, lives, public scores, or shame.

## Minimum release test matrix

| Area | Unit/property | Component | Persistence | Manual child/tablet |
|---|---:|---:|---:|---:|
| Question generation | Required for every skill/level | Render prompt, model, choices, explanation | Recent signatures survive reload | 20-minute session per representative age |
| Scoring | First try, retry, hint, solved lock | Feedback and next button | Outcome log survives reload | Child cannot farm mastery by repeated taps |
| Adaptation | Promotion/support/bridge boundaries | Level-up and scaffold messaging | Level isolated per profile/skill | Observe whether challenge feels fair, not abrupt |
| Accessibility | Spoken text and semantic invariants | Keyboard, zoom, screen reader, reduced motion | Parent settings persist | Android tablet portrait and landscape |
| Profiles | Pure state transition tests | Switcher and resume journey | Two-profile isolation and v3 migration | Sibling handoff without state leakage |

## Definition of done for the first adaptive Math release

The Math release is ready only when:

- Counting, number order, addition, and subtraction have parameterized variants for Ages 1–6.
- At least the current core skills for Ages 7–9 and 10–12 are parameterized, or clearly labeled as single guided lessons rather than endless practice.
- The recent-history, generator-validity, adaptive, profile-isolation, offline, and migration suites pass.
- No representative child sees an exact question repeat inside a 10-question concept run when the variant space permits it.
- A child cannot level up from one answer or by repeatedly tapping choices.
- A child who struggles receives a visual/linguistic scaffold, while a child who demonstrates mastery reaches a harder level in the same session.
- A five-minute moderated session with an Age 6 child produces at least 8 fresh questions and no adult is needed to find the next challenge.
- Parent progress distinguishes “tried,” “learning with help,” and “independently mastered.”

## Suggested delivery order

1. Build the generation/scoring/adaptive engine behind feature flags.
2. Launch it first for Ages 4–6 counting, number order, addition, and subtraction—the reported boredom hotspot.
3. Validate with seeded automated tests and a short Age 6 play session.
4. Extend the same engine to Ages 1–3, then 7–9, then 10–12.
5. Replace page-based Math completion with skill-level progress only after version-3 data migration is proven safe.

