# ColorQuest Kids: adaptive math practice design

## Curriculum audit

The current math trail teaches useful ideas in a warm, concrete way, but each concept owns exactly one fixed `question`, one fixed set of three `choices`, and one fixed `answer`. Opening **Counting to 20**, for example, always asks what comes after 16. A child can memorize the screen instead of learning the concept. The app currently records how many times a lesson was attempted, but it does not know whether an attempt was correct on the first try, which representation was used, or whether the child is ready for a harder item.

The eight Ages 1–3 concepts and eight Ages 4–6 concepts are good *lesson headings*. They should remain as short teaching cards. Practice should become a separate adaptive layer that can create hundreds of valid items per heading.

Important developmental correction: ages 1–2 should primarily explore by tapping, moving, matching, and hearing number words. They should not be judged by a three-option quiz. Mastery tracking can begin gently around age 3, while still allowing free exploration.

## Child experience

Each concept should follow this short rhythm:

1. **See it:** one brief, narrated demonstration.
2. **Try it:** a 5-question mini-quest with different numbers, pictures, and situations.
3. **Get help:** after a miss, Fifi shows a concrete clue; the child tries again without penalty.
4. **Grow:** the next mini-quest becomes a little harder only after reliable first-try success.
5. **Choose:** repeat, continue to the next concept, or leave. There is no timer or forced streak.

A mini-quest should normally take 2–4 minutes. Questions should change on every new mini-quest, including after closing and reopening the app. The current question must remain stable during a re-render, screen rotation, narration, or accidental tap.

## Adaptive practice state

Store this locally inside each child profile, per skill. No account or server is needed.

```ts
type SkillProgress = {
  level: number;
  results: Array<{
    signature: string;
    representation: string;
    firstTryCorrect: boolean;
    helpUsed: boolean;
    sessionId: string;
  }>;
  recentSignatures: string[];
  status: "exploring" | "growing" | "ready";
};
```

Do not use total attempts as evidence of mastery. Record whether the **first answer** was correct. A second-try success is still celebrated, but it means the scaffold helped and should not cause a difficulty jump.

### Difficulty rules

- Begin at the exact-age starting point, not only the broad age world. A newly created age-4 profile and age-6 profile should not receive the same first range.
- Move up one level after at least 4 items when 3 of the last 4 were correct on the first try, the latest 2 were correct, and at least 2 representations were used.
- Mark a skill `ready` after 5 of the last 6 are first-try correct across at least 2 mini-quests and at least 3 representations.
- After 2 first-try misses in a row, keep the same concept but temporarily reduce the number range and switch to a concrete picture or ten-frame. Do not erase earned progress.
- A typical mini-quest should select about 70% current-level practice, 20% earlier review, and 10% gentle stretch. Do not include stretch items until the child has 3 successful current-level items. For ages 1–3, omit automatic stretch.
- Never jump more than one level at a time. A lucky guess must not unlock a whole topic.
- When a prerequisite is `ready`, offer the next concept, but keep repeat and free-choice access.

Use three child-facing states rather than grades or percentages: **Exploring**, **Growing**, and **Ready for a new challenge**.

## Anti-repetition rules

Every generated item needs a normalized signature, for example `count:objects:ladybugs:7` or `add:story:join:4+3`.

- Keep the most recent 40–50 signatures per skill in the profile.
- Generate up to 20 candidates and reject any signature in recent history.
- Do not repeat the same representation or story setting twice in a row.
- Do not put the correct answer in the same choice position more than twice in a row; shuffle choices after creating and validating them.
- Do not serve the same underlying number fact more than once in a 5-question mini-quest, even if the pictures differ.
- When the finite pool is exhausted, reuse the oldest fact with a different representation and context—not the immediately previous screen.
- Generate an item only when the mini-quest starts or the child taps **Next**. Never call randomness directly while rendering a component.
- Use an injectable seeded random function so generator tests are repeatable. Create a fresh browser seed for each mini-quest; do not use a predictable seed as a child identifier.

## Question model

```ts
type MathPracticeItem = {
  id: string;
  skillId: string;
  level: number;
  representation: "objects" | "ten-frame" | "number-line" | "story" | "symbols" | "shape" | "measurement";
  prompt: string;
  speakText: string;
  choices: string[];
  answer: string;
  hint: string;
  explanation: string;
  signature: string;
};
```

