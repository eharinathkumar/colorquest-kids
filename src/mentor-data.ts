import { getLearningLessons, type LearningLesson, type Subject } from "./learning-data";
import type { InterestKey, ProfileProgress } from "./profile-data";

export const INTERESTS: Record<InterestKey, { icon: string; label: string }> = {
  numbers: { icon: "🔢", label: "numbers" },
  patterns: { icon: "🧩", label: "patterns" },
  building: { icon: "🏗️", label: "building things" },
  animals: { icon: "🦋", label: "animals and life" },
  earth: { icon: "🌎", label: "Earth and weather" },
  space: { icon: "🚀", label: "space" },
  experiments: { icon: "🧪", label: "experiments" },
  stories: { icon: "📚", label: "stories" },
};

const lessonInterests: Record<string, InterestKey> = {
  "one-and-many": "numbers", "count-to-three": "numbers", "same-and-different": "patterns", "big-and-small": "building",
  "first-shapes": "building", "where-is-it": "building", "simple-patterns": "patterns", "more-and-fewer": "numbers",
  "count-to-twenty": "numbers", "number-order": "numbers", "addition-stories": "stories", "subtraction-stories": "stories",
  "flat-shapes": "building", "solid-shapes": "building", "halves-and-wholes": "numbers", "measure-with-objects": "building",
  "place-value": "numbers", "addition-strategies": "numbers", "multiplication-groups": "patterns", "division-sharing": "numbers",
  "fraction-size": "numbers", "perimeter-and-area": "building", "data-and-graphs": "patterns", "angles-and-turns": "building",
  "decimal-place-value": "numbers", "fraction-operations": "numbers", ratios: "patterns", percent: "numbers",
  "negative-numbers": "numbers", "expressions-and-order": "patterns", "variables-equations": "patterns", probability: "patterns",
  "five-senses": "animals", "living-things": "animals", "what-living-things-need": "animals", weather: "earth",
  "day-and-night": "space", "plants-grow": "animals", "push-and-pull": "experiments", "sink-or-float": "experiments",
  "life-cycles": "animals", "plant-parts": "animals", habitats: "animals", "states-of-matter": "experiments",
  "light-and-shadows": "experiments", "sound-vibrations": "experiments", "water-cycle": "earth", "solar-system": "space",
  cells: "animals", ecosystems: "animals", adaptations: "animals", "particles-and-matter": "experiments",
  "energy-transformations": "experiments", circuits: "building", "forces-and-motion": "building", "earth-systems": "earth",
  "atoms-and-elements": "experiments", "periodic-patterns": "patterns", "chemical-reactions": "experiments", "energy-transfer": "experiments",
  waves: "experiments", "newtons-laws": "building", "dna-and-inheritance": "animals", "deep-time-universe": "space",
};

export type LessonGuide = {
  path: string;
  interest: InterestKey;
  whyItMatters: string;
  anotherWay: string;
  hint: string;
  slides: Array<{ icon: string; label: string; text: string }>;
};

const pathFor = (subject: Subject, interest: InterestKey) => {
  if (subject === "math") {
    if (interest === "building") return "Shape Architect";
    if (interest === "patterns") return "Pattern Detective";
    if (interest === "stories") return "Story Problem Solver";
    return "Number Explorer";
  }
  if (interest === "animals") return "Living World Explorer";
  if (interest === "earth") return "Earth Watcher";
  if (interest === "space") return "Space Explorer";
  if (interest === "building") return "Force & Motion Engineer";
  return "Experiment Detective";
};

export function getLessonGuide(lesson: LearningLesson, subject: Subject, age: number): LessonGuide {
  const interest = lessonInterests[lesson.id] || (subject === "math" ? "numbers" : "experiments");
  const younger = age <= 1;
  const whyItMatters = subject === "math"
    ? younger
      ? "This helps you notice amounts, shapes, and patterns while you play."
      : "This is a thinking tool for measuring, designing, comparing, and solving real problems."
    : younger
      ? "This helps you look closely, ask questions, and explain what you notice."
      : "Scientists use this idea to build models, test predictions, and explain evidence."
  return {
    path: pathFor(subject, interest),
    interest,
    whyItMatters,
    anotherWay: younger
      ? `Let us slow it down. ${lesson.example} Say what you notice first. Then connect it to this idea: ${lesson.bigIdea}`
      : `Think like a detective: notice the evidence in the example, name the rule, then test whether that rule still works. ${lesson.example}`,
    hint: younger
      ? `Point to each choice. Which one best follows this clue: ${lesson.bigIdea}`
      : `Eliminate one choice at a time. Use the example as evidence and ask which choice agrees with the big idea.` ,
    slides: [
      { icon: "❓", label: "Wonder", text: lesson.bigIdea },
      { icon: "🔎", label: "Notice", text: lesson.explanation },
      { icon: lesson.icon, label: "Picture it", text: lesson.example },
      { icon: "🌟", label: "Use it", text: lesson.activity },
    ],
  };
}

export type MentorRecommendation = {
  subject: Subject;
  page: number;
  lesson: LearningLesson;
  path: string;
  interest: InterestKey;
  reason: string;
  completed: number;
  total: number;
};

