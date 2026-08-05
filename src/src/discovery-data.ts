/**
 * A curated, editorially approved image for a topic.
 *
 * Discovery Lab previously searched Wikipedia live and displayed whatever came
 * back, which meant the app could not certify what a child would see. Images
 * now only ever come from here — leave it unset and the mission card is drawn
 * offline instead. Fill one in only after checking the image itself, its
 * licence, and its suitability for the youngest child who can reach the topic.
 */
export type CuratedImage = {
  /** Path to a file shipped in the build, e.g. `discovery/everest.jpg`. */
  src: string;
  /** Photographer or institution, shown under the image. */
  credit: string;
  /** Licence name, e.g. "CC BY-SA 4.0" or "Public domain (NASA)". */
  license: string;
  alt?: string;
};

export type DiscoveryTopic = {
  title: string;
  place: string;
  kind: string;
  field: string;
  /** Retained as an editorial research hint. Never used to fetch anything. */
  search: string;
  fact79: string;
  fact1012: string;
  /** Optional approved photograph. Unset topics use offline generated artwork. */
  image?: CuratedImage;
};

type MissionLens = {
  name: string;
  imageCue: string;
  observe: [string, string, string];
  story: (topic: DiscoveryTopic) => string;
  imagine: (topic: DiscoveryTopic) => string;
  connection79: string;
  connection1012: string;
};

