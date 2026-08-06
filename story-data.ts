export type StoryPage = {
  text: string;
  image: string;
  alt: string;
};

export type StoryBook = {
  id: string;
  title: string;
  emoji: string;
  ageWorld: 0 | 1;
  blurb: string;
  noticeWord: string;
  wordMeaning: string;
  talkAbout: string;
  pages: StoryPage[];
};

const toddlerStories: StoryBook[] = [
  {
    id: "pips-hat",
    title: "Pip's Hiccuping Hat",
    emoji: "🐦",
    ageWorld: 0,
    blurb: "A tiny bird, a giant hat, and one very bouncy hiccup.",
    noticeWord: "enormous",
    wordMeaning: "Enormous means very, very big.",
    talkAbout: "What else could Pip and Snail use the enormous hat for?",
    pages: [
      { text: "Pip found a hat. It was enormous. Pip was very small.", image: "stories/pips-hat-1.webp", alt: "Tiny blue bird Pip trying on an enormous yellow hat in a garden" },
      { text: "HIC! Up went the hat. “Oh, feathers!” chirped Pip. Ladybug blinked in surprise.", image: "stories/pips-hat-2.webp", alt: "Pip hiccupping as the yellow hat pops into the air beside a surprised ladybug" },
      { text: "HIC! The hat landed softly on Snail. “A hat-house!” said Snail.", image: "stories/pips-hat-3.webp", alt: "A smiling snail under the huge yellow hat while Pip giggles" },
      { text: "Pip and Snail snuggled underneath. HIC! They laughed and laughed.", image: "stories/pips-hat-4.webp", alt: "Pip and Snail laughing together underneath the enormous hat" },
    ],
  },
  {
    id: "moons-sock",
    title: "The Moon's Missing Sock",
    emoji: "🌙",
    ageWorld: 0,
    blurb: "Moon looks everywhere for one stripey bedtime sock.",
    noticeWord: "cozy",
    wordMeaning: "Cozy means warm, safe, and comfortable.",
    talkAbout: "What funny thing could Moon wear as a hat?",
    pages: [
      { text: "Moon was ready for bed. But one stripey sock was missing.", image: "stories/moons-sock-1.webp", alt: "A friendly moon in a purple nightcap searching a cloud bedroom for a striped sock" },
      { text: "Moon asked the stars. The stars twinkled and pointed down, down, down.", image: "stories/moons-sock-2.webp", alt: "Moon asking three smiling stars where the missing sock went" },
      { text: "On Earth, Giraffe wore the sock as the coziest scarf in the world.", image: "stories/moons-sock-3.webp", alt: "A sleepy giraffe wearing the giant striped sock as a cozy scarf" },
      { text: "Moon laughed. “Keep it!” Then Moon wore two fluffy clouds as slippers.", image: "stories/moons-sock-4.webp", alt: "Moon and Giraffe laughing while Moon wears two little clouds as slippers" },
    ],
  },
  {
    id: "turtles-fast-day",
    title: "Tiny Turtle's Fast Day",
    emoji: "🐢",
    ageWorld: 0,
    blurb: "Tuck Turtle races a red ball—and surprises himself.",
    noticeWord: "speedy",
    wordMeaning: "Speedy means moving quickly.",
    talkAbout: "Can you move like slow Tuck, then speedy Tuck?",
    pages: [
      { text: "Tuck Turtle challenged a red ball to a race. The ball said nothing. Balls are quiet.", image: "stories/turtles-fast-day-1.webp", alt: "Tiny turtle Tuck inviting a red ball to race beside a puddle" },
      { text: "Tuck rode a leaf down the little hill. “Wheee! I am speedy!”", image: "stories/turtles-fast-day-2.webp", alt: "Tuck happily zooming down a small hill on a large green leaf" },
      { text: "SPLASH! Duck's boots got a bath. “My boots love puddles,” Duck quacked.", image: "stories/turtles-fast-day-3.webp", alt: "Tuck splashing safely into a puddle beside a duck in rain boots" },
      { text: "Tuck crossed the daisy finish. The ball had not moved. Everyone laughed—even the ball, almost.", image: "stories/turtles-fast-day-4.webp", alt: "Tuck, Duck, and the red ball celebrating at a finish line made from daisies" },
    ],
  },
];

