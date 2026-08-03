export type PuzzlePair = { item: string; label: string; home: string; homeLabel: string };
export type SortItem = { id: string; icon: string; label: string; category: string };

export type PuzzleDefinition =
  | { kind: "match"; id: string; title: string; instruction: string; pairs: PuzzlePair[] }
  | { kind: "sort"; id: string; title: string; instruction: string; categories: [string, string]; items: SortItem[] }
  | { kind: "sequence"; id: string; title: string; instruction: string; steps: Array<{ icon: string; label: string }> }
  | { kind: "choice"; family: "pattern" | "odd" | "clue"; id: string; title: string; instruction: string; prompt: string; options: Array<{ icon: string; label: string }>; answer: string; explanation: string };

export const PUZZLE_FAMILIES = ["match", "sort", "sequence", "pattern", "odd", "clue"] as const;

/**
 * How far the generator is walked when taking stock of what actually exists.
 * This is a search bound, not a promise of content — see `getPuzzleDeck`.
 */
const MAX_GENERATED_PAGE = 400;

const PAIR_BANKS: PuzzlePair[][] = [
  [
    { item: "🐝", label: "bee", home: "🌼", homeLabel: "flower" },
    { item: "🐟", label: "fish", home: "🌊", homeLabel: "water" },
    { item: "🐦", label: "bird", home: "🪺", homeLabel: "nest" },
    { item: "🐒", label: "monkey", home: "🌴", homeLabel: "tree" },
    { item: "🐧", label: "penguin", home: "🧊", homeLabel: "ice" },
    { item: "🚂", label: "train", home: "🛤️", homeLabel: "track" },
    { item: "🔑", label: "key", home: "🔒", homeLabel: "lock" },
    { item: "🪥", label: "toothbrush", home: "🦷", homeLabel: "teeth" },
    { item: "🧤", label: "glove", home: "✋", homeLabel: "hand" },
    { item: "👟", label: "shoe", home: "🦶", homeLabel: "foot" },
    { item: "🛏️", label: "bed", home: "🌙", homeLabel: "bedtime" },
    { item: "🥄", label: "spoon", home: "🥣", homeLabel: "bowl" },
    { item: "🐶", label: "puppy", home: "🦴", homeLabel: "bone" },
    { item: "🐿️", label: "squirrel", home: "🌰", homeLabel: "acorn" },
    { item: "🖍️", label: "crayon", home: "📄", homeLabel: "paper" },
    { item: "🧩", label: "puzzle piece", home: "🖼️", homeLabel: "puzzle" },
    { item: "🌧️", label: "rain", home: "☂️", homeLabel: "umbrella" },
    { item: "☀️", label: "sun", home: "🕶️", homeLabel: "sunglasses" },
  ],
  [
    { item: "🐛", label: "caterpillar", home: "🦋", homeLabel: "butterfly" },
    { item: "🌰", label: "seed", home: "🌱", homeLabel: "sprout" },
    { item: "🧊", label: "ice", home: "💧", homeLabel: "melted water" },
    { item: "☁️", label: "cloud", home: "🌧️", homeLabel: "rain" },
    { item: "🔦", label: "flashlight", home: "👤", homeLabel: "shadow" },
    { item: "🧲", label: "magnet", home: "📎", homeLabel: "paper clip" },
    { item: "🥚", label: "egg", home: "🐣", homeLabel: "chick" },
    { item: "🐸", label: "frog", home: "🌿", homeLabel: "pond" },
    { item: "🐪", label: "camel", home: "🏜️", homeLabel: "desert" },
    { item: "🐻‍❄️", label: "polar bear", home: "❄️", homeLabel: "Arctic" },
    { item: "4", label: "four", home: "••••", homeLabel: "four dots" },
    { item: "▲", label: "triangle", home: "3️⃣", homeLabel: "three sides" },
    { item: "■", label: "square", home: "4️⃣", homeLabel: "four equal sides" },
    { item: "10", label: "ten", home: "5+5", homeLabel: "five plus five" },
    { item: "🌙", label: "Moon", home: "🌍", homeLabel: "orbits Earth" },
    { item: "🌍", label: "Earth", home: "☀️", homeLabel: "orbits Sun" },
    { item: "👂", label: "ear", home: "🎵", homeLabel: "sound" },
    { item: "👃", label: "nose", home: "🌹", homeLabel: "smell" },
  ],
  [
    { item: "🌿", label: "producer", home: "☀️", homeLabel: "captures sunlight" },
    { item: "🐇", label: "herbivore", home: "🌱", homeLabel: "eats plants" },
    { item: "🍄", label: "decomposer", home: "🍂", homeLabel: "breaks down remains" },
    { item: "💧", label: "evaporation", home: "☁️", homeLabel: "water enters air" },
    { item: "🧊", label: "solid", home: "📦", homeLabel: "keeps its shape" },
    { item: "🌫️", label: "gas", home: "🎈", homeLabel: "fills its container" },
    { item: "⚡", label: "current", home: "🔁", homeLabel: "complete circuit" },
    { item: "🧲", label: "magnetic force", home: "🧭", homeLabel: "moves compass" },
    { item: "24", label: "six times four", home: "6×4", homeLabel: "product" },
    { item: "5", label: "twenty divided by four", home: "20÷4", homeLabel: "quotient" },
    { item: "12", label: "rectangle area", home: "3×4", homeLabel: "square units" },
    { item: "3/4", label: "three fourths", home: "◼◼◼◻", homeLabel: "fraction model" },
    { item: "90°", label: "right angle", home: "⌜", homeLabel: "quarter turn" },
    { item: "🌋", label: "igneous rock", home: "🔥", homeLabel: "cooled magma" },
    { item: "🌙", label: "Moon", home: "🌊", homeLabel: "strong effect on tides" },
    { item: "🪐", label: "planet", home: "⭐", homeLabel: "orbits a star" },
    { item: "🔭", label: "telescope", home: "🌌", homeLabel: "collects distant light" },
    { item: "🫁", label: "lungs", home: "💨", homeLabel: "gas exchange" },
  ],
  [
    { item: "0.75", label: "decimal", home: "75%", homeLabel: "equivalent percent" },
    { item: "3:4", label: "ratio", home: "6:8", homeLabel: "equivalent ratio" },
    { item: "−4", label: "negative four", home: "🌡️", homeLabel: "four below zero" },
    { item: "x=7", label: "solution", home: "2x=14", homeLabel: "balanced equation" },
    { item: "12", label: "three squared plus three", home: "3²+3", homeLabel: "expression value" },
    { item: "1/6", label: "die probability", home: "🎲", homeLabel: "one chosen face" },
    { item: "⚛️", label: "element", home: "➕", homeLabel: "proton number" },
    { item: "🧬", label: "gene", home: "DNA", homeLabel: "information region" },
    { item: "🔥", label: "conduction", home: "🥄", homeLabel: "energy through contact" },
    { item: "〰️", label: "frequency", home: "Hz", homeLabel: "cycles per second" },
    { item: "F=ma", label: "Newton's second law", home: "🚀", homeLabel: "force and acceleration" },
    { item: "🌍", label: "plate tectonics", home: "🏔️", homeLabel: "builds mountains" },
    { item: "CO₂", label: "carbon dioxide", home: "🌡️", homeLabel: "greenhouse gas" },
    { item: "🔋", label: "chemical energy", home: "⚡", homeLabel: "battery output" },
    { item: "🌟", label: "fusion", home: "☀️", homeLabel: "powers stars" },
    { item: "ly", label: "light-year", home: "📏", homeLabel: "distance unit" },
    { item: "🧪", label: "reactant", home: "➡️", homeLabel: "starts a reaction" },
    { item: "🦠", label: "cell", home: "🔬", homeLabel: "unit of life" },
  ],
];