const TOPICS: DiscoveryTopic[] = [
  {
    title: "Mount Everest",
    place: "Himalayas · Asia",
    kind: "Mountain",
    field: "Earth science",
    search: "Mount Everest Himalaya",
    fact79: "Everest is Earth’s highest mountain above sea level, but it still grows a few millimeters in some years.",
    fact1012: "Everest rose when the Indian tectonic plate collided with Eurasia; that collision continues to deform the Himalayas.",
  },
  {
    title: "The Andes",
    place: "Western South America",
    kind: "Mountain range",
    field: "Plate tectonics",
    search: "Andes mountain range",
    fact79: "The Andes form the world’s longest continental mountain range.",
    fact1012: "Much of the Andes formed as the Nazca Plate moved beneath the South American Plate at a convergent boundary.",
  },
  {
    title: "The Alps",
    place: "Central Europe",
    kind: "Mountain range",
    field: "Glaciology",
    search: "Alps glacier landscape",
    fact79: "Ice carved many U-shaped valleys and bright blue lakes in the Alps.",
    fact1012: "Repeated glacial advances widened Alpine river valleys and transported rock far from where it formed.",
  },
  {
    title: "Mount Kilimanjaro",
    place: "Tanzania · Africa",
    kind: "Volcano",
    field: "Climate zones",
    search: "Mount Kilimanjaro Tanzania",
    fact79: "A climber on Kilimanjaro can pass from warm farmland to alpine desert and ice.",
    fact1012: "Kilimanjaro’s great elevation creates stacked climate zones even though the mountain is close to the equator.",
  },
  {
    title: "Mount Fuji",
    place: "Honshu · Japan",
    kind: "Volcano",
    field: "Volcanology",
    search: "Mount Fuji Japan",
    fact79: "Mount Fuji’s cone was built by many layers of lava and ash.",
    fact1012: "Fuji is a stratovolcano near the meeting area of several tectonic plates, where magma can rise through Earth’s crust.",
  },
  {
    title: "Grand Canyon",
    place: "Arizona · North America",
    kind: "Canyon",
    field: "Erosion",
    search: "Grand Canyon geology",
    fact79: "The Colorado River and weather slowly cut through layers of rock to shape the Grand Canyon.",
    fact1012: "The canyon exposes a long rock record because uplift raised the Colorado Plateau while erosion removed overlying material.",
  },
  {
    title: "Zhangjiajie pillars",
    place: "Hunan · China",
    kind: "Stone forest",
    field: "Weathering",
    search: "Zhangjiajie sandstone pillars",
    fact79: "Water, plants, and changing temperatures helped separate these sandstone pillars.",
    fact1012: "Jointed sandstone was gradually weathered and eroded, leaving tall isolated columns between deep ravines.",
  },
  {
    title: "Torres del Paine",
    place: "Patagonia · Chile",
    kind: "Mountain landscape",
    field: "Geology",
    search: "Torres del Paine Patagonia",
    fact79: "Glaciers uncovered the park’s dramatic granite towers.",
    fact1012: "Magma cooled underground into granite before later uplift and glacial erosion exposed the towers.",
  },
  {
    title: "Sahara dunes",
    place: "North Africa",
    kind: "Hot desert",
    field: "Wind science",
    search: "Sahara sand dunes",
    fact79: "Wind moves sand grain by grain, building dunes that can slowly travel.",
    fact1012: "Dune shape records prevailing wind direction, available sand, and obstacles that alter airflow.",
  },
  {
    title: "Namib Desert",
    place: "Namibia · Africa",
    kind: "Coastal desert",
    field: "Adaptation",
    search: "Namib Desert dunes fog",
    fact79: "Fog from the Atlantic Ocean brings precious water to animals and plants in the Namib.",
    fact1012: "Cold offshore water helps create coastal fog, allowing specialized organisms to collect moisture in an extremely dry climate.",
  },
  {
    title: "Atacama Desert",
    place: "Chile · South America",
    kind: "High desert",
    field: "Climate",
    search: "Atacama Desert Chile landscape",
    fact79: "Parts of the Atacama can go years with almost no measured rain.",
    fact1012: "The Andes rain shadow and cold Humboldt Current combine to make the Atacama exceptionally dry.",
  },
  {
    title: "Gobi Desert",
    place: "Mongolia and China · Asia",
    kind: "Cold desert",
    field: "Paleontology",
    search: "Gobi Desert Mongolia landscape",
    fact79: "The Gobi can be hot in summer, freezing in winter, and rich in dinosaur fossils.",
    fact1012: "Rapid burial in Gobi sediments preserved important dinosaur fossils, including nests and eggs.",
  },
  {
    title: "Wadi Rum",
    place: "Jordan · Asia",
    kind: "Rock desert",
    field: "Erosion",
    search: "Wadi Rum Jordan desert",
    fact79: "Wind and water shaped Wadi Rum’s arches, cliffs, and narrow canyons.",
    fact1012: "Differential weathering removes softer rock faster than harder layers, producing arches and isolated massifs.",
  },
  {
    title: "White Desert",
    place: "Egypt · Africa",
    kind: "Chalk desert",
    field: "Weathering",
    search: "White Desert Egypt chalk formations",
    fact79: "Wind-blown sand sculpted chalk into shapes that can look like giant mushrooms.",
    fact1012: "Erosion acts unevenly on chalk, narrowing softer sections and leaving harder caps above them.",
  },
  {
    title: "Sonoran Desert",
    place: "Mexico and United States",
    kind: "Living desert",
    field: "Ecology",
    search: "Sonoran Desert saguaro",
    fact79: "A saguaro cactus expands like an accordion to store rainwater.",
    fact1012: "Saguaros use shallow spreading roots, water-storing tissue, and nighttime gas exchange to reduce water loss.",
  },
  {
    title: "Antarctic desert",
    place: "Antarctica",
    kind: "Polar desert",
    field: "Climate",
    search: "Antarctica polar desert landscape",
    fact79: "Antarctica is a desert because it receives very little precipitation, even though it holds enormous ice sheets.",
    fact1012: "Cold air holds little water vapor, so Antarctica’s interior has extremely low precipitation despite its ice cover.",
  },
  {
    title: "Great Barrier Reef",
    place: "Queensland · Australia",
    kind: "Coral reef",
    field: "Marine biology",
    search: "Great Barrier Reef coral",
    fact79: "Tiny coral animals build hard skeletons that can grow into reefs visible from space.",
    fact1012: "Reef-building corals depend on photosynthetic algae living in their tissues; heat stress can disrupt this partnership.",
  },
  {
    title: "Amazon River",
    place: "South America",
    kind: "River system",
    field: "Hydrology",
    search: "Amazon River aerial",
    fact79: "The Amazon carries more water than any other river on Earth.",
    fact1012: "A vast drainage basin collects rainfall from many tributaries and sends an enormous freshwater flow toward the Atlantic.",
  },
  {
    title: "Victoria Falls",
    place: "Zambia and Zimbabwe · Africa",
    kind: "Waterfall",
    field: "Erosion",
    search: "Victoria Falls aerial",
    fact79: "The Zambezi River drops into a narrow crack, sending mist high into the air.",
    fact1012: "Erosion follows fractures in basalt, causing the waterfall’s edge to retreat and leave a zigzag series of gorges.",
  },
  {
    title: "Niagara Falls",
    place: "Canada and United States",
    kind: "Waterfall",
    field: "Water power",
    search: "Niagara Falls aerial",
    fact79: "A huge amount of Great Lakes water flows over Niagara Falls every minute.",
    fact1012: "Hard caprock protects softer rock beneath it until undercutting causes sections of the waterfall edge to collapse.",
  },
  {
    title: "Lake Baikal",
    place: "Siberia · Russia",
    kind: "Rift lake",
    field: "Freshwater science",
    search: "Lake Baikal ice",
    fact79: "Lake Baikal is the deepest lake on Earth and holds a huge share of the planet’s unfrozen fresh surface water.",
    fact1012: "Baikal occupies an active continental rift where Earth’s crust is pulling apart, creating a deep basin.",
  },
  {
    title: "Jökulsárlón lagoon",
    place: "Iceland · Europe",
    kind: "Glacial lagoon",
    field: "Glaciology",
    search: "Jokulsarlon glacier lagoon Iceland",
    fact79: "Icebergs break from a glacier and drift through this lagoon toward the sea.",
    fact1012: "As the glacier retreats, meltwater and seawater enlarge the lagoon while calved ice records the glacier’s movement.",
  },
  {
    title: "Greenland Ice Sheet",
    place: "Greenland · Arctic",
    kind: "Ice sheet",
    field: "Climate science",
    search: "Greenland ice sheet aerial",
    fact79: "The Greenland Ice Sheet is so heavy that it presses down on the land beneath it.",
    fact1012: "Ice mass affects Earth’s crust through isostasy; when ice is lost, the land can slowly rebound upward.",
  },
  {
    title: "Okavango Delta",
    place: "Botswana · Africa",
    kind: "Inland delta",
    field: "Wetland ecology",
    search: "Okavango Delta aerial wildlife",
    fact79: "The Okavango River spreads into a giant wetland instead of reaching the ocean.",
    fact1012: "Seasonal floodwater fans across a shallow inland basin, creating shifting channels and habitats before evaporating.",
  },
  {
    title: "Amazon rainforest",
    place: "South America",
    kind: "Tropical forest",
    field: "Ecology",
    search: "Amazon rainforest canopy",
    fact79: "Rainforest trees release water vapor that helps form clouds and recycle rain.",
    fact1012: "Evapotranspiration moves water from soil and leaves into the atmosphere, influencing rainfall across a large region.",
  },
  {
    title: "Congo rainforest",
    place: "Central Africa",
    kind: "Tropical forest",
    field: "Biodiversity",
    search: "Congo rainforest aerial",
    fact79: "The Congo Basin contains the world’s second-largest tropical rainforest.",
    fact1012: "Its forests store carbon, cycle water, and support species adapted to many layers from the forest floor to the canopy.",
  },
  {
    title: "Borneo rainforest",
    place: "Southeast Asia",
    kind: "Island forest",
    field: "Evolution",
    search: "Borneo rainforest orangutan",
    fact79: "Borneo’s rainforests are home to orangutans and thousands of plant species.",
    fact1012: "Long isolation and varied habitats encouraged high biodiversity and many species found nowhere else.",
  },
  {
    title: "Redwood forest",
    place: "California · North America",
    kind: "Temperate forest",
    field: "Plant science",
    search: "coast redwood forest California",
    fact79: "Coast redwoods can grow taller than any other living tree.",
    fact1012: "Fog supplies moisture to foliage and soil, while thick bark helps mature redwoods survive some fires.",
  },
  {
    title: "Sundarbans",
    place: "India and Bangladesh · Asia",
    kind: "Mangrove forest",
    field: "Coastal ecology",
    search: "Sundarbans mangrove forest",
    fact79: "Mangrove roots can trap mud, shelter young fish, and soften waves.",
    fact1012: "Salt-tolerant mangroves stabilize tidal sediment and reduce some storm energy along the coast.",
  },
  {
    title: "Serengeti migration",
    place: "Tanzania and Kenya · Africa",
    kind: "Grassland",
    field: "Animal ecology",
    search: "Serengeti wildebeest migration",
    fact79: "Huge herds follow seasonal rain to find fresh grass and water.",
    fact1012: "Migration links rainfall patterns, plant growth, predators, and nutrient cycling across the savanna ecosystem.",
  },
  {
    title: "Galápagos Islands",
    place: "Ecuador · Pacific Ocean",
    kind: "Volcanic islands",
    field: "Evolution",
    search: "Galapagos Islands wildlife landscape",
    fact79: "Animals on different islands developed special features suited to their habitats.",
    fact1012: "Geographic isolation allowed populations to diverge over generations, helping scientists understand natural selection.",
  },
  {
    title: "Madagascar",
    place: "Indian Ocean · Africa",
    kind: "Island ecosystem",
    field: "Biodiversity",
    search: "Madagascar baobab lemur landscape",
    fact79: "Many of Madagascar’s lemurs and plants live nowhere else on Earth.",
    fact1012: "Tens of millions of years of isolation produced high endemism: species with naturally limited geographic ranges.",
  },
  {
    title: "Machu Picchu",
    place: "Andes · Peru",
    kind: "Mountain city",
    field: "Engineering",
    search: "Machu Picchu terraces Peru",
    fact79: "Inca builders shaped stone and terraces to fit a steep, rainy mountain.",
    fact1012: "Terracing, drainage layers, and precisely fitted stone helped the site manage water and seismic movement.",
  },
  {
    title: "Petra",
    place: "Jordan · Asia",
    kind: "Rock-cut city",
    field: "Water engineering",
    search: "Petra Jordan Treasury canyon",
    fact79: "Petra’s builders carved buildings into rock and built channels to collect scarce rain.",
    fact1012: "Cisterns, dams, and channels controlled flash floods and stored water, helping a desert trading city thrive.",
  },
  {
    title: "Angkor",
    place: "Cambodia · Asia",
    kind: "Historic city",
    field: "Water systems",
    search: "Angkor Wat Cambodia aerial",
    fact79: "Angkor was connected by huge reservoirs, canals, roads, and temples.",
    fact1012: "A large engineered water network helped store monsoon rainfall and support an extensive urban region.",
  },
  {
    title: "Great Wall",
    place: "Northern China",
    kind: "Human landscape",
    field: "Geography",
    search: "Great Wall China mountains",
    fact79: "The Great Wall is really a network of walls and fortifications built across different eras.",
    fact1012: "Builders adapted local materials and routes to deserts, plains, and mountains rather than constructing one continuous wall.",
  },
  {
    title: "Venice lagoon",
    place: "Italy · Europe",
    kind: "Lagoon city",
    field: "Human geography",
    search: "Venice lagoon aerial Italy",
    fact79: "Venice was built across many small islands linked by bridges.",
    fact1012: "Buildings rest on foundations driven into soft lagoon sediments, while canals organize transport through the city.",
  },
  {
    title: "Cappadocia",
    place: "Türkiye · Asia",
    kind: "Rock landscape",
    field: "Geology and culture",
    search: "Cappadocia fairy chimneys balloons",
    fact79: "People carved homes and shelters into soft volcanic rock shaped by erosion.",
    fact1012: "Layers of volcanic tuff weathered into towers, and their softness allowed communities to excavate extensive spaces.",
  },
  {
    title: "Rapa Nui",
    place: "Easter Island · Pacific Ocean",
    kind: "Island culture",
    field: "Archaeology",
    search: "Rapa Nui moai landscape",
    fact79: "Rapa Nui artists carved hundreds of enormous stone figures called moai.",
    fact1012: "The moai were carved from volcanic rock and transported across a small, remote island using organized labor and engineering.",
  },
  {
    title: "Taj Mahal",
    place: "Agra · India",
    kind: "Architecture",
    field: "Geometry",
    search: "Taj Mahal reflection symmetry",
    fact79: "The Taj Mahal uses balance, reflection, and repeating geometric patterns.",
    fact1012: "Its plan uses axial symmetry and carefully proportioned forms to guide how the structure is seen and approached.",
  },
  {
    title: "Aurora",
    place: "Polar skies",
    kind: "Space weather",
    field: "Physics",
    search: "aurora borealis night sky",
    fact79: "Auroras glow when particles from the Sun interact with gases high in Earth’s atmosphere.",
    fact1012: "Earth’s magnetic field guides charged solar particles toward polar regions, where collisions excite atmospheric atoms.",
  },
  {
    title: "Tropical cyclone",
    place: "Warm tropical oceans",
    kind: "Storm",
    field: "Meteorology",
    search: "hurricane tropical cyclone satellite",
    fact79: "A tropical cyclone draws energy from warm ocean water.",
    fact1012: "Warm moist air rises and releases latent heat, while Earth’s rotation helps organize the storm’s circulation.",
  },
  {
    title: "Monsoon",
    place: "South and Southeast Asia",
    kind: "Seasonal weather",
    field: "Climate",
    search: "monsoon clouds India landscape",
    fact79: "A monsoon is a seasonal shift in winds that can bring months of important rain.",
    fact1012: "Different heating rates of land and ocean help reverse regional pressure patterns and wind direction by season.",
  },
  {
    title: "Tornado",
    place: "Great Plains · North America",
    kind: "Severe weather",
    field: "Meteorology",
    search: "tornado supercell Great Plains",
    fact79: "Some powerful thunderstorms can form a narrow, rotating column of air.",
    fact1012: "Wind shear can create horizontal rotation that a strong thunderstorm updraft tilts and stretches vertically.",
  },
  {
    title: "Rainbow",
    place: "Sunlit rain anywhere on Earth",
    kind: "Light",
    field: "Optics",
    search: "rainbow landscape double rainbow",
    fact79: "Raindrops bend, reflect, and separate sunlight into colors.",
    fact1012: "Refraction and internal reflection send different wavelengths back at slightly different angles, producing a color arc.",
  },
  {
    title: "Lightning",
    place: "Thunderstorms worldwide",
    kind: "Electricity",
    field: "Atmospheric physics",
    search: "lightning thunderstorm night",
    fact79: "Lightning is a giant electrical discharge that heats nearby air extremely quickly.",
    fact1012: "Charge separation inside a storm creates a strong electric field until air becomes conductive and a discharge occurs.",
  },
  {
    title: "Cloud laboratory",
    place: "Earth’s atmosphere",
    kind: "Water cycle",
    field: "Meteorology",
    search: "cumulonimbus lenticular clouds",
    fact79: "Clouds form when cooling water vapor condenses onto tiny particles in the air.",
    fact1012: "Air rising through lower pressure expands and cools, allowing water vapor to condense when it reaches the dew point.",
  },
  {
    title: "Gulf Stream",
    place: "North Atlantic Ocean",
    kind: "Ocean current",
    field: "Oceanography",
    search: "Gulf Stream ocean current satellite",
    fact79: "The Gulf Stream carries warm water across the North Atlantic.",
    fact1012: "Winds, Earth’s rotation, and connected ocean circulation move heat, influencing weather and marine ecosystems.",
  },
  {
    title: "The Sun",
    place: "Center of our solar system",
    kind: "Star",
    field: "Astronomy",
    search: "Sun solar prominence NASA",
    fact79: "The Sun is a star whose light and heat make most life on Earth possible.",
    fact1012: "Fusion in the Sun’s core converts hydrogen into helium and releases energy that eventually reaches its surface.",
  },
  {
    title: "Mercury",
    place: "Inner solar system",
    kind: "Planet",
    field: "Planetary science",
    search: "Mercury planet NASA",
    fact79: "Mercury is the closest planet to the Sun and has a heavily cratered surface.",
    fact1012: "With almost no atmosphere to move heat around, Mercury experiences extreme temperature differences.",
  },
  {
    title: "Venus",
    place: "Inner solar system",
    kind: "Planet",
    field: "Climate science",
    search: "Venus planet surface NASA",
    fact79: "Venus is wrapped in thick clouds and is hotter than Mercury.",
    fact1012: "A dense carbon-dioxide atmosphere creates an extreme greenhouse effect that keeps Venus’s surface very hot.",
  },
  {
    title: "Earth",
    place: "Third planet from the Sun",
    kind: "Ocean planet",
    field: "Earth systems",
    search: "Earth blue marble NASA",
    fact79: "Earth’s moving air, water, rock, and living things constantly affect one another.",
    fact1012: "Earth behaves as connected systems: atmosphere, hydrosphere, geosphere, cryosphere, and biosphere exchange matter and energy.",
  },
  {
    title: "The Moon",
    place: "Earth’s natural satellite",
    kind: "Moon",
    field: "Lunar science",
    search: "Moon surface Apollo NASA",
    fact79: "The Moon’s gravity helps create ocean tides on Earth.",
    fact1012: "Tides result mainly from differences in the Moon’s gravitational pull across Earth, with the Sun adding a smaller effect.",
  },
  {
    title: "Mars",
    place: "Fourth planet from the Sun",
    kind: "Planet",
    field: "Planetary geology",
    search: "Mars landscape rover NASA",
    fact79: "Dry channels and minerals show that liquid water once moved across ancient Mars.",
    fact1012: "Orbital and rover evidence indicates ancient rivers, lakes, and groundwater in environments very different from Mars today.",
  },
  {
    title: "Jupiter",
    place: "Outer solar system",
    kind: "Gas giant",
    field: "Atmospheric science",
    search: "Jupiter Great Red Spot NASA",
    fact79: "Jupiter is the largest planet and has a storm called the Great Red Spot.",
    fact1012: "Rapid rotation, rising heat, and bands of powerful winds drive Jupiter’s turbulent atmosphere.",
  },
  {
    title: "Saturn",
    place: "Outer solar system",
    kind: "Ringed planet",
    field: "Orbital science",
    search: "Saturn rings Cassini NASA",
    fact79: "Saturn’s rings are made of countless pieces of ice and rock.",
    fact1012: "Ring particles orbit Saturn independently, and moons help create gaps, waves, and sharp edges through gravity.",
  },
  {
    title: "Uranus",
    place: "Outer solar system",
    kind: "Ice giant",
    field: "Planetary science",
    search: "Uranus planet NASA Voyager",
    fact79: "Uranus spins almost on its side compared with the other planets.",
    fact1012: "Its extreme axial tilt produces unusual seasons that last for many Earth years.",
  },
  {
    title: "Neptune",
    place: "Outer solar system",
    kind: "Ice giant",
    field: "Atmospheric science",
    search: "Neptune planet storms NASA",
    fact79: "Neptune has some of the fastest winds measured in the solar system.",
    fact1012: "Despite receiving little sunlight, Neptune releases internal heat that helps power dynamic weather.",
  },
  {
    title: "Pluto",
    place: "Kuiper Belt",
    kind: "Dwarf planet",
    field: "Planetary geology",
    search: "Pluto heart New Horizons NASA",
    fact79: "Pluto has mountains of water ice and a bright heart-shaped region.",
    fact1012: "Nitrogen ice circulates within Sputnik Planitia, showing that even a small distant world can be geologically active.",
  },
  {
    title: "Europa",
    place: "Moon of Jupiter",
    kind: "Icy moon",
    field: "Astrobiology",
    search: "Europa icy surface NASA",
    fact79: "Scientists think a salty ocean may hide beneath Europa’s cracked ice.",
    fact1012: "Gravity measurements and surface geology support a global subsurface ocean, kept warm partly by tidal flexing.",
  },
  {
    title: "Titan",
    place: "Moon of Saturn",
    kind: "Hazy moon",
    field: "Planetary chemistry",
    search: "Titan moon lakes Cassini NASA",
    fact79: "Titan has rivers, lakes, clouds, and rain made mostly of methane instead of water.",
    fact1012: "Titan’s methane cycle resembles Earth’s water cycle in shape, but operates at far lower temperatures.",
  },
  {
    title: "Enceladus",
    place: "Moon of Saturn",
    kind: "Ocean moon",
    field: "Astrobiology",
    search: "Enceladus geysers Cassini NASA",
    fact79: "Enceladus sprays water-rich material from cracks near its south pole.",
    fact1012: "Cassini sampled plume material linked to a subsurface ocean, revealing salts and organic compounds.",
  },
  {
    title: "Asteroid Belt",
    place: "Between Mars and Jupiter",
    kind: "Small worlds",
    field: "Solar system history",
    search: "asteroid belt Ceres Vesta NASA",
    fact79: "The asteroid belt contains rocky leftovers from the solar system’s formation, but it is mostly empty space.",
    fact1012: "Jupiter’s gravity disrupted material in this region, preventing it from assembling into a full-sized planet.",
  },
  {
    title: "A comet’s journey",
    place: "Across the solar system",
    kind: "Icy traveler",
    field: "Orbital science",
    search: "comet nucleus tail space",
    fact79: "A comet grows a glowing coma and tails when sunlight warms its ice.",
    fact1012: "Gas and dust flow from a warming nucleus; solar wind and radiation push separate tails away from the Sun.",
  },
  {
    title: "Milky Way",
    place: "Our home galaxy",
    kind: "Galaxy",
    field: "Astronomy",
    search: "Milky Way night sky panorama",
    fact79: "Our solar system is one tiny neighborhood inside the Milky Way galaxy.",
    fact1012: "The Milky Way is a barred spiral galaxy containing hundreds of billions of stars, gas, dust, and dark matter.",
  },
  {
    title: "Andromeda Galaxy",
    place: "About 2.5 million light-years away",
    kind: "Galaxy",
    field: "Cosmology",
    search: "Andromeda Galaxy M31",
    fact79: "Andromeda is the nearest large galaxy to the Milky Way.",
    fact1012: "Andromeda and the Milky Way are moving toward one another and are expected to interact billions of years from now.",
  },
  {
    title: "Orion Nebula",
    place: "Orion · Milky Way",
    kind: "Star nursery",
    field: "Star formation",
    search: "Orion Nebula M42 telescope",
    fact79: "New stars are forming inside the glowing gas and dust of the Orion Nebula.",
    fact1012: "Gravity collapses dense pockets of molecular cloud until protostars form and begin heating their surroundings.",
  },
  {
    title: "Cosmic Cliffs",
    place: "Carina Nebula",
    kind: "Star nursery",
    field: "Star formation",
    search: "Cosmic Cliffs Carina Webb",
    fact79: "Young stars are shaping enormous clouds of gas and dust in the Carina Nebula.",
    fact1012: "Ultraviolet radiation and stellar winds erode the cloud edge while compressed regions may continue forming stars.",
  },
  {
    title: "Pillars of Creation",
    place: "Eagle Nebula",
    kind: "Interstellar cloud",
    field: "Astronomy",
    search: "Pillars of Creation Webb Hubble",
    fact79: "These towering clouds contain the ingredients for new stars.",
    fact1012: "Dense columns resist erosion longer than nearby gas while embedded protostars continue to develop.",
  },
  {
    title: "M87 black hole",
    place: "Galaxy Messier 87",
    kind: "Black hole",
    field: "Gravity",
    search: "M87 black hole Event Horizon Telescope",
    fact79: "Scientists combined radio telescopes around Earth to make the first image of a black hole’s shadow.",
    fact1012: "Very-long-baseline interferometry linked observatories into an Earth-sized virtual telescope with extraordinary resolution.",
  },
  {
    title: "Crab Nebula",
    place: "Taurus · Milky Way",
    kind: "Supernova remnant",
    field: "Stellar evolution",
    search: "Crab Nebula telescope pulsar",
    fact79: "The Crab Nebula is debris from a star explosion seen from Earth nearly a thousand years ago.",
    fact1012: "A rapidly spinning neutron star energizes expanding gas left by a supernova recorded in 1054.",
  },
  {
    title: "TRAPPIST-1",
    place: "About 40 light-years away",
    kind: "Planetary system",
    field: "Exoplanets",
    search: "TRAPPIST-1 planets artist impression",
    fact79: "Seven rocky planets orbit the small, cool star TRAPPIST-1.",
    fact1012: "Astronomers measured repeated dips in starlight to determine the planets’ sizes and orbital periods.",
  },
  {
    title: "Hypatia",
    place: "Alexandria · Egypt",
    kind: "Thinker",
    field: "Mathematics",
    search: "Hypatia Alexandria art portrait",
    fact79: "Hypatia taught mathematics and astronomy in ancient Alexandria.",
    fact1012: "Hypatia became known for teaching and commenting on mathematical and astronomical works in late antiquity.",
  },
  {
    title: "Al-Khwarizmi",
    place: "Baghdad · Abbasid Caliphate",
    kind: "Thinker",
    field: "Algebra",
    search: "Al Khwarizmi mathematics manuscript",
    fact79: "The word “algebra” comes from the title of one of al-Khwarizmi’s books.",
    fact1012: "His systematic methods for solving equations helped establish algebra as a distinct field of mathematics.",
  },
  {
    title: "Aryabhata",
    place: "India",
    kind: "Thinker",
    field: "Mathematics and astronomy",
    search: "Aryabhata mathematician India statue",
    fact79: "Aryabhata used mathematics to study numbers, time, and the sky.",
    fact1012: "Aryabhata developed influential methods in arithmetic, trigonometry, and mathematical astronomy.",
  },
  {
    title: "Fibonacci",
    place: "Pisa · Italy",
    kind: "Thinker",
    field: "Number patterns",
    search: "Fibonacci spiral mathematics nature",
    fact79: "A number pattern named for Fibonacci appears in models of spirals and plant growth.",
    fact1012: "In the Fibonacci sequence each term is the sum of the previous two; related ratios approach the golden ratio.",
  },
  {
    title: "Katherine Johnson",
    place: "NASA · United States",
    kind: "Space mathematician",
    field: "Orbital mathematics",
    search: "Katherine Johnson NASA mathematician",
    fact79: "Katherine Johnson calculated flight paths that helped astronauts travel safely through space.",
    fact1012: "Her analytic geometry work supported crewed orbital missions and helped verify early computer calculations.",
  },
  {
    title: "Mae Jemison",
    place: "Space Shuttle Endeavour",
    kind: "Astronaut",
    field: "Medicine and spaceflight",
    search: "Mae Jemison astronaut NASA",
    fact79: "Mae Jemison became the first Black woman to travel in space.",
    fact1012: "Jemison combined engineering, medicine, and astronaut training during a mission that carried scientific experiments.",
  },
  {
    title: "Kalpana Chawla",
    place: "NASA Space Shuttle program",
    kind: "Astronaut",
    field: "Aerospace engineering",
    search: "Kalpana Chawla astronaut NASA",
    fact79: "Kalpana Chawla grew up fascinated by flight and became the first woman of Indian origin in space.",
    fact1012: "Her path from aeronautical engineering to spaceflight shows how mathematics, design, and persistence work together.",
  },
  {
    title: "Carl Sagan",
    place: "Cornell University · United States",
    kind: "Science communicator",
    field: "Planetary science",
    search: "Carl Sagan Cosmos portrait",
    fact79: "Carl Sagan helped millions of people feel curious about planets, life, and our place in the universe.",
    fact1012: "Sagan studied planetary atmospheres and used clear storytelling to connect scientific evidence with human perspective.",
  },
];

