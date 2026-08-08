import type { LearningLesson } from "./learning-data";
import { emptyProgress, type FamilyData, type MathPracticeOutcome, type MathPracticeState } from "./profile-data";

export type MathRepresentation = "objects" | "number-line" | "story" | "symbols" | "shape" | "pattern";

export type AdaptiveMathQuestion = {
  id: string;
  lessonId: string;
  prompt: string;
  choices: [string, string, string];
  answer: string;
  why: string;
  hint: string;
  level: number;
  representation: MathRepresentation;
  speakText: string;
  choiceLabels: [string, string, string];
};

export const MATH_MAX_LEVEL = 5;
const RECENT_QUESTION_LIMIT = 48;

export function starterMathLevel(childAge: number) {
  if (childAge <= 4) return 1;
  if (childAge === 5) return 2;
  if (childAge === 6) return 3;
  if (childAge === 7 || childAge === 10) return 2;
  if (childAge === 8 || childAge === 11) return 3;
  return 4;
}

export function emptyMathPracticeState(): MathPracticeState {
  return {
    level: 1,
    sequence: 0,
    attempts: 0,
    correct: 0,
    firstTryStreak: 0,
    struggleStreak: 0,
    currentMistakes: 0,
    recentQuestionIds: [],
    recentResults: [],
    consecutiveFirstTryMisses: 0,
    supportLevel: 0,
    recentOutcomes: [],
  };
}

function safeState(state?: Partial<MathPracticeState>): MathPracticeState {
  return {
    ...emptyMathPracticeState(),
    ...state,
    level: Math.max(1, Math.min(MATH_MAX_LEVEL, Math.round(state?.level || 1))),
    recentQuestionIds: Array.isArray(state?.recentQuestionIds) ? state.recentQuestionIds.slice(0, RECENT_QUESTION_LIMIT) : [],
    recentResults: Array.isArray(state?.recentResults) ? state.recentResults.slice(-8) : [],
    recentOutcomes: Array.isArray(state?.recentOutcomes) ? state.recentOutcomes.slice(-12) : [],
  };
}