const earlyReaderStories: StoryBook[] = [
  {
    id: "banana-boots",
    title: "The Banana Boots Parade",
    emoji: "🍌",
    ageWorld: 1,
    blurb: "Nia turns a rainy afternoon into a kitchen-sized parade.",
    noticeWord: "parade",
    wordMeaning: "A parade is a group moving together for a celebration.",
    talkAbout: "Which safe household object would you turn into a pretend instrument?",
    pages: [
      { text: "Rain tapped the window. With a grown-up's help, Nia made two silly banana slippers from yellow cardboard.", image: "stories/banana-boots-1.webp", alt: "Nia admiring two cardboard banana cutouts beside her yellow rain boots" },
      { text: "Nia fastened the soft straps and shuffled carefully. “Welcome to the Banana Boots Parade!” she announced.", image: "stories/banana-boots-2.webp", alt: "Nia standing safely in handmade cardboard banana slippers while her cat watches" },
      { text: "Cat wore a colander hat. Wooden spoons tapped a beat. In Nia's imagination, every fruit joined the band.", image: "stories/banana-boots-3.webp", alt: "Nia and her cat leading a playful pretend kitchen parade with fruit characters" },
      { text: "After one final boom-tap-tap, Nia put the real fruit in its bowl and wore her rain boots. The whole kitchen bowed.", image: "stories/banana-boots-4.webp", alt: "Nia placing bananas in a fruit bowl after the parade while her cat and fruit friends bow" },
    ],
  },
  {
    id: "polite-volcano",
    title: "The Very Polite Volcano",
    emoji: "🌋",
    ageWorld: 1,
    blurb: "Vee Volcano has a tickle—and remembers to warn the picnic.",
    noticeWord: "warning",
    wordMeaning: "A warning tells someone about something before it happens.",
    talkAbout: "How did Vee help the birds feel safe before the big puff?",
    pages: [
      { text: "Vee Volcano felt a tickle deep inside. Puff… puff… PUFF! The picnic birds looked up.", image: "stories/polite-volcano-1.webp", alt: "A friendly purple volcano holding in a tickly puff while birds picnic nearby" },
      { text: "“Excuse me,” said Vee. “I may need to puff.” The birds thanked Vee for the warning and moved their blanket back.", image: "stories/polite-volcano-2.webp", alt: "Vee politely warning three birds as they carry their picnic a safe distance away" },
      { text: "FOOF! Vee burst out—not lava, but a fountain of flower petals and soft steam.", image: "stories/polite-volcano-3.webp", alt: "The smiling pretend volcano releasing a magical fountain of colorful flower petals" },
      { text: "Petals covered the picnic. One bird opened a leaf umbrella. “Best warning ever!” everyone laughed.", image: "stories/polite-volcano-4.webp", alt: "Vee and the birds laughing together at a petal-covered picnic under a leaf umbrella" },
    ],
  },
  {
    id: "bubble-bus",
    title: "Dot and the Bubble Bus",
    emoji: "🫧",
    ageWorld: 1,
    blurb: "One enormous bubble becomes the silliest bus in the park.",
    noticeWord: "passenger",
    wordMeaning: "A passenger is someone riding in a vehicle.",
    talkAbout: "Where would your imaginary bubble bus travel?",
    pages: [
      { text: "Dot blew one tiny bubble, then one medium bubble, then the biggest bubble the park had ever seen.", image: "stories/bubble-bus-1.webp", alt: "Dot blowing an enormous shimmering soap bubble in a sunny park with her dog" },
      { text: "“All aboard!” Dot imagined. The bubble became a bus, and her dog took the driver's seat very seriously.", image: "stories/bubble-bus-2.webp", alt: "Dot and her fluffy dog riding inside a pretend iridescent bubble bus" },
      { text: "Three butterfly passengers climbed aboard with leaf-shaped parcels. The driver checked every imaginary ticket twice.", image: "stories/bubble-bus-3.webp", alt: "The dog driving the bubble bus while three butterfly passengers carry leaf parcels" },
      { text: "The bus landed softly. POP! It became a sparkling puddle. “Every bus needs a last stop,” Dot laughed.", image: "stories/bubble-bus-4.webp", alt: "Dot, her dog, and butterflies laughing after the bubble pops into sparkling drops" },
    ],
  },
];

export const STORY_COUNTS = {
  toddler: toddlerStories.length,
  earlyReader: earlyReaderStories.length,
  total: toddlerStories.length + earlyReaderStories.length,
  pages: [...toddlerStories, ...earlyReaderStories].reduce((total, story) => total + story.pages.length, 0),
} as const;

export function getStoryBooks(ageWorld: number): StoryBook[] {
  return ageWorld <= 0 ? toddlerStories : earlyReaderStories;
}

export function getStoryBook(ageWorld: number, page: number): StoryBook {
  const books = getStoryBooks(ageWorld);
  return books[(Math.max(1, Math.floor(page)) - 1) % books.length];
}