const LENSES: MissionLens[] = [
  {
    name: "Patterns & Evidence",
    imageCue: "patterns detail photograph",
    observe: [
      "List three shapes, colors, or repeating patterns you can see.",
      "Choose one detail that might be evidence of change.",
      "Explain what makes your idea testable instead of just a guess.",
    ],
    story: (topic) => `Your field notebook from ${topic.place} contains a pattern no earlier explorer noticed. What does it reveal about ${topic.title}?`,
    imagine: (topic) => `Turn one real pattern from ${topic.title} into the plan for a completely new landscape. Label what remains scientifically possible.`,
    connection79: "Scientists begin by noticing carefully and asking questions they can investigate.",
    connection1012: "Evidence becomes stronger when observations are repeatable and alternative explanations are compared.",
  },
  {
    name: "Forces & Change",
    imageCue: "erosion forces change science photograph",
    observe: [
      "Find a clue showing motion or change—even if it happened slowly.",
      "Name the strongest force you think is acting here.",
      "Predict one visible difference after another 100 years.",
    ],
    story: (topic) => `A sensor at ${topic.title} records a change that should have taken a century—but it happened overnight. Write the expedition team’s next decision.`,
    imagine: (topic) => `Redesign ${topic.title} after changing one force: gravity, wind, water, heat, or magnetism. Show three consequences.`,
    connection79: "Gravity, moving water, wind, heat, and living things can reshape a place over time.",
    connection1012: "Rates of change depend on energy, material strength, feedback loops, and the time scale being measured.",
  },
  {
    name: "Maps & Scale",
    imageCue: "map aerial satellite wide view",
    observe: [
      "Identify a foreground, middle distance, and far distance.",
      "Sketch a simple map using five symbols and a compass direction.",
      "What important information would your map leave out?",
    ],
    story: (topic) => `Your map of ${topic.title} disagrees with the view from above. Follow the scale, symbols, and compass clues to explain why.`,
    imagine: (topic) => `Create a map legend for a new world inspired by ${topic.title}. Include terrain, water or energy, settlements, and one danger.`,
    connection79: "Maps use symbols and scale to shrink huge places into something we can study.",
    connection1012: "Every map projection preserves some properties while distorting distance, area, shape, or direction.",
  },
  {
    name: "Life & Adaptation",
    imageCue: "life wildlife habitat ecosystem photograph",
    observe: [
      "Find two resources a living thing could use here.",
      "Identify one challenge involving temperature, water, food, or shelter.",
      "Design a feature that would help an organism survive that challenge.",
    ],
    story: (topic) => `The expedition at ${topic.title} finds a living thing that survives in an unexpected way. Describe its evidence before naming it.`,
    imagine: (topic) => `Invent an organism adapted to ${topic.title}. Draw how it gets energy, manages temperature, and protects its young.`,
    connection79: "Useful traits can help living things survive and have offspring in a particular habitat.",
    connection1012: "Adaptation happens across generations as heritable traits affect survival and reproduction in an environment.",
  },
  {
    name: "Future Worlds",
    imageCue: "research exploration future engineering photograph",
    observe: [
      "Separate what is natural from what people designed or could design.",
      "Name one problem an explorer, engineer, or community must solve.",
      "Choose a solution and list one benefit and one tradeoff.",
    ],
    story: (topic) => `It is the year 2126, and a young research team returns to ${topic.title}. What has changed, and what did people wisely protect?`,
    imagine: (topic) => `Design a vehicle, habitat, or scientific instrument for ${topic.title}. Label its energy source, materials, and safety system.`,
    connection79: "Engineering means using science, creativity, and testing to solve a real problem.",
    connection1012: "Good designs balance constraints such as energy, mass, cost, durability, ethics, and environmental impact.",
  },
];