const SORT_SETS: Array<Array<{ title: string; categories: [string, string]; items: SortItem[] }>> = [
  [
    { title: "Living or nonliving?", categories: ["living", "nonliving"], items: [
      { id: "dog", icon: "🐶", label: "dog", category: "living" }, { id: "tree", icon: "🌳", label: "tree", category: "living" }, { id: "flower", icon: "🌷", label: "flower", category: "living" }, { id: "ant", icon: "🐜", label: "ant", category: "living" },
      { id: "rock", icon: "🪨", label: "rock", category: "nonliving" }, { id: "chair", icon: "🪑", label: "chair", category: "nonliving" }, { id: "ball", icon: "⚽", label: "ball", category: "nonliving" }, { id: "spoon", icon: "🥄", label: "spoon", category: "nonliving" },
    ]},
    { title: "Round or has corners?", categories: ["round", "has corners"], items: [
      { id: "ball", icon: "⚽", label: "ball", category: "round" }, { id: "orange", icon: "🍊", label: "orange", category: "round" }, { id: "wheel", icon: "⭕", label: "wheel", category: "round" }, { id: "bubble", icon: "🫧", label: "bubble", category: "round" },
      { id: "block", icon: "🧊", label: "block", category: "has corners" }, { id: "book", icon: "📕", label: "book", category: "has corners" }, { id: "gift", icon: "🎁", label: "gift", category: "has corners" }, { id: "sign", icon: "🔺", label: "triangle", category: "has corners" },
    ]},
    { title: "Animal or plant?", categories: ["animal", "plant"], items: [
      { id: "cat", icon: "🐱", label: "cat", category: "animal" }, { id: "bee", icon: "🐝", label: "bee", category: "animal" }, { id: "whale", icon: "🐋", label: "whale", category: "animal" }, { id: "bird", icon: "🐦", label: "bird", category: "animal" },
      { id: "cactus", icon: "🌵", label: "cactus", category: "plant" }, { id: "tree", icon: "🌲", label: "tree", category: "plant" }, { id: "flower", icon: "🌼", label: "flower", category: "plant" }, { id: "sprout", icon: "🌱", label: "sprout", category: "plant" },
    ]},
    { title: "Day sky or night sky?", categories: ["day", "night"], items: [
      { id: "sun", icon: "☀️", label: "Sun", category: "day" }, { id: "rainbow", icon: "🌈", label: "rainbow", category: "day" }, { id: "blue", icon: "🟦", label: "blue sky", category: "day" }, { id: "sunflower", icon: "🌻", label: "sunflower", category: "day" },
      { id: "moon", icon: "🌙", label: "Moon", category: "night" }, { id: "stars", icon: "✨", label: "stars", category: "night" }, { id: "owl", icon: "🦉", label: "owl", category: "night" }, { id: "telescope", icon: "🔭", label: "telescope", category: "night" },
    ]},
  ],
  [
    { title: "Solid or liquid?", categories: ["solid", "liquid"], items: [
      { id: "ice", icon: "🧊", label: "ice", category: "solid" }, { id: "rock", icon: "🪨", label: "rock", category: "solid" }, { id: "block", icon: "🧱", label: "brick", category: "solid" }, { id: "spoon", icon: "🥄", label: "spoon", category: "solid" },
      { id: "water", icon: "💧", label: "water", category: "liquid" }, { id: "milk", icon: "🥛", label: "milk", category: "liquid" }, { id: "soup", icon: "🥣", label: "soup", category: "liquid" }, { id: "juice", icon: "🧃", label: "juice", category: "liquid" },
    ]},
    { title: "Natural or built by people?", categories: ["natural", "built"], items: [
      { id: "mountain", icon: "🏔️", label: "mountain", category: "natural" }, { id: "river", icon: "🏞️", label: "river", category: "natural" }, { id: "tree", icon: "🌳", label: "tree", category: "natural" }, { id: "cloud", icon: "☁️", label: "cloud", category: "natural" },
      { id: "bridge", icon: "🌉", label: "bridge", category: "built" }, { id: "house", icon: "🏠", label: "house", category: "built" }, { id: "road", icon: "🛣️", label: "road", category: "built" }, { id: "train", icon: "🚆", label: "train", category: "built" },
    ]},
    { title: "Even or odd?", categories: ["even", "odd"], items: [
      { id: "2", icon: "2️⃣", label: "2", category: "even" }, { id: "4", icon: "4️⃣", label: "4", category: "even" }, { id: "6", icon: "6️⃣", label: "6", category: "even" }, { id: "8", icon: "8️⃣", label: "8", category: "even" },
      { id: "1", icon: "1️⃣", label: "1", category: "odd" }, { id: "3", icon: "3️⃣", label: "3", category: "odd" }, { id: "5", icon: "5️⃣", label: "5", category: "odd" }, { id: "7", icon: "7️⃣", label: "7", category: "odd" },
    ]},
    { title: "Push or pull?", categories: ["push", "pull"], items: [
      { id: "cart", icon: "🛒", label: "move cart away", category: "push" }, { id: "button", icon: "🔘", label: "press button", category: "push" }, { id: "ball", icon: "⚽", label: "roll ball away", category: "push" }, { id: "door", icon: "🚪", label: "close door away", category: "push" },
      { id: "wagon", icon: "🛞", label: "bring wagon", category: "pull" }, { id: "drawer", icon: "🗄️", label: "open drawer", category: "pull" }, { id: "rope", icon: "🪢", label: "tug rope", category: "pull" }, { id: "zip", icon: "🤐", label: "raise zipper", category: "pull" },
    ]},
  ],
  [
    { title: "Producer or consumer?", categories: ["producer", "consumer"], items: [
      { id: "grass", icon: "🌱", label: "grass", category: "producer" }, { id: "algae", icon: "🟢", label: "algae", category: "producer" }, { id: "oak", icon: "🌳", label: "oak tree", category: "producer" }, { id: "cactus", icon: "🌵", label: "cactus", category: "producer" },
      { id: "rabbit", icon: "🐇", label: "rabbit", category: "consumer" }, { id: "hawk", icon: "🦅", label: "hawk", category: "consumer" }, { id: "fish", icon: "🐟", label: "fish", category: "consumer" }, { id: "human", icon: "🧑", label: "human", category: "consumer" },
    ]},
    { title: "Physical or chemical change?", categories: ["physical", "chemical"], items: [
      { id: "melt", icon: "🧊", label: "ice melting", category: "physical" }, { id: "cut", icon: "✂️", label: "paper cut", category: "physical" }, { id: "dissolve", icon: "🥄", label: "sugar dissolving", category: "physical" }, { id: "crush", icon: "🥫", label: "can crushed", category: "physical" },
      { id: "rust", icon: "🔩", label: "iron rusting", category: "chemical" }, { id: "burn", icon: "🔥", label: "wood burning", category: "chemical" }, { id: "bake", icon: "🍞", label: "bread baking", category: "chemical" }, { id: "tarnish", icon: "🥄", label: "silver tarnishing", category: "chemical" },
    ]},
    { title: "Area or perimeter?", categories: ["area", "perimeter"], items: [
      { id: "paint", icon: "🎨", label: "paint a wall", category: "area" }, { id: "tile", icon: "◼️", label: "tile a floor", category: "area" }, { id: "grass", icon: "🌱", label: "cover a field", category: "area" }, { id: "paper", icon: "📄", label: "cover a poster", category: "area" },
      { id: "fence", icon: "🚧", label: "fence a yard", category: "perimeter" }, { id: "frame", icon: "🖼️", label: "frame a picture", category: "perimeter" }, { id: "border", icon: "🔲", label: "border a page", category: "perimeter" }, { id: "track", icon: "🏃", label: "lap around field", category: "perimeter" },
    ]},
    { title: "Renewable or nonrenewable?", categories: ["renewable", "nonrenewable"], items: [
      { id: "solar", icon: "☀️", label: "solar", category: "renewable" }, { id: "wind", icon: "🌬️", label: "wind", category: "renewable" }, { id: "water", icon: "💧", label: "flowing water", category: "renewable" }, { id: "geo", icon: "🌋", label: "geothermal", category: "renewable" },
      { id: "coal", icon: "🪨", label: "coal", category: "nonrenewable" }, { id: "oil", icon: "🛢️", label: "oil", category: "nonrenewable" }, { id: "gas", icon: "🔥", label: "natural gas", category: "nonrenewable" }, { id: "uranium", icon: "☢️", label: "uranium", category: "nonrenewable" },
    ]},
  ],
  [
    { title: "Scalar or vector?", categories: ["scalar", "vector"], items: [
      { id: "mass", icon: "⚖️", label: "mass", category: "scalar" }, { id: "temp", icon: "🌡️", label: "temperature", category: "scalar" }, { id: "time", icon: "⏱️", label: "time", category: "scalar" }, { id: "speed", icon: "🏎️", label: "speed", category: "scalar" },
      { id: "velocity", icon: "➡️", label: "velocity", category: "vector" }, { id: "force", icon: "💪", label: "force", category: "vector" }, { id: "accel", icon: "🚀", label: "acceleration", category: "vector" }, { id: "disp", icon: "🧭", label: "displacement", category: "vector" },
    ]},
    { title: "Element or compound?", categories: ["element", "compound"], items: [
      { id: "O", icon: "O", label: "oxygen", category: "element" }, { id: "Fe", icon: "Fe", label: "iron", category: "element" }, { id: "C", icon: "C", label: "carbon", category: "element" }, { id: "He", icon: "He", label: "helium", category: "element" },
      { id: "water", icon: "H₂O", label: "water", category: "compound" }, { id: "salt", icon: "NaCl", label: "salt", category: "compound" }, { id: "co2", icon: "CO₂", label: "carbon dioxide", category: "compound" }, { id: "nh3", icon: "NH₃", label: "ammonia", category: "compound" },
    ]},
    { title: "Rational or irrational?", categories: ["rational", "irrational"], items: [
      { id: "half", icon: "1/2", label: "one half", category: "rational" }, { id: "three", icon: "3", label: "three", category: "rational" }, { id: "repeat", icon: "0.3̅", label: "repeating decimal", category: "rational" }, { id: "neg", icon: "−7", label: "negative seven", category: "rational" },
      { id: "pi", icon: "π", label: "pi", category: "irrational" }, { id: "root2", icon: "√2", label: "square root of two", category: "irrational" }, { id: "e", icon: "e", label: "Euler's number", category: "irrational" }, { id: "root3", icon: "√3", label: "square root of three", category: "irrational" },
    ]},
    { title: "Conduction or radiation?", categories: ["conduction", "radiation"], items: [
      { id: "pan", icon: "🍳", label: "pan handle heats", category: "conduction" }, { id: "spoon", icon: "🥄", label: "spoon in soup", category: "conduction" }, { id: "iron", icon: "👕", label: "iron touches cloth", category: "conduction" }, { id: "ice", icon: "🧊", label: "hand melts ice", category: "conduction" },
      { id: "sun", icon: "☀️", label: "Sun warms Earth", category: "radiation" }, { id: "fire", icon: "🔥", label: "feel fire at distance", category: "radiation" }, { id: "lamp", icon: "💡", label: "heat lamp", category: "radiation" }, { id: "infrared", icon: "📡", label: "infrared heater", category: "radiation" },
    ]},
  ],
];

