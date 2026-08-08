import { cloneElement, type ReactElement, type ReactNode, type SVGProps, useEffect, useRef, useState } from "react";
import { ART_PAINTS, DEFAULT_PAINT, getArtPaint, paintCss, safeSvgId } from "./art-palette";
import { draftKey, loadDraft, saveDraft } from "./canvas-drafts";
import { SpeakButton, useAutoSpeak } from "./SpeechProvider";

type Scene = {
  id: string;
  title: string;
  aria: string;
  fact: string;
  imagine: string;
  parts: Array<ReactElement<SVGProps<SVGElement>>>;
  details?: ReactNode;
};

const ink = { stroke: "#173b6d", strokeWidth: 5.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const, vectorEffect: "non-scaling-stroke" as const };
const path = (d: string) => <path {...ink} fill="currentColor" d={d} />;
const circle = (cx: number, cy: number, r: number) => <circle {...ink} fill="currentColor" cx={cx} cy={cy} r={r} />;
const ellipse = (cx: number, cy: number, rx: number, ry: number, transform?: string) => <ellipse {...ink} fill="currentColor" cx={cx} cy={cy} rx={rx} ry={ry} transform={transform} />;
const rect = (x: number, y: number, width: number, height: number, rx = 10) => <rect {...ink} fill="currentColor" x={x} y={y} width={width} height={height} rx={rx} />;
const eyes = (points: Array<[number, number]>) => <>{points.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" fill="#173b6d" />)}</>;

/** Hand-built, offline SVG line art. Every scene has a different subject and silhouette. */
export const COLORING_SCENES: Scene[] = [
  {
    id: "lion-savanna", title: "Lion of the grasslands", aria: "a lion standing in an African grassland",
    fact: "A lion's roar can travel for several miles across open grassland.", imagine: "Give this lion a surprising job in its animal town.",
    parts: [circle(575, 198, 105), circle(575, 198, 70), ellipse(365, 320, 205, 112), path("M190 310 Q75 245 92 155 Q135 225 235 265Z"), rect(245, 385, 55, 90, 24), rect(430, 385, 55, 90, 24), path("M0 420 Q180 370 375 425 Q570 365 760 420 L760 500H0Z"), circle(105, 90, 52)],
    details: <>{eyes([[550, 188], [600, 188]])}<path d="M565 218 Q575 228 585 218 M545 245 Q575 265 605 245" {...ink} fill="none" /><path d="M95 420 L145 320 L195 420 M125 370 H165" {...ink} fill="none" /></>,
  },
  {
    id: "elephant-tulips", title: "Elephant in the tulip garden", aria: "an elephant gently watering tulips",
    fact: "An elephant's trunk contains tens of thousands of muscles.", imagine: "What tiny garden tool would an elephant invent?",
    parts: [ellipse(355, 300, 205, 120), circle(545, 250, 105), ellipse(492, 245, 72, 86), path("M620 270 Q700 330 630 415 Q595 430 578 395 Q630 360 585 300Z"), rect(225, 370, 70, 105, 27), rect(415, 370, 70, 105, 27), path("M0 420 Q180 365 380 425 Q560 365 760 420V500H0Z"), path("M80 390 Q115 320 150 390 Q115 430 80 390Z"), path("M630 390 Q665 315 702 390 Q666 430 630 390Z")],
    details: <>{eyes([[570, 230]])}<path d="M655 398 q35 10 50-18 M120 390v85 M666 390v85" {...ink} fill="none" /></>,
  },
  {
    id: "red-panda-bamboo", title: "Red panda in the bamboo", aria: "a red panda climbing bamboo",
    fact: "Red pandas use their long tails like warm blankets and balancing poles.", imagine: "Design a treetop bedroom for this red panda.",
    parts: [path("M280 175 L335 95 L375 175Z"), path("M485 175 L430 95 L390 175Z"), circle(382, 205, 120), ellipse(385, 355, 150, 108), path("M480 365 Q655 310 675 410 Q570 455 455 400Z"), ellipse(285, 330, 55, 35, "rotate(-30 285 330)"), ellipse(485, 330, 55, 35, "rotate(30 485 330)"), rect(105, 65, 38, 420, 15), rect(635, 45, 38, 440, 15)],
    details: <>{eyes([[345, 205], [420, 205]])}<path d="M365 245 Q382 260 400 245 M120 150l70-40 M120 255l-65-35 M654 170l-70-45 M654 300l60-35" {...ink} fill="none" /></>,
  },
  {
    id: "sea-turtle-reef", title: "Sea turtle reef", aria: "a sea turtle swimming above a coral reef",
    fact: "Sea turtles use Earth's magnetic field like a map during long journeys.", imagine: "Draw the underwater city this turtle is visiting.",
    parts: [ellipse(360, 250, 180, 120), path("M245 250 Q360 120 475 250 Q360 385 245 250Z"), circle(560, 245, 68), ellipse(230, 145, 70, 37, "rotate(35 230 145)"), ellipse(230, 360, 70, 37, "rotate(-35 230 360)"), ellipse(480, 145, 70, 37, "rotate(-30 480 145)"), ellipse(480, 365, 70, 37, "rotate(30 480 365)"), path("M0 430 Q190 390 380 438 Q570 390 760 430V500H0Z"), path("M70 455 Q60 330 110 300 Q135 365 155 315 Q180 380 160 455Z")],
    details: <>{eyes([[582, 230]])}<path d="M300 175 L420 330 M420 175 L300 330 M245 250H475" {...ink} fill="none" /><circle cx="655" cy="125" r="23" {...ink} fill="none" /><circle cx="690" cy="75" r="13" {...ink} fill="none" /></>,
  },
  {
    id: "penguin-family", title: "Penguin family", aria: "two penguins on an Antarctic ice shelf",
    fact: "Emperor penguin parents take turns protecting their chick and finding food.", imagine: "What game do these penguins play on the ice?",
    parts: [ellipse(300, 285, 105, 165), ellipse(300, 305, 67, 120), path("M220 280 Q135 315 205 385Z"), path("M380 280 Q465 315 395 385Z"), ellipse(505, 340, 74, 112), ellipse(505, 355, 47, 78), path("M0 420 Q180 380 385 425 Q570 380 760 420V500H0Z"), path("M0 170 Q110 90 220 175 L0 250Z"), path("M760 175 Q640 75 535 180 L760 255Z")],
    details: <>{eyes([[275, 240], [325, 240], [488, 315], [520, 315]])}<path d="M285 265l15 16 15-16 M495 335l10 12 10-12" {...ink} fill="none" /></>,
  },
  {
    id: "fox-forest", title: "Fox in the fern forest", aria: "a fox sitting among forest ferns",
    fact: "A fox can hear a small animal moving underground.", imagine: "What secret sound did this fox just hear?",
    parts: [path("M245 205 L285 75 L355 180Z"), path("M515 205 L475 75 L405 180Z"), path("M275 175 Q380 105 485 175 Q535 315 380 365 Q225 315 275 175Z"), ellipse(380, 390, 135, 82), path("M500 380 Q670 295 705 405 Q605 480 475 420Z"), path("M0 430 Q190 370 385 430 Q575 370 760 430V500H0Z"), path("M80 450 Q55 350 115 305 Q130 380 165 330 Q180 400 160 450Z"), path("M610 450 Q590 350 640 300 Q660 370 700 325 Q715 400 700 450Z")],
    details: <>{eyes([[335, 225], [425, 225]])}<path d="M360 265 L380 282 L400 265 M335 305 Q380 330 425 305" {...ink} fill="none" /></>,
  },
  {
    id: "giraffe-sunset", title: "Giraffe at sunset", aria: "a giraffe beside an acacia tree",
    fact: "A giraffe's tongue can be longer than a school ruler.", imagine: "Paint a sunset from the giraffe's tall point of view.",
    parts: [circle(105, 90, 55), ellipse(390, 335, 160, 92), path("M470 350 Q500 245 485 155 L560 145 Q575 260 545 365Z"), ellipse(525, 125, 78, 50), rect(290, 385, 45, 90, 18), rect(440, 385, 45, 90, 18), circle(340, 315, 25), circle(430, 345, 22), circle(520, 235, 20), path("M0 430 Q190 390 380 435 Q570 385 760 430V500H0Z"), path("M635 430 L675 195 L715 430Z")],
    details: <>{eyes([[548, 118]])}<path d="M490 82l-20-38 M545 80l15-40 M650 245h95 M648 295h85" {...ink} fill="none" /></>,
  },
  {
    id: "rabbit-garden", title: "Rabbit's vegetable patch", aria: "a rabbit holding a carrot in a garden",
    fact: "Rabbit teeth never stop growing, so chewing fibrous plants keeps them healthy.", imagine: "Invent one vegetable that does not exist yet.",
    parts: [ellipse(335, 120, 45, 100, "rotate(-12 335 120)"), ellipse(430, 120, 45, 100, "rotate(12 430 120)"), circle(382, 245, 105), ellipse(382, 390, 120, 95), ellipse(275, 360, 65, 35, "rotate(-30 275 360)"), ellipse(490, 360, 65, 35, "rotate(30 490 360)"), path("M610 265 Q660 315 615 410 Q570 315 610 265Z"), path("M610 270 Q555 215 585 185 Q620 220 610 270 Q665 205 695 235 Q665 275 610 270Z"), path("M0 440 Q200 385 380 445 Q560 385 760 440V500H0Z")],
    details: <>{eyes([[350, 230], [415, 230]])}<path d="M370 265l12 12 12-12 M350 292 Q382 312 415 292" {...ink} fill="none" /></>,
  },
  {
    id: "whale-ocean", title: "Whale and the little boat", aria: "a humpback whale swimming below a sailboat",
    fact: "Humpback whales sing long patterns that can travel through the ocean.", imagine: "Turn the whale's song into colors and shapes.",
    parts: [path("M125 280 Q250 125 510 225 Q600 260 650 210 Q635 310 545 330 Q310 420 125 280Z"), path("M145 280 Q65 225 55 330 Q115 325 170 300Z"), path("M390 315 Q470 430 525 330Z"), path("M0 390 Q180 350 380 400 Q560 350 760 390V500H0Z"), path("M510 110 L610 110 L560 165Z"), path("M560 25V110 L645 110Z"), circle(105, 85, 45), path("M610 350 Q640 285 675 350 Q715 290 735 365Z")],
    details: <>{eyes([[510, 247]])}<path d="M230 200 Q240 145 210 115 M250 205 Q280 155 270 120" {...ink} fill="none" /></>,
  },
  {
    id: "owl-oak", title: "Owl in the old oak", aria: "an owl perched on an oak branch under the moon",
    fact: "An owl's soft-edged feathers help it fly very quietly.", imagine: "What nighttime mystery is this owl solving?",
    parts: [circle(105, 90, 55), path("M250 175 L315 120 L380 170 L445 120 L510 175 Q535 365 380 415 Q225 365 250 175Z"), path("M275 250 Q180 300 275 380 Q335 335 345 250Z"), path("M485 250 Q580 300 485 380 Q425 335 415 250Z"), circle(325, 225, 55), circle(435, 225, 55), path("M110 415 Q370 360 650 410 L650 455 Q380 415 110 460Z"), path("M610 500 Q575 320 625 175 Q675 330 710 500Z")],
    details: <>{eyes([[325, 225], [435, 225]])}<path d="M360 270 L380 295 L400 270Z" fill="#173b6d" /></>,
  },
  {
    id: "horse-meadow", title: "Horse in a wildflower meadow", aria: "a horse trotting through a flower meadow",
    fact: "Horses can sleep both standing up and lying down.", imagine: "Design a colorful saddle for a journey through the clouds.",
    parts: [ellipse(370, 310, 210, 105), path("M480 310 Q500 190 570 145 L630 200 Q565 310 535 365Z"), path("M550 150 L550 80 L595 140Z"), path("M610 165 L650 90 L650 190Z"), rect(245, 375, 52, 100, 18), rect(435, 375, 52, 100, 18), path("M175 290 Q70 225 75 355 Q135 330 205 325Z"), path("M0 430 Q190 365 380 430 Q570 370 760 430V500H0Z"), circle(95, 95, 50)],
    details: <>{eyes([[600, 190]])}<path d="M520 195 Q490 145 475 95 M555 340 Q620 340 645 300" {...ink} fill="none" /></>,
  },
  {
    id: "frog-pond", title: "Frog on a lily pad", aria: "a frog sitting on a lily pad in a pond",
    fact: "Frogs absorb water through their skin instead of drinking it with their mouths.", imagine: "What would the frog announce at a pond concert?",
    parts: [circle(305, 185, 55), circle(455, 185, 55), ellipse(380, 280, 150, 118), path("M265 315 Q160 360 230 420 Q310 395 340 325Z"), path("M495 315 Q600 360 530 420 Q450 395 420 325Z"), ellipse(380, 425, 285, 62), path("M0 445 Q190 400 380 450 Q570 400 760 445V500H0Z"), path("M95 420 L95 260 Q55 230 40 285 Q70 305 95 285 Q125 225 150 270 Q130 305 95 290"), circle(655, 100, 50)],
    details: <>{eyes([[305, 185], [455, 185]])}<path d="M315 290 Q380 345 445 290" {...ink} fill="none" /></>,
  },
  {
    id: "toucan-rainforest", title: "Toucan in the rainforest", aria: "a toucan perched among rainforest leaves",
    fact: "A toucan's large bill helps it reach fruit on branches that are too small to stand on.", imagine: "Fill the rainforest with three never-before-seen plants.",
    parts: [ellipse(365, 285, 120, 155, "rotate(-12 365 285)"), path("M415 190 Q585 105 685 210 Q575 285 415 250Z"), path("M285 220 Q205 145 210 300 Q270 330 315 285Z"), path("M330 405 L300 475 L370 430Z"), path("M405 410 L440 480 L455 420Z"), path("M70 500 Q35 355 120 285 Q145 380 190 315 Q210 420 175 500Z"), path("M590 500 Q550 360 635 290 Q660 380 710 320 Q730 420 700 500Z"), path("M100 410 Q360 365 655 410 L650 450 Q375 415 105 455Z")],
    details: <>{eyes([[415, 205]])}<path d="M520 220 Q585 205 635 215" {...ink} fill="none" /></>,
  },
  {
    id: "octopus-treasure", title: "Octopus and the treasure", aria: "an octopus discovering a treasure chest",
    fact: "An octopus has three hearts and can taste with its arms.", imagine: "What strange treasure is hidden inside the chest?",
    parts: [path("M260 215 Q265 85 380 85 Q495 85 500 215 Q510 330 380 340 Q250 330 260 215Z"), path("M285 305 Q165 330 205 435 Q260 445 300 350Z"), path("M335 325 Q250 400 310 475 Q365 445 370 345Z"), path("M425 325 Q510 400 450 475 Q395 445 390 345Z"), path("M475 305 Q595 330 555 435 Q500 445 460 350Z"), rect(555, 330, 150, 105, 12), path("M545 330 Q630 250 715 330Z"), path("M0 445 Q190 405 380 450 Q570 405 760 445V500H0Z")],
    details: <>{eyes([[340, 205], [420, 205]])}<path d="M350 255 Q380 275 410 255" {...ink} fill="none" /><circle cx="630" cy="370" r="12" fill="#173b6d" /></>,
  },
  {
    id: "tiger-waterfall", title: "Tiger by the waterfall", aria: "a tiger beside a jungle waterfall",
    fact: "Every tiger has its own unique stripe pattern, like a fingerprint.", imagine: "Add a hidden doorway behind the waterfall.",
    parts: [path("M255 185 L300 85 L355 175Z"), path("M505 185 L460 85 L405 175Z"), circle(380, 225, 145), ellipse(380, 405, 155, 78), path("M555 40 H720 V410 Q635 370 555 410Z"), path("M0 430 Q185 370 380 430 Q570 370 760 430V500H0Z"), path("M70 430 Q35 330 105 270 Q130 365 180 300 Q195 390 165 430Z"), circle(110, 90, 48)],
    details: <>{eyes([[330, 225], [430, 225]])}<path d="M365 265l15 15 15-15 M335 300 Q380 330 425 300 M285 165l55 35 M475 165l-55 35 M270 240l62 12 M490 240l-62 12" {...ink} fill="none" /></>,
  },
  {
    id: "koala-tree", title: "Koala in a eucalyptus tree", aria: "a koala hugging a eucalyptus tree",
    fact: "Koalas have two thumbs on each front paw for gripping branches.", imagine: "Create a leafy elevator for the koala.",
    parts: [circle(300, 210, 78), circle(460, 210, 78), circle(380, 235, 120), ellipse(380, 390, 110, 95), ellipse(300, 350, 65, 35, "rotate(-40 300 350)"), ellipse(460, 350, 65, 35, "rotate(40 460 350)"), path("M610 500 Q570 310 625 90 Q690 310 710 500Z"), ellipse(580, 160, 70, 32, "rotate(-35 580 160)"), ellipse(690, 235, 70, 32, "rotate(35 690 235)")],
    details: <>{eyes([[345, 220], [415, 220]])}<ellipse cx="380" cy="260" rx="25" ry="31" fill="#173b6d" /><path d="M360 300 Q380 316 400 300" {...ink} fill="none" /></>,
  },
  {
    id: "tulip-windmill", title: "Tulips and a windmill", aria: "rows of tulips leading to a windmill",
    fact: "Tulip flowers continue growing a little even after they are cut.", imagine: "Design a flower that changes color with the wind.",
    parts: [path("M0 380 Q180 330 380 385 Q570 330 760 380V500H0Z"), circle(105, 90, 52), path("M505 420 L545 190 L650 190 L695 420Z"), path("M595 210 L565 55 L625 55Z"), path("M595 210 L740 155 L745 215Z"), path("M595 210 L625 365 L565 365Z"), path("M595 210 L450 265 L445 205Z"), path("M95 330 Q125 260 155 330 Q125 375 95 330Z"), path("M250 360 Q285 275 320 360 Q285 410 250 360Z"), path("M410 345 Q445 260 480 345 Q445 395 410 345Z")],
    details: <path d="M125 340V475 M285 370V475 M445 355V475 M575 285h70 M595 190v220" {...ink} fill="none" />,
  },
  {
    id: "sunflower-bee", title: "Sunflower and busy bee", aria: "a bee flying around a large sunflower",
    fact: "Bees share the direction of good flowers with a waggle dance.", imagine: "Draw the dance route the bee will show its hive.",
    parts: [circle(300, 245, 55), ...Array.from({ length: 8 }, (_, i) => ellipse(300 + Math.cos(i * Math.PI / 4) * 95, 245 + Math.sin(i * Math.PI / 4) * 95, 55, 28, `rotate(${i * 45} ${300 + Math.cos(i * Math.PI / 4) * 95} ${245 + Math.sin(i * Math.PI / 4) * 95})`)), ellipse(590, 190, 70, 45), ellipse(545, 145, 43, 27, "rotate(-30 545 145)"), ellipse(635, 145, 43, 27, "rotate(30 635 145)"), path("M0 430 Q190 380 380 435 Q570 380 760 430V500H0Z")],
    details: <><path d="M300 300V480 M300 380 Q230 335 215 405 Q270 425 300 395 M300 395 Q360 345 390 410 Q340 435 300 415 M560 175h60 M565 200h60" {...ink} fill="none" />{eyes([[615, 180]])}</>,
  },
  {
    id: "mountain-lake", title: "Mountain lake", aria: "snowy mountains reflected in a lake",
    fact: "Glaciers can carve deep valleys that later fill with lakes.", imagine: "Invent an animal adapted to live on these peaks.",
    parts: [circle(105, 90, 52), path("M20 355 L225 105 L420 355Z"), path("M260 355 L500 65 L745 355Z"), path("M145 205 L225 105 L305 205 L260 190 L225 220 L190 190Z M405 180 L500 65 L595 180 L540 165 L500 205 L455 165Z"), path("M0 355 Q190 320 380 365 Q570 320 760 355V500H0Z"), path("M0 430 Q190 390 380 440 Q570 390 760 430V500H0Z"), path("M75 430 L125 300 L175 430Z"), path("M590 430 L650 275 L710 430Z")],
  },
  {
    id: "desert-roadrunner", title: "Roadrunner desert", aria: "a roadrunner beside tall desert cacti",
    fact: "Roadrunners can run about as fast as a bicycle in a neighborhood.", imagine: "Build a shady desert rest stop for every animal.",
    parts: [circle(105, 90, 55), ellipse(390, 310, 135, 75), path("M470 290 Q560 205 625 265 Q570 340 485 335Z"), path("M295 310 Q175 265 125 355 Q225 365 320 340Z"), path("M385 365 L335 465 L385 405Z"), path("M430 365 L485 465 L435 405Z"), path("M0 425 Q190 370 380 430 Q570 370 760 425V500H0Z"), path("M650 420 V195 Q600 190 600 140 V270 H650 M650 305 Q710 305 710 250 V360 H650Z")],
    details: <>{eyes([[550, 260]])}<path d="M625 270l75 10 M520 230l-20-55 M535 235l5-65" {...ink} fill="none" /></>,
  },
  {
    id: "astronaut-moon", title: "Astronaut on the Moon", aria: "an astronaut exploring the Moon with Earth overhead",
    fact: "On the Moon, you would weigh about one-sixth as much as you do on Earth.", imagine: "What friendly discovery waits inside the crater?",
    parts: [circle(620, 100, 62), circle(350, 180, 82), rect(275, 250, 150, 145, 30), rect(220, 265, 55, 135, 22), rect(425, 265, 55, 135, 22), rect(295, 380, 55, 95, 20), rect(370, 380, 55, 95, 20), path("M0 420 Q170 360 350 425 Q555 350 760 420V500H0Z"), ellipse(110, 430, 85, 28), ellipse(610, 445, 105, 32)],
    details: <><path d="M300 170 Q350 125 400 170 V215 H300Z" {...ink} fill="#dff5ff" /><path d="M305 305h90 M335 285v40 M370 285v40" {...ink} fill="none" /><circle cx="335" cy="335" r="8" fill="#173b6d" /><circle cx="370" cy="335" r="8" fill="#173b6d" /></>,
  },
  {
    id: "rocket-planets", title: "Rocket through the planets", aria: "a rocket flying past colorful planets",
    fact: "Our solar system has eight planets orbiting one star, the Sun.", imagine: "Design a ninth imaginary world and its weather.",
    parts: [path("M350 65 Q475 145 475 320 Q410 395 350 430 Q290 395 225 320 Q225 145 350 65Z"), circle(350, 215, 50), path("M250 285 L135 390 L280 355Z"), path("M450 285 L565 390 L420 355Z"), path("M315 410 L350 490 L385 410Z"), circle(625, 105, 62), circle(105, 120, 45), ellipse(610, 335, 90, 55), path("M505 335 Q610 300 715 335 Q610 370 505 335Z")],
    details: <path d="M80 280l12 28 30 3-23 19 7 30-26-16-26 16 7-30-23-19 30-3Z" {...ink} fill="none" />,
  },
  {
    id: "castle-dragon", title: "Kind dragon's castle", aria: "a smiling dragon flying above a castle",
    fact: "Many dragon legends combine features from real animals such as snakes, birds, and crocodiles.", imagine: "What helpful invention does this dragon bring to the castle?",
    parts: [rect(110, 255, 150, 210, 4), rect(500, 255, 150, 210, 4), rect(240, 315, 280, 150, 4), path("M95 255 L185 160 L275 255Z"), path("M485 255 L575 160 L665 255Z"), path("M270 135 Q390 55 505 145 Q545 230 440 260 Q315 270 270 135Z"), path("M295 165 Q195 115 205 225 Q265 225 320 200Z"), path("M455 160 Q565 110 555 225 Q500 225 430 200Z"), path("M0 430 Q190 380 380 435 Q570 380 760 430V500H0Z")],
    details: <>{eyes([[420, 145]])}<path d="M450 180 Q470 195 490 178 M320 260 Q280 315 225 290 M380 260 Q390 325 440 335 M305 105l-25-45 M355 88l-5-50" {...ink} fill="none" /><path d="M350 365 Q380 325 410 365V465H350Z" {...ink} fill="none" /></>,
  },
  {
    id: "train-country", title: "Countryside train", aria: "a cheerful train crossing the countryside",
    fact: "Train wheels are slightly cone-shaped, which helps keep them centered on the rails.", imagine: "Where is this train going, and who is aboard?",
    parts: [rect(170, 245, 300, 150, 25), rect(375, 160, 145, 235, 18), path("M85 395 Q95 285 195 260 V395Z"), circle(205, 410, 55), circle(420, 410, 55), circle(105, 90, 52), path("M0 430 Q190 380 380 435 Q570 380 760 430V500H0Z"), path("M560 430 L610 275 L660 430Z"), path("M520 195 Q575 125 630 195Z")],
    details: <><path d="M395 190h105v85H395Z M135 395h420 M80 465h600" {...ink} fill="none" /><circle cx="135" cy="335" r="8" fill="#173b6d" /><path d="M115 355 Q135 370 155 355" {...ink} fill="none" /></>,
  },
  {
    id: "butterfly-meadow", title: "Butterfly meadow", aria: "a patterned butterfly above a meadow",
    fact: "Butterflies taste plants with sensors on their feet.", imagine: "Invent a wing pattern that tells a tiny story.",
    parts: [ellipse(300, 205, 110, 82, "rotate(28 300 205)"), ellipse(330, 320, 78, 62, "rotate(-25 330 320)"), ellipse(500, 205, 110, 82, "rotate(-28 500 205)"), ellipse(470, 320, 78, 62, "rotate(25 470 320)"), ellipse(400, 270, 34, 130), circle(300, 205, 25), circle(500, 205, 25), path("M0 420 Q190 365 380 425 Q570 365 760 420V500H0Z"), circle(105, 90, 50)],
    details: <path d="M388 140 Q350 75 320 100 M412 140 Q450 75 480 100" {...ink} fill="none" />,
  },
  {
    id: "dinosaur-valley", title: "Dinosaur valley", aria: "a long-necked dinosaur walking through a fern valley",
    fact: "Fossils show that dinosaurs lived on every continent, including Antarctica.", imagine: "What would this dinosaur pack for a very long trip?",
    parts: [ellipse(345, 340, 205, 105), path("M470 350 Q520 215 570 105 Q620 115 620 175 Q555 280 540 390Z"), circle(595, 110, 58), path("M155 330 Q40 260 60 420 Q130 385 210 365Z"), rect(245, 400, 55, 78, 20), rect(430, 400, 55, 78, 20), circle(300, 325, 25), circle(390, 355, 22), path("M0 435 Q190 380 380 440 Q570 380 760 435V500H0Z"), path("M70 445 Q45 345 110 290 Q135 370 170 320 Q195 400 165 445Z")],
    details: <>{eyes([[615, 100]])}<path d="M610 135 Q630 150 648 133" {...ink} fill="none" /></>,
  },
  {
    id: "cat-bookshop", title: "Cat's tiny bookshop", aria: "a cat reading inside a cozy bookshop",
    fact: "Cats use their whiskers to sense nearby objects and narrow spaces.", imagine: "Name the funniest book on this shop's shelves.",
    parts: [path("M260 210 L300 85 L360 195Z"), path("M500 210 L460 85 L400 195Z"), circle(380, 235, 130), ellipse(380, 410, 135, 80), path("M275 360 Q190 330 205 440 Q270 435 325 395Z"), path("M485 360 Q570 330 555 440 Q490 435 435 395Z"), rect(65, 95, 125, 360, 10), rect(570, 95, 125, 360, 10), path("M320 355 Q380 320 440 355 V450 Q380 420 320 450Z")],
    details: <>{eyes([[335, 225], [425, 225]])}<path d="M365 265l15 15 15-15 M325 285l-90-15 M325 300l-90 10 M435 285l90-15 M435 300l90 10 M75 180h105 M75 270h105 M580 180h105 M580 270h105" {...ink} fill="none" /></>,
  },
];

function PaintPart({ id, paintId, onPaint, children }: { id: number; paintId?: string; onPaint: (id: number) => void; children: ReactElement<SVGProps<SVGElement>> }) {
  const paint = getArtPaint(paintId || "snow");
  const gradientId = `color-part-${id}-${safeSvgId(paint.id)}`;
  return (
    <g role="button" tabIndex={0} aria-label={`Color part ${id + 1}`} onClick={() => onPaint(id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onPaint(id); }} style={{ cursor: "pointer" }}>
      {paint.colors.length > 1 && <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">{paint.colors.map((color, index) => <stop key={color} offset={`${index / (paint.colors.length - 1) * 100}%`} stopColor={color} />)}</linearGradient></defs>}
      {cloneElement(children, { fill: paint.colors.length > 1 ? `url(#${gradientId})` : paint.colors[0] })}
    </g>
  );
}

export default function ColoringStudio({ page, age, profileId, profileName, onComplete, onSaveArtwork }: { page: number; age: number; profileId: string; profileName: string; onComplete: () => void; onSaveArtwork: (dataUrl: string, title: string) => Promise<void> }) {
  const scene = COLORING_SCENES[(page - 1 + age * 6) % COLORING_SCENES.length];
  const svgRef = useRef<SVGSVGElement>(null);
  const completed = useRef(false);
  const [selectedPaint, setSelectedPaint] = useState(DEFAULT_PAINT);
  const [fills, setFills] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [showGradients, setShowGradients] = useState(age > 0);
  const id = draftKey(profileId, "color", age, page);

  useAutoSpeak([scene.title, "Pick a color or gradient, then tap a part of the picture.", scene.fact], `color-${age}-${page}`);

  useEffect(() => {
    let cancelled = false;
    loadDraft(id).then((draft) => {
      if (cancelled || !draft?.coloring) return;
      setFills(draft.coloring.fills || {});
      setSelectedPaint(draft.coloring.selectedPaint || DEFAULT_PAINT);
      setMessage("Your recent coloring is ready to continue.");
    });
    return () => { cancelled = true; };
  }, [id]);

  const persist = (nextFills: Record<number, string>, nextPaint = selectedPaint) => {
    void saveDraft({ id, ink: "", shapes: [], background: "paper", coloring: { fills: nextFills, selectedPaint: nextPaint } });
  };

  const paint = (partId: number) => {
    const next = { ...fills, [partId]: selectedPaint };
    setFills(next);
    persist(next);
    if (!completed.current && Object.keys(next).length >= scene.parts.length) {
      completed.current = true;
      onComplete();
      setMessage("You brought the whole scene to life! ⭐");
    }
  };

  const choosePaint = (paintId: string) => {
    setSelectedPaint(paintId);
    persist(fills, paintId);
  };

  const startOver = () => {
    setFills({});
    setMessage("Fresh coloring page ready!");
    persist({});
  };

  const exportPicture = async () => {
    const svg = svgRef.current;
    if (!svg) return "";
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1200; canvas.height = 790;
      const context = canvas.getContext("2d");
      if (!context) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
      context.fillStyle = "#fffef9"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } catch {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const save = async () => {
    await onSaveArtwork(await exportPicture(), `${profileName}'s ${scene.title}`);
    setMessage("Saved to the family gallery! ⭐");
    if (!completed.current) { completed.current = true; onComplete(); }
  };

  const visiblePaints = ART_PAINTS.filter((paint) => showGradients || paint.colors.length === 1);
  return (
    <div className="creative-board color-board coloring-studio-v26">
      <div className="coloring-title-row"><div><span>COLORING STORY</span><h3>{scene.title}</h3><p>{scene.imagine}</p></div><SpeakButton id={`color-story-${scene.id}`} label="Hear the idea" text={[scene.title, scene.imagine]} /></div>
      <section className="coloring-palette" aria-label="Coloring tools">
        <div className="palette-heading"><strong>🎨 Pick your paint</strong><small>{ART_PAINTS.length} colors and gradients</small></div>
        <div className="color-tools expanded-palette">
          {visiblePaints.map((paintOption) => <button key={paintOption.id} aria-label={`Choose ${paintOption.label}`} title={paintOption.label} className={`swatch ${paintOption.colors.length > 1 ? "gradient-swatch" : ""} ${selectedPaint === paintOption.id ? "active" : ""}`} style={{ background: paintCss(paintOption.id) }} onClick={() => choosePaint(paintOption.id)} />)}
        </div>
        <div className="coloring-actions">
          {age === 0 && <button className="tool-button" onClick={() => setShowGradients((value) => !value)}>{showGradients ? "Hide magic colors" : "Show magic colors ✨"}</button>}
          <button className="tool-button" onClick={startOver}>Start over</button>
          <button className="save-button" onClick={save}>Save to gallery</button>
        </div>
      </section>
      <div className="coloring-sheet detailed-coloring-sheet">
        <svg ref={svgRef} viewBox="0 0 760 500" role="img" aria-label={`Color ${scene.aria}`}>
          <rect width="760" height="500" fill="#fffef9" />
          {scene.parts.map((part, index) => <PaintPart key={`${scene.id}-${index}`} id={index} paintId={fills[index]} onPaint={paint}>{part}</PaintPart>)}
          <g aria-hidden="true">{scene.details}</g>
        </svg>
      </div>
      <div className="coloring-footer"><div className="learn-bubble"><span>💡 Animal & nature note</span><p>{scene.fact}</p><SpeakButton id={`color-fact-${scene.id}`} label="Hear it" text={scene.fact} /></div><p className="silent-save-note">✓ Recent work saves quietly on this device. Use <strong>Save to gallery</strong> only for a picture you want to keep.</p></div>
      {message && <div className="success-toast" role="status">{message}</div>}
    </div>
  );
}