const THINKER_LENSES: MissionLens[] = [
  {
    name: "Patterns & Questions",
    imageCue: "portrait notebook manuscript mathematics",
    observe: [
      "Notice three clues about the time, tools, or ideas in the image.",
      "Write one question this thinker may have asked.",
      "Name the evidence that could help answer your question.",
    ],
    story: (topic) => `A forgotten notebook from ${topic.title} contains one unfinished pattern. Your team must decide what the next line should be—and defend the choice.`,
    imagine: (topic) => `Turn one idea from ${topic.title}’s work into a picture that a younger child could understand without words.`,
    connection79: "Great thinkers notice patterns, ask clear questions, and keep improving their explanations.",
    connection1012: "A useful hypothesis connects a focused question to evidence that could support or challenge it.",
  },
  {
    name: "Ideas That Changed Things",
    imageCue: "scientific work discovery historical photograph",
    observe: [
      "Identify one tool, symbol, or method connected with this person’s work.",
      "Imagine what people understood before this idea was developed.",
      "Explain how a new method could change what people are able to do.",
    ],
    story: (topic) => `${topic.title} receives evidence that challenges an accepted idea. Write the conversation in which the evidence—not authority—changes the team’s mind.`,
    imagine: (topic) => `Design a modern experiment, model, or artwork inspired by ${topic.title}. Label what you would measure or test.`,
    connection79: "New ideas become powerful when other people can understand, test, and improve them.",
    connection1012: "Scientific and mathematical progress often comes from better models, measurements, notation, or methods—not isolated facts.",
  },
  {
    name: "Journeys & Maps",
    imageCue: "biography place mission map timeline",
    observe: [
      "Find a clue about where or when this person worked.",
      "Sketch a four-stop timeline from curiosity to discovery.",
      "Mark one obstacle and the decision that could move the journey forward.",
    ],
    story: (topic) => `A map of ${topic.title}’s journey is missing its most important turning point. Write the scene and add it to the timeline.`,
    imagine: (topic) => `Create a map of ideas inspired by ${topic.title}: begin with one question, branch into three clues, and end with a discovery.`,
    connection79: "Learning is a journey made of questions, practice, mistakes, and new attempts.",
    connection1012: "Biographies reveal how opportunity, education, collaboration, and historical context influence discovery.",
  },
  {
    name: "Courage & Collaboration",
    imageCue: "team classroom laboratory astronaut crew",
    observe: [
      "Name two skills a research team would need beyond being “smart.”",
      "Find one task that is safer or stronger when people collaborate.",
      "Describe how a respectful team could disagree about evidence.",
    ],
    story: (topic) => `A young researcher joins ${topic.title}’s team with a different solution. Write how the team tests both ideas fairly.`,
    imagine: (topic) => `Build a six-person discovery team inspired by ${topic.title}. Give every member a different skill and an important job.`,
    connection79: "Curiosity grows when people share ideas, listen carefully, and are brave enough to try again.",
    connection1012: "Diverse teams can expose hidden assumptions, generate more approaches, and strengthen how evidence is interpreted.",
  },
  {
    name: "Future Worlds",
    imageCue: "legacy future science education exploration",
    observe: [
      "Identify one idea from this person’s work that still matters.",
      "Name a future problem that could use a similar way of thinking.",
      "Choose a solution and list one benefit and one tradeoff.",
    ],
    story: (topic) => `In 2126, a student uses an idea connected with ${topic.title} to solve a problem nobody can solve today. Tell the moment the solution becomes clear.`,
    imagine: (topic) => `Design a future mission, classroom, or invention inspired by ${topic.title}. Label its purpose, evidence, and ethical safeguard.`,
    connection79: "A thinker’s greatest gift may be a question that future generations continue exploring.",
    connection1012: "Responsible innovation connects technical possibility with evidence, ethics, access, and long-term consequences.",
  },
];

