import { describe, expect, it } from "vitest";
import { getScienceLab } from "./lab-data";
import { getPuzzle } from "./puzzle-data";
import { puzzleChoiceNarration } from "./PuzzleBoard";
import { labNarration } from "./ScienceLab";
import {
  fifiVoiceProfileForAge,
  selectSpeechVoice,
  voicePreferenceFor,
  voiceProfileForAge,
  type SpeechSettings,
} from "./speech";

function fakeVoice(name: string, lang: string, localService: boolean, voiceURI = name): SpeechSynthesisVoice {
  return { name, lang, localService, voiceURI, default: false };
}

const settings: SpeechSettings = {
  enabled: true,
  rate: 0.85,
  autoRead: "young",
  voice: null,
};

describe("age-aware voice selection", () => {
  it("prefers a verified local English voice over remote or non-English voices", () => {
    const remoteEnglish = fakeVoice("Cloud Natural", "en-US", false);
    const localSpanish = fakeVoice("Voz local", "es-US", true);
    const localEnglish = fakeVoice("Device English", "en-US", true);
    expect(selectSpeechVoice([remoteEnglish, localSpanish, localEnglish], 2, null)).toBe(localEnglish);
  });

  it("honors an exact parent voice override and can restore it by name", () => {
    const localVoice = fakeVoice("Device English", "en-US", true, "device-en");
    const chosenVoice = fakeVoice("Parent Choice", "en-GB", false, "parent-choice");
    const voices = [localVoice, chosenVoice];
    expect(selectSpeechVoice(voices, 1, voicePreferenceFor(chosenVoice))).toBe(chosenVoice);
    expect(selectSpeechVoice(voices, 1, { voiceURI: "missing", name: "Parent Choice" })).toBe(chosenVoice);
  });

  it("uses a slower, higher delivery for little children and a natural delivery for older children", () => {
    const youngest = voiceProfileForAge(settings, 0);
    const oldest = voiceProfileForAge(settings, 3);
    expect(youngest.rate).toBeLessThan(oldest.rate);
    expect(youngest.pitch).toBeGreaterThan(oldest.pitch);
    expect(youngest.label).toMatch(/warm/i);
    expect(oldest.label).toMatch(/natural/i);
  });

  it("gives Fifi a brighter age-aware character voice without making older narration childish", () => {
    const littleFifi = fifiVoiceProfileForAge(settings, 0);
    const olderFifi = fifiVoiceProfileForAge(settings, 3);
    expect(littleFifi.pitch).toBeGreaterThan(voiceProfileForAge(settings, 0).pitch);
    expect(littleFifi.rate).toBeGreaterThan(voiceProfileForAge(settings, 0).rate);
    expect(littleFifi.pitch).toBeGreaterThan(olderFifi.pitch);
    expect(littleFifi.label).toMatch(/playful/i);
    expect(olderFifi.label).toMatch(/curious/i);
  });
});

describe("complete activity narration", () => {
  it("names visible puzzle options for every puzzle family", () => {
    for (const age of [0, 1, 2, 3]) {
      for (let page = 1; page <= 80; page += 1) {
        const puzzle = getPuzzle(page, age);
        const narration = puzzleChoiceNarration(puzzle);
        expect(narration.length).toBeGreaterThan(10);
        if (puzzle.kind === "match") {
          expect(narration).toContain(puzzle.pairs[0].label);
          expect(narration).toContain(puzzle.pairs[0].homeLabel);
        } else if (puzzle.kind === "sort") {
          expect(narration).toContain(puzzle.items[0].label);
          expect(narration).toContain(puzzle.categories[0]);
        } else if (puzzle.kind === "sequence") {
          expect(narration).toContain(puzzle.steps[0].label);
        } else {
          expect(narration).toContain(puzzle.options[0].label);
        }
      }
    }
  });

  it("includes lab predictions, materials, steps, and observations", () => {
    const lab = getScienceLab(2, 1);
    const narration = labNarration(lab).join(" ");
    expect(narration).toContain(lab.predictions[0]);
    expect(narration).toContain(lab.materials[0]);
    expect(narration).toContain(lab.steps[0]);
    expect(narration).toContain(lab.observation);
  });
});