const SEQUENCES: Array<Array<{ title: string; steps: Array<{ icon: string; label: string }> }>> = [
  [
    { title: "A flower grows", steps: [{ icon: "🌰", label: "seed" }, { icon: "🌱", label: "sprout" }, { icon: "🌿", label: "young plant" }, { icon: "🌻", label: "flower" }] },
    { title: "Getting ready", steps: [{ icon: "🛏️", label: "wake up" }, { icon: "🪥", label: "brush teeth" }, { icon: "👕", label: "get dressed" }, { icon: "🥣", label: "eat breakfast" }] },
    { title: "Make a block tower", steps: [{ icon: "🧱", label: "one block" }, { icon: "🧱🧱", label: "two blocks" }, { icon: "🧱🧱🧱", label: "three blocks" }, { icon: "🏰", label: "tower" }] },
    { title: "Butterfly changes", steps: [{ icon: "🥚", label: "egg" }, { icon: "🐛", label: "caterpillar" }, { icon: "🟤", label: "chrysalis" }, { icon: "🦋", label: "butterfly" }] },
    { title: "From small to big", steps: [{ icon: "•", label: "tiny dot" }, { icon: "●", label: "small circle" }, { icon: "⬤", label: "medium circle" }, { icon: "⚫", label: "big circle" }] },
    { title: "Wash hands", steps: [{ icon: "💧", label: "wet hands" }, { icon: "🧼", label: "add soap" }, { icon: "👐", label: "scrub" }, { icon: "🧻", label: "rinse and dry" }] },
  ],
  [
    { title: "Water's journey", steps: [{ icon: "🌊", label: "collection" }, { icon: "☀️", label: "evaporation" }, { icon: "☁️", label: "condensation" }, { icon: "🌧️", label: "precipitation" }] },
    { title: "A frog grows", steps: [{ icon: "🥚", label: "eggs" }, { icon: "◉", label: "tadpole" }, { icon: "🐸", label: "froglet" }, { icon: "🐸", label: "adult frog" }] },
    { title: "Make a fair measurement", steps: [{ icon: "❓", label: "ask what to measure" }, { icon: "📏", label: "choose one unit" }, { icon: "↔️", label: "place units without gaps" }, { icon: "📝", label: "record result" }] },
    { title: "Day to night", steps: [{ icon: "🌅", label: "sunrise" }, { icon: "☀️", label: "midday" }, { icon: "🌇", label: "sunset" }, { icon: "🌙", label: "night" }] },
    { title: "Solve an addition story", steps: [{ icon: "👀", label: "find starting amount" }, { icon: "➕", label: "notice more joining" }, { icon: "🧮", label: "add" }, { icon: "✅", label: "check with the story" }] },
    { title: "A chick hatches", steps: [{ icon: "🥚", label: "egg" }, { icon: "🐣", label: "hatching" }, { icon: "🐤", label: "chick" }, { icon: "🐔", label: "adult chicken" }] },
  ],
  [
    { title: "Investigate scientifically", steps: [{ icon: "❓", label: "ask a testable question" }, { icon: "💭", label: "make a prediction" }, { icon: "🧪", label: "collect evidence" }, { icon: "📊", label: "explain the result" }] },
    { title: "Information through a circuit", steps: [{ icon: "🔋", label: "energy source" }, { icon: "⚡", label: "current in closed path" }, { icon: "💡", label: "device transforms energy" }, { icon: "🔥", label: "some energy spreads as heat" }] },
    { title: "Solve a word problem", steps: [{ icon: "📖", label: "understand the situation" }, { icon: "🗺️", label: "choose a model" }, { icon: "🧮", label: "calculate" }, { icon: "🔍", label: "check reasonableness" }] },
    { title: "Rock cycle path", steps: [{ icon: "🌋", label: "magma cools" }, { icon: "🪨", label: "igneous rock" }, { icon: "💨", label: "weathering makes sediment" }, { icon: "🏜️", label: "sediment becomes rock" }] },
    { title: "Energy in a food chain", steps: [{ icon: "☀️", label: "sunlight" }, { icon: "🌱", label: "producer" }, { icon: "🐇", label: "primary consumer" }, { icon: "🦅", label: "predator" }] },
    { title: "Compare fractions", steps: [{ icon: "⭕", label: "check same whole" }, { icon: "✂️", label: "make equal-size parts" }, { icon: "🔢", label: "compare selected parts" }, { icon: "✅", label: "justify with a model" }] },
  ],
  [
    { title: "Test a claim", steps: [{ icon: "💬", label: "state the claim" }, { icon: "📚", label: "identify reliable evidence" }, { icon: "⚖️", label: "compare explanations" }, { icon: "📝", label: "revise the conclusion" }] },
    { title: "Balance an equation", steps: [{ icon: "🧪", label: "write correct formulas" }, { icon: "🔢", label: "count each atom" }, { icon: "⚖️", label: "change coefficients" }, { icon: "✅", label: "recount both sides" }] },
    { title: "Solve a linear equation", steps: [{ icon: "🧹", label: "simplify each side" }, { icon: "⚖️", label: "keep both sides balanced" }, { icon: "x", label: "isolate the variable" }, { icon: "🔍", label: "substitute to check" }] },
    { title: "Stars recycle matter", steps: [{ icon: "☁️", label: "gas cloud contracts" }, { icon: "🌟", label: "fusion powers star" }, { icon: "💥", label: "massive star disperses elements" }, { icon: "🪐", label: "new systems form" }] },
    { title: "Analyze data", steps: [{ icon: "❓", label: "define the question" }, { icon: "🧹", label: "inspect and clean data" }, { icon: "📊", label: "model patterns" }, { icon: "🧠", label: "interpret limits" }] },
    { title: "Engineer a solution", steps: [{ icon: "🎯", label: "define criteria and constraints" }, { icon: "💡", label: "generate alternatives" }, { icon: "🛠️", label: "prototype and test" }, { icon: "🔁", label: "improve using evidence" }] },
  ],
];

