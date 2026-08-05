import { describe, expect, it } from "vitest";
import { getScienceLab, getScienceLabs, LAB_COUNTS } from "./lab-data";

describe("older learner science curriculum", () => {
  it("offers broad, non-repeating lab catalogs for ages 7–9 and 10–12", () => {
    for (const ageWorld of [2, 3]) {
      const labs = getScienceLabs(ageWorld);
      expect(labs.length).toBeGreaterThanOrEqual(15);
      expect(new Set(labs.map(({ id }) => id)).size).toBe(labs.length);
      expect(new Set(labs.map(({ title }) => title)).size).toBe(labs.length);
      expect(new Set(labs.map(({ field }) => field)).size).toBeGreaterThanOrEqual(10);
    }

    expect(LAB_COUNTS.perAge[2]).toBe(15);
    expect(LAB_COUNTS.perAge[3]).toBe(16);
  });

  it("layers vocabulary and real-world meaning into the new investigations", () => {
    for (const ageWorld of [2, 3]) {
      const enrichedLabs = getScienceLabs(ageWorld).filter(({ vocabulary, connection }) => vocabulary && connection);
      expect(enrichedLabs.length).toBeGreaterThanOrEqual(7);

      for (const lab of enrichedLabs) {
        expect(lab.vocabulary).toHaveLength(2);
        expect(lab.vocabulary?.every(({ word, meaning }) => word.length >= 2 && meaning.length > 12)).toBe(true);
        expect(lab.connection?.length).toBeGreaterThan(30);
      }
    }
  });

  it("keeps every lab structured as a safe evidence cycle", () => {
    for (const ageWorld of [2, 3]) {
      for (const lab of getScienceLabs(ageWorld)) {
        expect(lab.predictions).toHaveLength(3);
        expect(lab.materials.length).toBeGreaterThanOrEqual(2);
        expect(lab.steps.length).toBeGreaterThanOrEqual(3);
        expect(lab.observation.length).toBeGreaterThan(20);
        expect(lab.explanation.length).toBeGreaterThan(30);
        expect(["Child can try", "Grown-up nearby", "Grown-up required"]).toContain(lab.safety);
      }
    }
  });

  it("still wraps page selection through the age-specific catalog", () => {
    for (const ageWorld of [2, 3]) {
      const pageAfterLast = getScienceLabs(ageWorld).length + 1;
      expect(getScienceLab(ageWorld, pageAfterLast).id).toBe(getScienceLab(ageWorld, 1).id);
    }
  });
});