export function getFavoriteInterest(progress: ProfileProgress): InterestKey | null {
  const entries = Object.entries(progress.learning.interestScores) as Array<[InterestKey, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[1] > 0 ? entries[0][0] : null;
}

export function getMentorRecommendations(age: number, progress: ProfileProgress): MentorRecommendation[] {
  return (["math", "science"] as Subject[]).map((subject) => {
    const lessons = getLearningLessons(subject, age);
    const completedKeys = new Set(progress.activities[subject].completed);
    const firstOpen = lessons.findIndex((_, index) => !completedKeys.has(`${age}:${index + 1}`));
    const page = firstOpen < 0 ? 1 : firstOpen + 1;
    const lesson = lessons[page - 1];
    const guide = getLessonGuide(lesson, subject, age);
    const favorite = getFavoriteInterest(progress);
    const likedReason = favorite === guide.interest
      ? `This connects with your interest in ${INTERESTS[guide.interest].label}.`
      : `This is the next small step on your ${guide.path} path.`;
    return {
      subject,
      page,
      lesson,
      path: guide.path,
      interest: guide.interest,
      reason: firstOpen < 0 ? "You finished this trail—revisit it and explain it in a new way." : likedReason,
      completed: progress.activities[subject].completed.filter((key) => key.startsWith(`${age}:`)).length,
      total: lessons.length,
    };
  });
}

export type CuratedResource = { title: string; provider: string; url: string; note: string; kind: "activity" | "video" | "simulation" };

export function getCuratedResource(subject: Subject, interest: InterestKey): CuratedResource {
  if (interest === "space") return { title: "Explore the Solar System", provider: "NASA Space Place", url: "https://spaceplace.nasa.gov/menu/solar-system/", note: "NASA games, crafts, pictures, and short explanations.", kind: "activity" };
  if (interest === "earth") return { title: "Weather and Earth Learning", provider: "NOAA Education", url: "https://www.nesdis.noaa.gov/about/k-12-education", note: "Official weather, satellite, ocean, and Earth resources.", kind: "video" };
  if (subject === "science") return { title: "Try a Science Simulation", provider: "PhET · University of Colorado Boulder", url: "https://phet.colorado.edu/en/simulations/filter?subjects=physics,chemistry,earth-science,biology&type=html", note: "Free, research-based simulations. A grown-up can help choose one.", kind: "simulation" };
  return { title: "Try a Math Simulation", provider: "PhET · University of Colorado Boulder", url: "https://phet.colorado.edu/en/simulations/filter?subjects=math&type=html", note: "Free visual math simulations for learning by trying.", kind: "simulation" };
}

export type BookSuggestion = { title: string; author: string; ages: string; interests: InterestKey[]; note: string };

const BOOKS: BookSuggestion[] = [
  { title: "Mouse Shapes", author: "Ellen Stoll Walsh", ages: "2–6", interests: ["building", "stories"], note: "A playful bridge from shapes to pictures." },
  { title: "Ten Black Dots", author: "Donald Crews", ages: "3–6", interests: ["numbers", "stories"], note: "Counting becomes visual imagination." },
  { title: "The Very Hungry Caterpillar", author: "Eric Carle", ages: "2–6", interests: ["animals", "stories"], note: "Counting, days, food, and a life cycle in one story." },
  { title: "Ada Twist, Scientist", author: "Andrea Beaty", ages: "4–8", interests: ["experiments", "stories"], note: "Celebrates questions, evidence, and persistence." },
  { title: "Rosie Revere, Engineer", author: "Andrea Beaty", ages: "4–8", interests: ["building", "stories"], note: "Shows that redesigning after failure is real engineering." },
  { title: "Math Curse", author: "Jon Scieszka and Lane Smith", ages: "7–10", interests: ["numbers", "patterns", "stories"], note: "Finds funny math problems hiding in an ordinary day." },
  { title: "The Magic School Bus Inside the Human Body", author: "Joanna Cole", ages: "6–10", interests: ["animals", "stories"], note: "A story-led introduction to body systems." },
  { title: "DK Knowledge Encyclopedia: Science!", author: "DK", ages: "8–12", interests: ["experiments", "earth", "animals"], note: "A highly visual reference for following new questions." },
  { title: "DK Knowledge Encyclopedia: Space!", author: "DK", ages: "8–12", interests: ["space"], note: "Detailed visuals for planets, stars, galaxies, and exploration." },
  { title: "Hidden Figures: Young Readers’ Edition", author: "Margot Lee Shetterly", ages: "9–12", interests: ["space", "numbers", "stories"], note: "Real mathematicians whose work helped spaceflight succeed." },
];

export function getBookSuggestions(age: number, favorite: InterestKey | null): BookSuggestion[] {
  const inAge = BOOKS.filter((book) => {
    const [min, max] = book.ages.split("–").map(Number);
    return age >= min - 1 && age <= max + 1;
  });
  return [...inAge].sort((a, b) => Number(Boolean(favorite && b.interests.includes(favorite))) - Number(Boolean(favorite && a.interests.includes(favorite)))).slice(0, 4);
}