const ODD_BANKS = [
  [
    { prompt: "Which one is not an animal?", options: [["🐶", "dog"], ["🐱", "cat"], ["🪑", "chair"]], answer: "chair", explanation: "A dog and cat are animals. A chair is nonliving." },
    { prompt: "Which one is not round?", options: [["⚽", "ball"], ["🍊", "orange"], ["📕", "book"]], answer: "book", explanation: "The ball and orange are round. A book has flat faces and corners." },
    { prompt: "Which one does not belong in the sky?", options: [["☁️", "cloud"], ["🌈", "rainbow"], ["🥄", "spoon"]], answer: "spoon", explanation: "Clouds and rainbows appear in the sky. A spoon does not." },
    { prompt: "Which one is not a plant?", options: [["🌳", "tree"], ["🌷", "flower"], ["🐟", "fish"]], answer: "fish", explanation: "Trees and flowers are plants. A fish is an animal." },
    { prompt: "Which one is not used for drawing?", options: [["🖍️", "crayon"], ["✏️", "pencil"], ["🥾", "boot"]], answer: "boot", explanation: "Crayons and pencils make marks. A boot is worn on a foot." },
    { prompt: "Which one is not usually wet?", options: [["🌧️", "rain"], ["🌊", "ocean"], ["🧸", "teddy bear"]], answer: "teddy bear", explanation: "Rain and oceans are water. A teddy bear is usually kept dry." },
  ],
  [
    { prompt: "Which is not a state of matter?", options: [["🧊", "solid"], ["💧", "liquid"], ["🔊", "loud"]], answer: "loud", explanation: "Solid and liquid are states of matter. Loud describes sound." },
    { prompt: "Which does not make its own light?", options: [["☀️", "Sun"], ["💡", "lamp"], ["🌙", "Moon"]], answer: "Moon", explanation: "The Moon reflects sunlight rather than producing visible light of its own." },
    { prompt: "Which number is not even?", options: [["4", "four"], ["8", "eight"], ["7", "seven"]], answer: "seven", explanation: "Four and eight split into pairs with none left. Seven leaves one." },
    { prompt: "Which is not a 3D solid?", options: [["🧊", "cube"], ["⚽", "sphere"], ["▲", "triangle"]], answer: "triangle", explanation: "A triangle is flat, while cubes and spheres have depth." },
    { prompt: "Which is not a plant part?", options: [["🌱", "root"], ["🍃", "leaf"], ["🪶", "feather"]], answer: "feather", explanation: "Roots and leaves belong to plants. Feathers grow on birds." },
    { prompt: "Which does not belong in a simple circuit?", options: [["🔋", "battery"], ["💡", "bulb"], ["🥕", "carrot"]], answer: "carrot", explanation: "A battery and bulb can be circuit parts. A carrot is not a circuit component." },
  ],
  [
    { prompt: "Which is not a producer?", options: [["🌱", "grass"], ["🌳", "oak tree"], ["🐇", "rabbit"]], answer: "rabbit", explanation: "Grass and trees capture light energy. A rabbit must eat other organisms." },
    { prompt: "Which is not an equivalent fraction to 1/2?", options: [["2/4", "two fourths"], ["4/8", "four eighths"], ["3/5", "three fifths"]], answer: "three fifths", explanation: "2/4 and 4/8 simplify to 1/2; 3/5 equals 0.6." },
    { prompt: "Which is not a force?", options: [["⬇️", "gravity"], ["🧲", "magnetism"], ["🌡️", "temperature"]], answer: "temperature", explanation: "Temperature measures thermal state; gravity and magnetism exert forces." },
    { prompt: "Which is not renewable on human time scales?", options: [["☀️", "solar"], ["🌬️", "wind"], ["🪨", "coal"]], answer: "coal", explanation: "Coal forms over geologic time and is used faster than it is replaced." },
    { prompt: "Which is not a quadrilateral?", options: [["▭", "rectangle"], ["◇", "rhombus"], ["△", "triangle"]], answer: "triangle", explanation: "Quadrilaterals have four sides. A triangle has three." },
    { prompt: "Which is not evidence of a chemical change?", options: [["🔥", "new heat or light"], ["🫧", "new gas"], ["✂️", "smaller pieces"]], answer: "smaller pieces", explanation: "Cutting changes size but does not necessarily create a new substance." },
  ],
  [
    { prompt: "Which is not a vector quantity?", options: [["➡️", "velocity"], ["💪", "force"], ["⏱️", "time"]], answer: "time", explanation: "Time has magnitude but no spatial direction, so it is scalar." },
    { prompt: "Which cannot be rational?", options: [["0.25", "terminating decimal"], ["0.3̅", "repeating decimal"], ["π", "pi"]], answer: "pi", explanation: "Pi cannot be written as a ratio of integers; terminating and repeating decimals can." },
    { prompt: "Which is not electromagnetic radiation?", options: [["📻", "radio wave"], ["💡", "visible light"], ["🔊", "sound in air"]], answer: "sound in air", explanation: "Sound is a mechanical wave and requires matter; electromagnetic waves do not." },
    { prompt: "Which is not conserved in every inelastic collision?", options: [["➡️", "momentum"], ["⚡", "total energy"], ["🏎️", "kinetic energy"]], answer: "kinetic energy", explanation: "Momentum and total energy are conserved, but some kinetic energy transforms into heat or deformation." },
    { prompt: "Which is not caused mainly by plate boundaries?", options: [["🏔️", "many mountain ranges"], ["🌋", "many volcanoes"], ["🌈", "rainbows"]], answer: "rainbows", explanation: "Rainbows result from light interacting with water droplets, not tectonic plates." },
    { prompt: "Which is not a subatomic particle in the basic atom model?", options: [["➕", "proton"], ["➖", "electron"], ["🧬", "gene"]], answer: "gene", explanation: "A gene is a region of DNA made from atoms; it is not a subatomic particle." },
  ],
] as const;