function hash(text: string) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function randomFor(seed: string) {
  let value = hash(seed) || 1;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function int(random: () => number, min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

function shuffle<T>(random: () => number, values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function numericChoices(random: () => number, answer: number, spread = 2): [string, string, string] {
  const values = new Set([answer]);
  const offsets = shuffle(random, [-spread, -1, 1, spread, 2, -2]);
  for (const offset of offsets) {
    if (answer + offset >= 0) values.add(answer + offset);
    if (values.size === 3) break;
  }
  while (values.size < 3) values.add(answer + values.size);
  return shuffle(random, [...values].map(String)) as [string, string, string];
}

function make(
  lessonId: string,
  level: number,
  prompt: string,
  choices: [string, string, string],
  answer: string,
  why: string,
  hint: string,
  representation: MathRepresentation = "symbols",
): Omit<AdaptiveMathQuestion, "id"> {
  return {
    lessonId,
    level,
    prompt,
    choices,
    answer,
    why,
    hint,
    representation,
    speakText: speakable(prompt),
    choiceLabels: choices.map(accessibleChoiceLabel) as [string, string, string],
  };
}

const COUNT_ICONS = ["⭐", "🐞", "🍓", "🐥", "⚽", "🫐", "🌼", "🚀"];

const SPOKEN_ICONS: Record<string, string> = {
  "⭐": "star", "🐞": "ladybug", "🍓": "strawberry", "🐥": "chick", "⚽": "ball", "🫐": "berry", "🌼": "flower", "🚀": "rocket",
  "🔴": "red circle", "🔵": "blue circle", "🌙": "moon", "☀️": "sun", "🍃": "leaf", "☁️": "cloud", "🟡": "yellow circle", "🟩": "green square",
  "🐟": "fish", "🐸": "frog", "●": "small circle", "⬤": "medium circle", "⚫": "large circle", "■": "square", "▲": "triangle",
};

function speakable(text: string) {
  let result = text;
  for (const [icon, word] of Object.entries(SPOKEN_ICONS)) result = result.split(icon).join(` ${word} `);
  return result.replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/−/g, " minus ").replace(/\s+/g, " ").trim();
}

function accessibleChoiceLabel(choice: string) {
  const icon = Object.keys(SPOKEN_ICONS).find((item) => choice.includes(item));
  if (!icon) return speakable(choice);
  const count = choice.split(icon).length - 1;
  const noun = SPOKEN_ICONS[icon];
  return count > 1 ? `${count} ${noun}${noun.endsWith("s") ? "" : "s"}` : speakable(choice);
}

function buildQuestion(lesson: LearningLesson, level: number, childAge: number, random: () => number) {
  const icon = COUNT_ICONS[int(random, 0, COUNT_ICONS.length - 1)];
  const maxSmall = Math.min(10, 3 + level * 2);
  const a = int(random, 1, maxSmall);
  const b = int(random, 1, maxSmall);

  switch (lesson.id) {
    case "one-and-many": {
      const manyA = int(random, 2, Math.min(6, 2 + level));
      const manyB = Math.min(7, manyA + 1);
      const answer = icon;
      return make(lesson.id, level, `Which group has exactly one ${icon}?`, shuffle(random, [answer, icon.repeat(manyA), icon.repeat(manyB)]) as [string, string, string], answer, "One means a single thing.", "Touch each group. Stop when you touch just one.");
    }
    case "count-to-three": {
      const count = int(random, 1, Math.min(3 + Math.floor(level / 2), 5));
      return make(lesson.id, level, `How many do you see? ${icon.repeat(count)}`, numericChoices(random, count, 1), String(count), `There ${count === 1 ? "is" : "are"} ${count}. Touch each one once as you count.`, "Point and say one number for each picture.");
    }
    case "same-and-different": {
      const sets = [["🟡", "🔵", "🟩"], ["⭐", "🌙", "☀️"], ["🐟", "🐸", "🐞"]];
      const set = sets[int(random, 0, sets.length - 1)];
      const answer = set[int(random, 0, 2)];
      return make(lesson.id, level, `Which one is the same as ${answer}?`, shuffle(random, set) as [string, string, string], answer, `Both pictures are ${answer}.`, "Look at the color and shape, then find its twin.");
    }
    case "big-and-small": {
      // Pair the visual with words so this never depends on platform-specific
      // glyph sizing (especially important on Android tablets).
      const sizes: [string, string, string] = ["● Small circle", "⬤ Medium circle", "⚫ Large circle"];
      const askBig = random() > 0.5;
      const answer = askBig ? "⚫ Large circle" : "● Small circle";
      return make(lesson.id, level, `Which circle is ${askBig ? "biggest" : "smallest"}?`, shuffle(random, sizes) as [string, string, string], answer, `It takes up the ${askBig ? "most" : "least"} space.`, "Compare how much space each circle covers.");
    }
    case "first-shapes":
    case "flat-shapes": {
      const shapes = [
        { choice: "● Circle", clue: "no straight sides and no corners" },
        { choice: "■ Square", clue: "four equal sides and four corners" },
        { choice: "▲ Triangle", clue: "three straight sides and three corners" },
      ];
      const target = shapes[int(random, 0, 2)];
      return make(lesson.id, level, `Which shape has ${target.clue}?`, shuffle(random, shapes.map((item) => item.choice)) as [string, string, string], target.choice, `${target.choice.slice(2)} has ${target.clue}.`, "Count the straight sides and corners.");
    }
    case "where-is-it": {
      const above = random() > 0.5;
      const top = above ? icon : "☁️";
      const bottom = above ? "☁️" : icon;
      const answer = above ? "above" : "below";
      return make(lesson.id, level, `The ${icon} is ___ the cloud:\n${top}\n${bottom}`, shuffle(random, ["above", "below", "beside"]) as [string, string, string], answer, `The ${icon} is ${answer} the cloud.`, "Above is higher. Below is lower.");
    }
    case "simple-patterns": {
      const pairs = [["🔴", "🔵"], ["🌼", "🍃"], ["⭐", "🌙"]];
      const [first, second] = pairs[int(random, 0, pairs.length - 1)];
      const useAab = level >= 3 && random() > 0.5;
      const shown = useAab ? `${first} ${first} ${second} ${first} ${first} ${second}` : `${first} ${second} ${first} ${second}`;
      const answer = first;
      const distractor = COUNT_ICONS.find((item) => item !== first && item !== second) || "🟢";
      return make(lesson.id, level, `What comes next? ${shown} ___`, shuffle(random, [first, second, distractor]) as [string, string, string], answer, `The repeating part is ${useAab ? `${first} ${first} ${second}` : `${first} ${second}`}.`, "Say the pattern aloud, then start the repeating part again.");
    }
    case "more-and-fewer": {
      const counts = shuffle(random, [a, a + 1, a + 2]);
      const askMore = random() > 0.35;
      const target = askMore ? Math.max(...counts) : Math.min(...counts);
      const choices = counts.map((count) => icon.repeat(count)) as [string, string, string];
      return make(lesson.id, level, `Which group has ${askMore ? "more" : "fewer"}?`, choices, icon.repeat(target), `${target} is the ${askMore ? "greatest" : "smallest"} number in these groups.`, "Match the pictures one-to-one or count each group.");
    }
    case "count-to-twenty": {
      const ageCeiling = childAge <= 4 ? 10 : childAge === 5 ? 15 : 20;
      const upper = Math.min(ageCeiling, 6 + level * 3);
      const number = int(random, 1, upper - 1);
      const useObjects = random() > 0.5;
      if (useObjects) {
        const count = int(random, 2, upper);
        const choices = numericChoices(random, count, 2);
        return make(lesson.id, level, `How many do you see? ${icon.repeat(count)}`, choices, String(count), `There are ${count}. Touch each picture once.`, "Point and say one number for every picture.", "objects");
      }
      const before = level >= 2 && random() > 0.5;
      const answer = before ? number - 1 : number + 1;
      return make(lesson.id, level, `What number comes ${before ? "before" : "after"} ${number}?`, numericChoices(random, answer, 2), String(answer), `Count ${before ? "back" : "forward"} one from ${number}.`, `Say the nearby numbers: ${Math.max(0, number - 1)}, ${number}, ${number + 1}.`, "number-line");
    }
    case "number-order": {
      const upper = Math.min(childAge <= 4 ? 10 : childAge === 5 ? 15 : 20, 7 + level * 3);
      const number = int(random, 2, upper - 1);
      if (random() > 0.5) {
        return make(lesson.id, level, `Which number belongs between ${number - 1} and ${number + 1}?`, numericChoices(random, number, 2), String(number), `The counting order is ${number - 1}, ${number}, ${number + 1}.`, "Count forward one step from the first number.", "number-line");
      }
      const trio = shuffle(random, [number - 1, number, number + 1]);
      const askLeast = random() > 0.5;
      const answer = askLeast ? Math.min(...trio) : Math.max(...trio);
      return make(lesson.id, level, `Look at these number cards: ${trio.join(", ")}. Which is ${askLeast ? "least" : "greatest"}?`, trio.map(String) as [string, string, string], String(answer), `${answer} is the ${askLeast ? "smallest" : "largest"} number.`, "Picture the cards placed from left to right on a number line.", "symbols");
    }
    case "addition-stories":
    case "addition-strategies": {
      const ageLimit = childAge <= 4 ? 8 : childAge === 5 ? 12 : childAge === 6 ? 20 : 50;
      const limit = Math.min(ageLimit, level <= 2 ? 10 : level <= 4 ? 20 : 50);
      const first = int(random, 1, Math.max(2, Math.floor(limit * 0.6)));
      const second = int(random, 1, Math.max(2, limit - first));
      const total = first + second;
      const things = ["crayons", "shells", "stickers", "blocks"][int(random, 0, 3)];
      const representation: MathRepresentation = random() < 0.34 ? "story" : random() < 0.6 ? "objects" : "symbols";
      const prompt = representation === "story"
        ? `You have ${first} ${things} and get ${second} more. How many altogether?`
        : representation === "objects"
          ? `${icon.repeat(first)} plus ${icon.repeat(second)}. How many altogether?`
          : `What is ${first} + ${second}?`;
      return make(lesson.id, level, prompt, numericChoices(random, total, Math.max(2, second)), String(total), `${first} + ${second} = ${total}.`, `Start at ${first} and count on ${second} more.`, representation);
    }
    case "subtraction-stories": {
      const ageLimit = childAge <= 4 ? 8 : childAge === 5 ? 12 : childAge === 6 ? 20 : 30;
      const total = int(random, 3, Math.min(ageLimit, level <= 2 ? 10 : 10 + level * 4));
      const leave = int(random, 1, total - 1);
      const remain = total - leave;
      const things = ["ducks", "balloons", "apples", "robots"][int(random, 0, 3)];
      const representation: MathRepresentation = random() < 0.5 ? "story" : "number-line";
      const prompt = representation === "story" ? `There are ${total} ${things}. ${leave} leave. How many remain?` : `Start at ${total}. Move ${leave} steps left on a number line. Where do you land?`;
      return make(lesson.id, level, prompt, numericChoices(random, remain, Math.max(2, leave)), String(remain), `${total} − ${leave} = ${remain}.`, `Start with ${total} and count back ${leave}.`, representation);
    }
    case "solid-shapes": {
      const solids = [
        { choice: "sphere", clue: "rolls smoothly in every direction" },
        { choice: "cube", clue: "has six square faces" },
        { choice: "cylinder", clue: "has two flat circles and one curved surface" },
      ];
      const target = solids[int(random, 0, 2)];
      return make(lesson.id, level, `Which solid ${target.clue}?`, shuffle(random, solids.map((item) => item.choice)) as [string, string, string], target.choice, `A ${target.choice} ${target.clue}.`, "Picture a ball, a box, and a can.");
    }
    case "halves-and-wholes": {
      const count = 2 * int(random, 1, Math.min(5, level + 1));
      const half = count / 2;
      return make(lesson.id, level, `Share ${count} berries equally between two friends. How many does each friend get?`, numericChoices(random, half, 2), String(half), `Two equal groups of ${half} make ${count}.`, "Deal one berry to each friend, back and forth.");
    }
    case "measure-with-objects": {
      const length = int(random, 3, 5 + level * 2);
      return make(lesson.id, level, `A pencil is as long as ${length} blocks in a row. How many blocks long is it?`, numericChoices(random, length, 2), String(length), `The pencil measures ${length} blocks long.`, "Count every block once from one end to the other.");
    }
    case "place-value":
    case "decimal-place-value": {
      if (lesson.id === "decimal-place-value") {
        let tenths = int(random, 1, 9);
        while (tenths === 4) tenths = int(random, 1, 9);
        let hundredths = int(random, 1, 9);
        while (hundredths === 4 || hundredths === tenths) hundredths = int(random, 1, 9);
        const answer = String(hundredths);
        return make(lesson.id, level, `In 4.${tenths}${hundredths}, which digit is in the hundredths place?`, shuffle(random, ["4", String(tenths), answer]) as [string, string, string], answer, `${answer} is two places to the right of the decimal point.`, "Tenths is first after the decimal; hundredths is second.");
      }
      const hundreds = int(random, 1, 9);
      const tens = int(random, 1, 9);
      const ones = int(random, 0, 9);
      const value = hundreds * 100 + tens * 10 + ones;
      const answer = String(tens * 10);
      return make(lesson.id, level, `What is the value of the ${tens} in ${value}?`, shuffle(random, [String(tens), answer, String(tens * 100)]) as [string, string, string], answer, `${tens} tens equals ${answer}.`, "The digit is in the tens place, so count groups of ten.");
    }
    case "multiplication-groups": {
      const groups = int(random, 2, Math.min(10, 3 + level));
      const each = int(random, 2, Math.min(10, 3 + level));
      const total = groups * each;
      return make(lesson.id, level, `${groups} equal groups have ${each} in each group. How many altogether?`, numericChoices(random, total, Math.max(2, each)), String(total), `${groups} × ${each} = ${total}.`, `Add ${each}, ${groups} times.`);
    }
    case "multiply-break-apart": {
      const groups = int(random, 3, Math.min(10, 4 + level));
      const easyPart = 5;
      const extra = int(random, 1, Math.min(4, level));
      const each = easyPart + extra;
      const total = groups * each;
      const answer = `(${groups} × ${easyPart}) + (${groups} × ${extra}) = ${total}`;
      const choices = shuffle(random, [
        answer,
        `(${groups} × ${easyPart}) + ${extra} = ${groups * easyPart + extra}`,
        `${groups} + ${each} = ${groups + each}`,
      ]) as [string, string, string];
      return make(lesson.id, level, `Which split correctly finds ${groups} × ${each}?`, choices, answer, `${each} is ${easyPart} + ${extra}, so both parts still have ${groups} equal groups.`, `Break ${each} into ${easyPart} and ${extra}, then multiply both parts by ${groups}.`, "symbols");
    }
    case "division-sharing":
    case "division-fact-families": {
      const groups = int(random, 2, Math.min(10, 3 + level));
      const each = int(random, 2, Math.min(10, 3 + level));
      const total = groups * each;
      return make(lesson.id, level, `${total} objects are shared equally into ${groups} groups. How many are in each group?`, numericChoices(random, each, 2), String(each), `${total} ÷ ${groups} = ${each}.`, `Deal one to every group until all ${total} are shared.`);
    }
    case "perimeter-and-area": {
      const width = int(random, 2, 3 + level);
      const height = int(random, 2, 3 + level);
      const area = width * height;
      return make(lesson.id, level, `A rectangle is ${width} units wide and ${height} units tall. What is its area?`, numericChoices(random, area, width + height), String(area), `${width} rows of ${height} unit squares cover ${area} square units.`, "Area counts the squares inside: multiply width by height.");
    }
    case "fraction-size": {
      const denominator = [4, 6, 8, 10][int(random, 0, Math.min(3, level - 1))];
      const first = int(random, 1, denominator - 2);
      const second = int(random, first + 1, denominator - 1);
      const answer = `${second}/${denominator}`;
      return make(lesson.id, level, `Which fraction is greater?`, shuffle(random, [`${first}/${denominator}`, answer, `0/${denominator}`]) as [string, string, string], answer, `With equal-size pieces, ${second} pieces are more than ${first}.`, "The denominators match, so compare the top numbers.");
    }
    case "fraction-operations": {
      const denominator = [4, 5, 6, 8, 10][int(random, 0, Math.min(4, level))];
      const first = int(random, 1, Math.max(1, denominator - 3));
      const second = int(random, 1, denominator - first - 1);
      const numerator = first + second;
      const answer = `${numerator}/${denominator}`;
      const choices = shuffle(random, [answer, `${numerator}/${denominator * 2}`, `${Math.max(1, numerator - 1)}/${denominator}`]) as [string, string, string];
      return make(lesson.id, level, `What is ${first}/${denominator} + ${second}/${denominator}?`, choices, answer, `The pieces are all ${denominator}ths, so add ${first} + ${second} to get ${answer}.`, "The denominators match. Keep the piece size and add the top numbers.", "symbols");
    }
    case "data-and-graphs": {
      const first = int(random, 6, 12 + level * 3);
      const second = int(random, 2, first - 1);
      const askDifference = random() > 0.35;
      const answer = askDifference ? first - second : first + second;
      return make(lesson.id, level, `A picture graph shows ${first} votes for apples and ${second} votes for pears. How many ${askDifference ? "more apple votes than pear votes" : "votes altogether"}?`, numericChoices(random, answer, Math.max(2, second)), String(answer), askDifference ? `${first} − ${second} = ${answer}.` : `${first} + ${second} = ${answer}.`, `Use the labels first, then ${askDifference ? "subtract the smaller bar from the larger bar" : "combine both bars"}.`, "symbols");
    }
    case "decimal-tenths-hundredths": {
      const tenths = int(random, 1, 9);
      const answer = `0.${tenths}`;
      const choices = shuffle(random, [answer, `0.0${tenths}`, `${tenths}.0`]) as [string, string, string];
      return make(lesson.id, level, `A strip is divided into 10 equal parts. ${tenths} parts are shaded. Which decimal shows the shaded part?`, choices, answer, `${tenths} of 10 equal parts is ${tenths} tenths, written ${answer}.`, "Ten equal parts are tenths. Put the shaded count in the tenths place.", "symbols");
    }
    case "measurement-conversions": {
      const metres = int(random, 1, 4 + level);
      const centimetres = metres * 100;
      const answer = `${centimetres} cm`;
      const choices = shuffle(random, [answer, `${metres * 10} cm`, `${metres * 1000} cm`]) as [string, string, string];
      return make(lesson.id, level, `A garden path is ${metres} ${metres === 1 ? "meter" : "meters"} long. How many centimeters is that?`, choices, answer, `${metres} × 100 = ${centimetres} centimeters.`, "Each meter has 100 centimeters. Count one group of 100 for every meter.", "symbols");
    }
    case "ratios": {
      const first = int(random, 2, 3 + level);
      const second = int(random, first + 1, first + 4);
      const factor = int(random, 2, 4);
      const answer = `${first * factor}:${second * factor}`;
      const choices = shuffle(random, [answer, `${first * factor}:${second * factor + 1}`, `${first + factor}:${second + factor}`]) as [string, string, string];
      return make(lesson.id, level, `Which ratio is equivalent to ${first}:${second}?`, choices, answer, `Multiply both terms by ${factor}: ${first}:${second} becomes ${answer}.`, "Equivalent ratios scale both terms by the same number.", "symbols");
    }
    case "percent": {
      const percents = [10, 20, 25, 50];
      const percent = percents[int(random, 0, Math.min(percents.length - 1, Math.max(1, level - 1)))];
      const unit = percent === 25 ? 4 : percent === 20 ? 5 : percent === 10 ? 10 : 2;
      const multiplier = int(random, 2, 4 + level);
      const whole = unit * multiplier * 2;
      const answer = (whole * percent) / 100;
      return make(lesson.id, level, `What is ${percent}% of ${whole}?`, numericChoices(random, answer, Math.max(2, multiplier)), String(answer), `${percent}% of ${whole} is ${answer}.`, `Find 10%, 25%, or 50% first, then scale that friendly part.`, "symbols");
    }
    case "angles-and-turns": {
      const targets = [
        { answer: "90°", clue: "a quarter turn" },
        { answer: "180°", clue: "a half turn" },
        { answer: "360°", clue: "one full turn" },
      ];
      const target = targets[int(random, 0, 2)];
      return make(lesson.id, level, `How many degrees are in ${target.clue}?`, shuffle(random, ["90°", "180°", "360°"]) as [string, string, string], target.answer, `${target.clue[0].toUpperCase()}${target.clue.slice(1)} is ${target.answer}.`, "Imagine turning around a clock face.");
    }
    case "negative-numbers": {
      const start = int(random, -5, 5);
      const change = int(random, 1, 3 + level);
      const answer = start - change;
      return make(lesson.id, level, `Start at ${start} on a number line and move ${change} steps left. Where do you land?`, numericChoices(random, answer, change), String(answer), `Moving left ${change} from ${start} lands on ${answer}.`, "Count one number for each step to the left.");
    }
    case "expressions-and-order": {
      const x = int(random, 2, 5 + level);
      const y = int(random, 2, 5 + level);
      const z = int(random, 1, 5);
      const answer = x + y * z;
      return make(lesson.id, level, `What is ${x} + ${y} × ${z}?`, numericChoices(random, answer, x + y), String(answer), `Multiply first: ${y} × ${z} = ${y * z}; then add ${x} to get ${answer}.`, "Multiplication happens before addition.");
    }
    case "variables-equations": {
      const x = int(random, 2, 5 + level * 2);
      if (random() > 0.5) {
        const add = int(random, 1, 5 + level);
        const total = x + add;
        return make(lesson.id, level, `Solve: x + ${add} = ${total}. What is x?`, numericChoices(random, x, add), String(x), `Subtract ${add} from both sides: x = ${x}.`, `Ask: what plus ${add} makes ${total}?`);
      }
      const factor = int(random, 2, 3 + level);
      const total = factor * x;
      return make(lesson.id, level, `Solve: ${factor}x = ${total}. What is x?`, numericChoices(random, x, factor), String(x), `Divide both sides by ${factor}: x = ${x}.`, `Ask how many equal groups of ${factor} make ${total}.`);
    }
    case "probability": {
      const blue = int(random, 1, 3 + level);
      let green = int(random, 1, 3 + level);
      if (green === blue) green = green === 3 + level ? Math.max(1, green - 1) : green + 1;
      const total = blue + green;
      const answer = `${blue}/${total}`;
      const choices = shuffle(random, [answer, `${green}/${total}`, `${blue}/${green}`]) as [string, string, string];
      return make(lesson.id, level, `A bag has ${blue} blue and ${green} green tokens. What is the probability of choosing blue?`, choices, answer, `${blue} of the ${total} equally likely tokens are blue.`, "Probability is favorable outcomes over all possible outcomes.", "symbols");
    }
    case "coordinate-plane": {
      const x = int(random, 0, 4 + level);
      const y = int(random, 0, 4 + level);
      const move = int(random, 1, 2 + level);
      const moveRight = random() > 0.5;
      const answer = moveRight ? `(${x + move}, ${y})` : `(${x}, ${y + move})`;
      const choices = shuffle(random, [answer, moveRight ? `(${x}, ${y + move})` : `(${x + move}, ${y})`, `(${x}, ${y})`]) as [string, string, string];
      return make(lesson.id, level, `A rover starts at (${x}, ${y}) and moves ${move} units ${moveRight ? "right" : "up"}. Where does it stop?`, choices, answer, `${moveRight ? "Right changes x while y stays the same" : "Up changes y while x stays the same"}, so the rover reaches ${answer}.`, "The first coordinate moves left or right. The second moves down or up.", "number-line");
    }
    case "growing-number-patterns": {
      const growth = int(random, 2, 3 + level);
      const offset = int(random, 0, 4);
      const terms = [1, 2, 3, 4].map((n) => growth * n + offset);
      const answer = `${growth}n${offset ? ` + ${offset}` : ""}`;
      const choices = shuffle(random, [answer, `${growth + 1}n${offset ? ` + ${offset}` : ""}`, `n + ${growth + offset}`]) as [string, string, string];
      return make(lesson.id, level, `The pattern is ${terms.join(", ")}. Which rule gives the value at step n?`, choices, answer, `The pattern grows by ${growth}; testing n = 1 gives ${terms[0]}.`, "Find the amount added each step, then test the first term in the rule.", "pattern");
    }
    case "unit-rates": {
      const rateA = int(random, 2, 4 + level);
      let rateB = int(random, 2, 4 + level);
      if (rateB === rateA) rateB += 1;
      const hoursA = int(random, 2, 5);
      const hoursB = int(random, 2, 5);
      const distanceA = rateA * hoursA;
      const distanceB = rateB * hoursB;
      const answer = rateA > rateB ? "Team Comet" : "Team Moon";
      return make(lesson.id, level, `Team Comet travels ${distanceA} km in ${hoursA} hours. Team Moon travels ${distanceB} km in ${hoursB} hours. Which has the greater unit rate?`, shuffle(random, ["Team Comet", "Team Moon", "They are equal"]) as [string, string, string], answer, `Comet travels ${rateA} km per hour and Moon travels ${rateB} km per hour.`, "Divide each distance by its time so both rates describe one hour.", "story");
    }
    case "two-step-equations": {
      const x = int(random, 2, 4 + level * 2);
      const factor = int(random, 2, 3 + level);
      const bonus = int(random, 1, 5 + level);
      const total = factor * x + bonus;
      return make(lesson.id, level, `Solve: ${factor}x + ${bonus} = ${total}. What is x?`, numericChoices(random, x, factor), String(x), `Subtract ${bonus}, then divide by ${factor}: x = ${x}.`, `Undo the + ${bonus} first. Then undo multiplication by ${factor}.`, "symbols");
    }
    default: {
      // Untemplated concepts still get a stable varied answer order. This
      // preserves the carefully written curriculum while templates expand.
      return make(lesson.id, level, lesson.question, shuffle(random, [...lesson.choices]) as [string, string, string], lesson.answer, lesson.why, "Use the lesson's big idea and try one choice at a time.");
    }
  }
}

/**
 * Produces a stable question for this practice sequence. A new sequence or
 * session seed gives variety; recent fingerprints are skipped when possible.
 */
export function generateAdaptiveMathQuestion({
  profileId,
  childAge,
  lesson,
  state,
  sessionSeed = "session",
}: {
  profileId: string;
  childAge: number;
  lesson: LearningLesson;
  state?: Partial<MathPracticeState>;
  sessionSeed?: string | number;
}): AdaptiveMathQuestion {
  const practice = state ? safeState(state) : { ...emptyMathPracticeState(), level: starterMathLevel(childAge) };
  // Support changes the next representation/range without erasing the level
  // the child already earned. Two independent successes remove this bridge.
  const questionLevel = practice.supportLevel >= 2 ? Math.max(1, practice.level - 1) : practice.level;
  const recentIds = new Set([
    ...practice.recentQuestionIds,
    ...practice.recentOutcomes.map((item) => item.questionId),
  ]);
  let candidate: Omit<AdaptiveMathQuestion, "id">;
  let id = "";
  for (let salt = 0; salt < 24; salt += 1) {
    const seed = `${profileId}|age-${childAge}|${lesson.id}|${questionLevel}|${practice.sequence}|${sessionSeed}|${salt}`;
    candidate = buildQuestion(lesson, questionLevel, childAge, randomFor(seed));
    id = `${lesson.id}:${hash(`${candidate.prompt}|${candidate.answer}`).toString(36)}`;
    if (!recentIds.has(id) || salt === 23) return { ...candidate, id };
  }
  // The loop always returns, but TypeScript cannot infer that from the limit.
  candidate = buildQuestion(lesson, questionLevel, childAge, randomFor(`${profileId}|fallback`));
  id = `${lesson.id}:${hash(`${candidate.prompt}|${candidate.answer}`).toString(36)}`;
  return { ...candidate, id };
}

export type MathAnswerContext = {
  lessonId: string;
  representation: MathRepresentation;
  sessionId: string;
  childAge: number;
};

function outcomeFor(questionId: string, firstTry: boolean, context: MathAnswerContext): MathPracticeOutcome {
  return { questionId, lessonId: context.lessonId, representation: context.representation, firstTry, sessionId: context.sessionId };
}

function shouldPromote(outcomes: MathPracticeOutcome[]) {
  const window = outcomes.slice(-4);
  return window.length === 4
    && window.filter((item) => item.firstTry).length >= 3
    && window.slice(-2).every((item) => item.firstTry)
    && new Set(window.map((item) => item.representation)).size >= 2;
}

/** Records one answer tap while counting each question only once for mastery. */
export function applyMathAnswer(
  previous: Partial<MathPracticeState> | undefined,
  questionId: string,
  correct: boolean,
  context: MathAnswerContext,
): MathPracticeState {
  const state = previous ? safeState(previous) : { ...emptyMathPracticeState(), level: starterMathLevel(context.childAge) };
  const sameQuestion = state.currentQuestionId === questionId;
  const mistakes = sameQuestion ? state.currentMistakes : 0;

  if (!correct) {
    const nextMistakes = mistakes + 1;
    // A first miss is enough to offer scaffolding, but repeated taps on the
    // same question must not make the child look less capable.
    const firstMissForQuestion = !sameQuestion;
    const outcomes = firstMissForQuestion
      ? [...state.recentOutcomes, outcomeFor(questionId, false, context)].slice(-12)
      : state.recentOutcomes;
    const misses = firstMissForQuestion ? state.consecutiveFirstTryMisses + 1 : state.consecutiveFirstTryMisses;
    const largerStruggleWindow = outcomes.slice(-6);
    const stepDown = largerStruggleWindow.length === 6
      && largerStruggleWindow.filter((item) => item.firstTry).length <= 1
      && state.level > starterMathLevel(context.childAge);
    return {
      ...state,
      level: stepDown ? state.level - 1 : state.level,
      attempts: state.attempts + 1,
      firstTryStreak: 0,
      struggleStreak: misses,
      consecutiveFirstTryMisses: stepDown ? 0 : misses,
      supportLevel: misses >= 2 ? 2 : 1,
      currentQuestionId: questionId,
      currentMistakes: nextMistakes,
      recentResults: outcomes.map((item) => item.firstTry).slice(-8),
      recentOutcomes: outcomes,
    };
  }

  const firstTry = mistakes === 0;
  const outcomes = firstTry
    ? [...state.recentOutcomes, outcomeFor(questionId, true, context)].slice(-12)
    : state.recentOutcomes;
  const firstTryStreak = firstTry ? state.firstTryStreak + 1 : 0;
  const levelUp = shouldPromote(outcomes) && state.level < MATH_MAX_LEVEL;
  const latestTwoCorrect = outcomes.slice(-2).length === 2 && outcomes.slice(-2).every((item) => item.firstTry);
  return {
    ...state,
    level: levelUp ? state.level + 1 : state.level,
    sequence: state.sequence + 1,
    attempts: state.attempts + 1,
    correct: state.correct + 1,
    firstTryStreak: levelUp ? 0 : firstTryStreak,
    struggleStreak: firstTry ? 0 : state.struggleStreak,
    consecutiveFirstTryMisses: firstTry ? 0 : state.consecutiveFirstTryMisses,
    supportLevel: latestTwoCorrect ? 0 : state.supportLevel,
    currentQuestionId: undefined,
    currentMistakes: 0,
    recentQuestionIds: [questionId, ...state.recentQuestionIds.filter((id) => id !== questionId)].slice(0, RECENT_QUESTION_LIMIT),
    recentResults: outcomes.map((item) => item.firstTry).slice(-8),
    recentOutcomes: outcomes,
  };
}

export function recordAdaptiveMathAnswer(
  data: FamilyData,
  profileId: string,
  lessonId: string,
  questionId: string,
  correct: boolean,
  context: Omit<MathAnswerContext, "lessonId">,
): FamilyData {
  const progress = data.progress[profileId] || emptyProgress();
  const learning = progress.learning;
  const previous = learning.mathPractice?.[lessonId];
  const next = applyMathAnswer(previous, questionId, correct, { ...context, lessonId });
  const newestOutcome = next.recentOutcomes[next.recentOutcomes.length - 1];
  const addedOutcome = newestOutcome && !(previous?.recentOutcomes || []).some((item) => item.questionId === newestOutcome.questionId)
    ? newestOutcome
    : null;
  const mathJourney = addedOutcome
    ? [...(learning.mathJourney || []).filter((item) => item.questionId !== addedOutcome.questionId), addedOutcome].slice(-30)
    : learning.mathJourney || [];
  return {
    ...data,
    progress: {
      ...data.progress,
      [profileId]: {
        ...progress,
        learning: {
          ...learning,
          mathPractice: { ...(learning.mathPractice || {}), [lessonId]: next },
          mathJourney,
        },
      },
    },
  };
}

export function evaluateMathReadiness(outcomes: MathPracticeOutcome[]) {
  const window = outcomes.slice(-6);
  const ready = window.length === 6
    && window.filter((item) => item.firstTry).length >= 5
    && new Set(window.map((item) => item.sessionId)).size >= 2
    && new Set(window.map((item) => item.representation)).size >= 3;
  return {
    ready,
    successes: window.filter((item) => item.firstTry).length,
    quests: new Set(window.map((item) => item.sessionId)).size,
    representations: new Set(window.map((item) => item.representation)).size,
  };
}

export function mathMasteryLabel(state?: Partial<MathPracticeState>) {
  const practice = safeState(state);
  if (practice.recentOutcomes.length < 4) return "Exploring";
  if (practice.recentOutcomes.slice(-6).filter((item) => item.firstTry).length >= 5) return "Ready for a new challenge";
  return "Growing";
}