const stripNumber = (value: number) => Math.max(1, Math.round(value));

export function buildDiscoveryMission(page: number, age: number) {
  const missionIndex = Math.max(0, Math.min(399, page - 1));
  const topic = TOPICS[missionIndex % TOPICS.length];
  const isThinker = ["Thinker", "Space mathematician", "Astronaut", "Science communicator"].includes(topic.kind);
  const lens = (isThinker ? THINKER_LENSES : LENSES)[Math.floor(missionIndex / TOPICS.length)];
  const seed = missionIndex + 1;
  const older = age === 3;

  const mathMode = seed % 5;
  let question = "";
  let answer = 0;
  let hint = "";

  if (!older) {
    if (mathMode === 0) {
      const days = (seed % 7) + 3;
      const rate = (seed % 9) + 4;
      answer = days * rate;
      question = `An explorer records ${rate} observations per day for ${days} days. How many observations is that?`;
      hint = "Multiply the number recorded each day by the number of days.";
    } else if (mathMode === 1) {
      const groups = (seed % 6) + 3;
      const samples = (seed % 8) + 5;
      answer = groups * samples;
      question = `${groups} teams each collect ${samples} safe samples. How many samples do they collect altogether?`;
      hint = "Think of equal groups.";
    } else if (mathMode === 2) {
      const width = (seed % 9) + 4;
      const length = (seed % 11) + 6;
      answer = 2 * (width + length);
      question = `A rectangular study zone is ${length} m long and ${width} m wide. What is its perimeter in meters?`;
      hint = "Add all four sides.";
    } else if (mathMode === 3) {
      const total = ((seed % 8) + 4) * 6;
      const fraction = seed % 2 === 0 ? 2 : 3;
      answer = total / fraction;
      question = `A mission has ${total} minutes. One-${fraction === 2 ? "half" : "third"} is for drawing. How many drawing minutes are there?`;
      hint = `Divide the total into ${fraction} equal parts.`;
    } else {
      const centimeters = (seed % 8) + 3;
      const scale = (seed % 5) + 5;
      answer = centimeters * scale;
      question = `On a map, 1 cm represents ${scale} km. Two points are ${centimeters} cm apart. How many kilometers apart are they?`;
      hint = "Multiply map distance by the scale.";
    }
  } else if (mathMode === 0) {
    const speed = (seed % 8) + 12;
    const hours = (seed % 5) + 3;
    answer = speed * hours;
    question = `A rover averages ${speed} km/h for ${hours} hours. How far does it travel?`;
    hint = "Distance equals speed multiplied by time.";
  } else if (mathMode === 1) {
    const centimeters = (seed % 9) + 4;
    const scale = ((seed % 6) + 2) * 50;
    answer = centimeters * scale;
    question = `A map scale is 1 cm : ${scale} km. A route measures ${centimeters} cm. What is the real distance?`;
    hint = "Multiply the map length by the scale value.";
  } else if (mathMode === 2) {
    const width = (seed % 12) + 8;
    const length = (seed % 15) + 12;
    answer = width * length;
    question = `A survey rectangle measures ${length} m by ${width} m. What is its area in square meters?`;
    hint = "Area of a rectangle is length × width.";
  } else if (mathMode === 3) {
    const total = ((seed % 9) + 6) * 12;
    const percent = seed % 2 === 0 ? 25 : 75;
    answer = stripNumber(total * (percent / 100));
    question = `A data set has ${total} readings. ${percent}% passed review. How many readings passed?`;
    hint = percent === 25 ? "Twenty-five percent is one quarter." : "Seventy-five percent is three quarters.";
  } else {
    const base = (seed % 8) + 3;
    const exponent = (seed % 3) + 3;
    answer = base * 10 ** exponent;
    question = `Write ${base} × 10^${exponent} as an ordinary number.`;
    hint = `Move the decimal point ${exponent} places to the right.`;
  }

  return {
    number: seed,
    title: `${topic.title}: ${lens.name}`,
    topicTitle: topic.title,
    place: topic.place,
    kind: topic.kind,
    field: topic.field,
    lens: lens.name,
    /** The topic itself, so the card can draw or show its approved image. */
    topic,
    fact: `${older ? topic.fact1012 : topic.fact79} ${older ? lens.connection1012 : lens.connection79}`,
    observe: lens.observe,
    story: lens.story(topic),
    imagine: lens.imagine(topic),
    question: `${topic.title} · ${lens.name}: ${question}`,
    answer,
    hint,
  };
}

export const DISCOVERY_COUNTS = {
  missions: TOPICS.length * LENSES.length,
  subjects: TOPICS.length,
  lenses: LENSES.length,
};