const CLUE_BANKS = [
  [
    ["I am round. I bounce. You can roll me.", "ball", [["⚽", "ball"], ["📕", "book"], ["🥄", "spoon"]]],
    ["I grow in soil and turn toward light.", "flower", [["🌷", "flower"], ["🪨", "rock"], ["🧸", "toy"]]],
    ["I have feathers, wings and a beak.", "bird", [["🐦", "bird"], ["🐟", "fish"], ["🐱", "cat"]]],
    ["I appear at night and orbit Earth.", "Moon", [["🌙", "Moon"], ["☀️", "Sun"], ["☁️", "cloud"]]],
    ["I fall from clouds and make puddles.", "rain", [["🌧️", "rain"], ["🌬️", "wind"], ["❄️", "snow"]]],
    ["I have three sides and three corners.", "triangle", [["▲", "triangle"], ["■", "square"], ["●", "circle"]]],
  ],
  [
    ["I am a solid that can roll in every direction and have no flat faces.", "sphere", [["⚽", "sphere"], ["🧊", "cube"], ["🥫", "cylinder"]]],
    ["I pull some metals without touching them.", "magnet", [["🧲", "magnet"], ["🔦", "flashlight"], ["📏", "ruler"]]],
    ["I am water in gas form, rising from a warm puddle.", "water vapor", [["♨️", "water vapor"], ["🧊", "ice"], ["💧", "liquid water"]]],
    ["I am one of two equal parts.", "half", [["1/2", "half"], ["1/3", "third"], ["1", "whole"]]],
    ["I measure how hot or cold something is.", "temperature", [["🌡️", "temperature"], ["📏", "length"], ["⚖️", "mass"]]],
    ["I am the path a planet follows around a star.", "orbit", [["⭕", "orbit"], ["⬇️", "gravity"], ["🌌", "galaxy"]]],
  ],
  [
    ["I make food from light and usually begin a food chain.", "producer", [["🌱", "producer"], ["🐇", "consumer"], ["🍄", "decomposer"]]],
    ["I measure the distance around a shape.", "perimeter", [["🔲", "perimeter"], ["◼️", "area"], ["📐", "angle"]]],
    ["I am a change in speed or direction.", "acceleration", [["🚀", "acceleration"], ["🏎️", "speed"], ["📍", "position"]]],
    ["I am the smallest unit considered alive.", "cell", [["🦠", "cell"], ["⚛️", "atom"], ["🫁", "organ"]]],
    ["My denominator tells how many equal parts make a whole.", "fraction", [["3/4", "fraction"], ["34", "whole number"], ["3.4", "decimal"]]],
    ["I form when gas cools into liquid droplets.", "condensation", [["☁️", "condensation"], ["☀️", "evaporation"], ["🌧️", "precipitation"]]],
  ],
  [
    ["I am a DNA region with biological information.", "gene", [["🧬", "gene"], ["🦠", "cell"], ["⚛️", "atom"]]],
    ["I compare a quantity to one hundred.", "percent", [["%", "percent"], [":", "ratio"], ["x", "variable"]]],
    ["I am the distance light travels in one year, not a measure of time.", "light-year", [["🌌", "light-year"], ["⏳", "year"], ["🚀", "orbit"]]],
    ["I resist changes in an object's motion.", "inertia", [["🧱", "inertia"], ["➡️", "velocity"], ["🔥", "radiation"]]],
    ["I transfer energy through electromagnetic waves and need no material medium.", "radiation", [["☀️", "radiation"], ["🥄", "conduction"], ["🌬️", "convection"]]],
    ["I represent a number that may be unknown or can change.", "variable", [["x", "variable"], ["=", "equality"], ["+", "operation"]]],
  ],
] as const;