Dynamic narration must read `speakText` and the generated choices. Visual groups also need a plain-language accessible label such as “seven ladybugs.” Do not rely on color alone, and do not use emoji size differences for measurement questions because emoji rendering varies by device.

## Ages 1–3: playful foundations

For ages 1–2, replace scored multiple choice with “tap the one,” “give Fifi one,” matching, and drag/play interactions. For age 3, use two large choices initially and introduce three choices only after success.

| Skill family | Starting range | Variations | Scaffold |
|---|---:|---|---|
| One and many | 1 versus 2–4 | toys, animals, flowers; hear “one”/“many” | Pulse each object once while counting aloud |
| Count objects | age 2: 1–2; age 3: 1–3, then 1–5 | line, scattered group, sound-and-tap | Move counted objects into a tray |
| Same and different | 2 choices | shape, size, pattern; compare one feature at a time | Name the feature: “Look at the shape” |
| Big and small | clear 2:1 size contrast | two objects, order three objects for age 3 | Outline the space each object takes |
| First shapes | circle, square, triangle | match shape, find a real object, build from sides | Trace the edge and count sides |
| Position | above, below, beside | place Fifi relative to a box, tree, or moon | Animate the reference object and repeat the word |
| AB patterns | 2-unit repeats | pictures, sounds, movement | Bracket the repeating unit |
| More and fewer | 1–3, then 1–5 | matched rows, small scattered groups | Pair objects one-to-one |

Avoid dense text, teen numbers, hidden tricks, countdowns, and abstract symbols for this group.

## Ages 4–6: number sense and early operations

Exact-age entry points:

- **Age 4:** quantities 0–5; compare and compose within 5.
- **Age 5:** quantities 0–10; add/subtract within 5, growing toward 10.
- **Age 6:** quantities 0–20; add/subtract within 10, growing toward 20; count on from numbers other than 1.

### Counting and number order

| Level | Variable range | Question families | Representations |
|---|---:|---|---|
| 1 | 0–5 | count; match numeral to quantity; one more | objects, fingers, five-frame |
| 2 | 0–10 | count scattered objects; before/after; compare two quantities | objects, ten-frame, short number line |
| 3 | 0–20 | count on from 6–15; missing number; between; one/two more or fewer | double ten-frame, number path, story |
| 4 | 0–50 in friendly sections | cross a decade; count by tens to 100; order 3 numbers | number line, bundles of ten, numerals |

For a six-year-old, a 5-item counting mini-quest could be: count 8 butterflies; fill a ten-frame for 6; choose the number after 13; place 17 between 16 and 18; start at 9 and count three more steps. This assesses one connected idea without repeating one screen.

### Addition and subtraction

| Level | Range | Question families | Scaffold |
|---|---:|---|---|
| 1 | totals within 5 | join, take away, missing part with pictures | physically animate objects joining/leaving |
| 2 | totals within 10 | count on/back; compare; make 5 or 10 | five/ten-frame and number path |
| 3 | totals within 20, no forced timed recall | doubles, near doubles, make 10, missing addend | split into 10 and extras |
| 4 | within 20 mixed stories | join, separate, part-part-whole, compare | child chooses drawing, objects, or number line |

Stories must match the operation. “Three frogs are on a log and two more join” represents addition. “Seven ducks; three swim away” represents subtraction. Use diverse names and neutral interests; never imply that one kind of child is naturally better at math.

### Shapes, fractions, and measurement

- **2D shapes:** identify by sides/corners; rotate and resize shapes; sort by a stated rule. Do not teach that a diamond is a separate geometric class from a rotated square.
- **3D shapes:** identify sphere, cube, cone, cylinder and rectangular prism from features; predict roll/stack/slide. Use drawn shapes, not only familiar objects that may be ambiguous.
- **Whole and half:** choose two equal shares; build a whole from halves; distinguish equal from unequal pieces. Vary orientation and shape.
- **Measurement:** compare directly, then measure with identical nonstandard units. Render units with no gaps or overlaps. Never compare images that were resized inconsistently by the browser.

## Ages 7–9: operations and mathematical models

Generate within skill-controlled ranges rather than storing fixed equations:

- Place value to 1,000 then 10,000: expanded form, compose/decompose, compare, number-line placement.
- Addition/subtraction: 2-digit then 3-digit, first without and then with regrouping; estimation and error analysis.
- Multiplication/division: equal groups, arrays, area model, fact families, and story situations; 2s/5s/10s before mixed facts.
- Fractions/decimals: visual models, equivalence, compare using common benchmarks, tenths/hundredths tied to grids and money.
- Geometry/measurement: perimeter, area, angles, unit conversions using reasonable whole-number values.
- Data: generate small picture graphs, bar graphs, and tables; ask both reading and reasoning questions.

Require more than naked calculation: at least one of every five items should ask which model, explanation, or estimate makes sense.

## Ages 10–12: reasoning before speed

- Whole-number and decimal operations with estimation checks.
- Fraction operations built from visual meaning before algorithms.
- Ratios, unit rates, percentages, and scale in maps, recipes, sports, art, and science contexts.
- Expressions and equations: unknown boxes, balance models, one-step then two-step equations.
- Geometry: coordinate plane, angle relationships, area, surface area, and volume.
- Data/probability: samples, distributions, mean/median, simple probability, and misleading-graph discussions.

At this age, offer open-response “How do you know?” prompts alongside generated choices. Accept equivalent forms where appropriate (`0.5`, `1/2`, and `50%`) instead of matching only one string.

## Distractor and wording quality rules

- Create the correct answer first, then plausible near distractors such as off-by-one or a likely operation error.
- Validate that every choice is unique, within the taught number range, and unambiguously wrong except for the intended answer.
- Never allow a negative answer until negative numbers are taught.
- Use grammatically consistent choices; one choice should not stand out by length, units, capitalization, or punctuation.
- Use `0` deliberately as a quantity, not as a trick.
- Avoid “obviously,” “easy,” “you should know,” “wrong,” and “beat the clock.”
- First miss: “Good try. Let’s look at it another way.”
- Second miss: “Let’s build it together.” Show the model and allow a fresh item at the same level.
- Success: praise the strategy—“You counted each one once”—rather than identity—“You’re a genius.”
- Read-aloud must speak mathematical notation naturally: `8 − 3` becomes “eight take away three,” not “eight dash three.”

## Recommended first implementation slice

Do not attempt every math skill in the first code pass. Prove the adaptive engine with the complaint that revealed the problem.

1. Add generator interfaces, seeded RNG, signature history, and first-try result tracking.
2. Replace the fixed practice question for **One and many**, **Count to three**, **Counting to 20**, and **Put numbers in order**.
3. Pass the child’s exact age and profile ID into the practice engine.
4. Add 5-question mini-quests, stable current-item state, dynamic narration, hints, and next-item controls.
5. Add level changes and the `Exploring/Growing/Ready` indicator.
6. After tests and a six-year-old playtest, extend the same framework to addition and subtraction, then shapes, fractions, and measurement.

## Acceptance tests for the first slice

- A six-year-old receives no duplicate signature in one 5-question mini-quest.
- Starting 10 mini-quests produces at least 8 distinct first questions for each implemented skill.
- Reloading or reopening starts a different item and does not use one of the 10 most recent signatures when alternatives exist.
- Screen rotation or a React re-render does not change the current item.
- Correct choices appear in all answer positions over seeded test runs and never more than twice consecutively in a live quest.
- Distractors are unique, nonnegative, in range, and do not duplicate the correct answer.
- Three of four first-try successes across two representations move up exactly one level.
- Two first-try misses trigger a scaffold but do not erase the child’s previous level.
- A second-try correct answer is celebrated but does not count as first-try mastery evidence.
- Ages 1–2 can explore without a scored quiz or a visible failure state.
- Every generated visual has equivalent speak text and an accessible label.
- All progression remains local to the selected profile and survives closing the app.

## Pedagogical review after launch

The most useful quality signal is not minutes spent. Review whether children voluntarily start another mini-quest, whether they use hints, whether misses cluster around one representation, and whether a level change leads to frustration. Keep this information on-device and summarize it for parents as concepts practiced and helpful representations, not rankings, comparative scores, or behavioral judgments.