function rotate<T>(items: T[], amount: number) {
  const offset = ((amount % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function buildPattern(age: number, variant: number): Extract<PuzzleDefinition, { kind: "choice" }> {
  if (age === 0) {
    const patterns = [
      ["🔴 🔵 🔴 🔵", "🔴", ["🔴", "🔵", "🟢"], "The rule repeats red, blue."],
      ["⭐ ⭐ 🌙 ⭐ ⭐ 🌙", "⭐", ["⭐", "🌙", "☀️"], "The rule repeats two stars, then one moon."],
      ["🐭 🐘 🐭 🐘", "🐭", ["🐭", "🐘", "🐯"], "The rule alternates mouse, elephant."],
      ["▲ ■ ▲ ■", "▲", ["▲", "■", "●"], "The rule alternates triangle, square."],
      ["👏 👣 👣 👏 👣 👣", "👏", ["👏", "👣", "🤚"], "The movement rule is clap, step, step."],
      ["🍎 🍌 🍎 🍌", "🍎", ["🍎", "🍌", "🍇"], "The fruit rule alternates apple, banana."],
    ];
    const [prompt, answer, choices, explanation] = patterns[variant % patterns.length];
    return { kind: "choice", family: "pattern", id: `pattern-${age}-${variant}`, title: "Pattern detective", instruction: "Find the repeating rule, then choose what comes next.", prompt: `${prompt} ___`, options: (choices as string[]).map((icon) => ({ icon, label: icon })), answer: answer as string, explanation: explanation as string };
  }

  const step = age === 1 ? (variant % 3) + 1 : (variant % 5) + 2;
  const start = (variant * 5 + age * 2) % 12 + 1;
  const values = Array.from({ length: 4 }, (_, index) => start + index * step);
  const answerValue = start + 4 * step;
  const options = rotate([answerValue, answerValue + step, answerValue - 1], variant % 3);
  const prompt = age === 3 && variant % 3 === 2
    ? "2, 4, 8, 16, ___"
    : `${values.join(", ")}, ___`;
  const finalAnswer = age === 3 && variant % 3 === 2 ? "32" : String(answerValue);
  const finalOptions = age === 3 && variant % 3 === 2 ? ["24", "32", "30"] : options.map(String);
  return {
    kind: "choice",
    family: "pattern",
    id: `pattern-${age}-${variant}`,
    title: age === 1 ? "Number pattern" : "Sequence rule",
    instruction: "Describe the change between terms before choosing the next one.",
    prompt,
    options: finalOptions.map((label) => ({ icon: label, label })),
    answer: finalAnswer,
    explanation: age === 3 && variant % 3 === 2 ? "Each term doubles." : `Add ${step} each time.`,
  };
}

export function buildPuzzle(page: number, age: number): PuzzleDefinition {
  const safeAge = Math.max(0, Math.min(3, age));
  const safePage = Math.max(1, Math.min(MAX_GENERATED_PAGE, page));
  const familyIndex = (safePage - 1) % PUZZLE_FAMILIES.length;
  const variant = Math.floor((safePage - 1) / PUZZLE_FAMILIES.length);
  const family = PUZZLE_FAMILIES[familyIndex];

  if (family === "match") {
    const bank = PAIR_BANKS[safeAge];
    const count = safeAge + 3;
    // Five is coprime with the 18-piece banks, so each new matching mission
    // walks to a genuinely different window before any grouping repeats.
    const start = (variant * 5 + safeAge * 3) % bank.length;
    const pairs = Array.from({ length: count }, (_, index) => bank[(start + index) % bank.length]);
    return { kind: "match", id: `match-${safeAge}-${variant}-${pairs.map((pair) => pair.label).join("-")}`, title: safeAge < 2 ? "Find the partners" : "Connect the ideas", instruction: "Choose a piece, then choose the partner that explains where it belongs.", pairs };
  }

  if (family === "sort") {
    const sets = SORT_SETS[safeAge];
    const set = sets[variant % sets.length];
    const items = rotate(set.items, variant).slice(0, safeAge + 5);
    return { kind: "sort", id: `sort-${safeAge}-${variant}-${set.title}`, title: set.title, instruction: "Choose an item, then place it in the category that fits best.", categories: set.categories, items };
  }

  if (family === "sequence") {
    const bank = SEQUENCES[safeAge];
    const sequence = bank[variant % bank.length];
    return { kind: "sequence", id: `sequence-${safeAge}-${variant}-${sequence.title}`, title: sequence.title, instruction: "Tap the steps from first to last. Use cause, time, or size to decide.", steps: sequence.steps };
  }

  if (family === "pattern") return buildPattern(safeAge, variant);

  if (family === "odd") {
    const bank = ODD_BANKS[safeAge];
    const item = bank[variant % bank.length];
    return {
      kind: "choice",
      family: "odd",
      id: `odd-${safeAge}-${variant}-${item.answer}`,
      title: "Odd one out",
      instruction: "Find the rule shared by two choices. Then choose the one that does not follow it.",
      prompt: item.prompt,
      options: item.options.map(([icon, label]) => ({ icon, label })),
      answer: item.answer,
      explanation: item.explanation,
    };
  }

  const clues = CLUE_BANKS[safeAge];
  const [prompt, answer, options] = clues[variant % clues.length];
  return {
    kind: "choice",
    family: "clue",
    id: `clue-${safeAge}-${variant}-${answer}`,
    title: "Clue solver",
    instruction: "Use every clue. Choose the answer that satisfies all of them.",
    prompt,
    options: options.map(([icon, label]) => ({ icon, label })),
    answer,
    explanation: `The clues describe ${answer}.`,
  };
}

/**
 * A signature of a puzzle's *content*, ignoring the generated id.
 *
 * The id embeds the variant number, so two identical puzzles produced at
 * different pages carry different ids and would look distinct if counted
 * naively. Counting by content is what makes the number on screen true.
 */
function contentSignature(puzzle: PuzzleDefinition): string {
  if (puzzle.kind === "match") return `match|${puzzle.pairs.map((pair) => pair.label).sort().join(",")}`;
  if (puzzle.kind === "sort") return `sort|${puzzle.title}|${puzzle.items.map((item) => item.id).sort().join(",")}`;
  if (puzzle.kind === "sequence") return `sequence|${puzzle.title}`;
  return `${puzzle.family}|${puzzle.prompt}|${puzzle.answer}`;
}

/**
 * Every genuinely distinct puzzle for an age world, in the rotating family
 * order children already experience — match, sort, sequence, pattern, odd,
 * clue, repeat — but with duplicates removed.
 *
 * Previously the studio advertised "of 400" while the banks behind it held far
 * less, so a child hit silent repeats from about page 37 onward. The deck is
 * the real inventory: its length is what the page counter shows, and walking to
 * the end of it means genuinely seeing everything.
 *
 * Adding entries to any bank grows the deck automatically — no counter to
 * update by hand, and no way for the advertised number to drift from reality.
 */
const deckCache = new Map<number, PuzzleDefinition[]>();

export function getPuzzleDeck(age: number): PuzzleDefinition[] {
  const safeAge = Math.max(0, Math.min(3, Math.floor(age)));
  const cached = deckCache.get(safeAge);
  if (cached) return cached;

  const seen = new Set<string>();
  const deck: PuzzleDefinition[] = [];
  for (let page = 1; page <= MAX_GENERATED_PAGE; page += 1) {
    const puzzle = buildPuzzle(page, safeAge);
    const signature = contentSignature(puzzle);
    if (seen.has(signature)) continue;
    seen.add(signature);
    deck.push(puzzle);
  }

  deckCache.set(safeAge, deck);
  return deck;
}

/** The true number of distinct puzzles available in an age world. */
export function countPuzzles(age: number): number {
  return getPuzzleDeck(age).length;
}

/**
 * Fetch the puzzle for a page, guaranteeing that consecutive pages are
 * different puzzles for as long as distinct content lasts.
 */
export function getPuzzle(page: number, age: number): PuzzleDefinition {
  const deck = getPuzzleDeck(age);
  const index = (Math.max(1, Math.floor(page)) - 1) % deck.length;
  return deck[index];
}
