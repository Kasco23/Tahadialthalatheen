import { describe, it, expect, beforeAll } from "vitest";
import { loadModel, parseIntent, isModelLoaded, getBackend, __resetModelForTests } from "../src/lib/aiUtils";

describe("AI Utils - Intent Parser", () => {
  beforeAll(async () => {
    // Load model before running tests
    await loadModel("wasm");
  });

  describe("Model Loading", () => {
    it("should load model successfully", () => {
      expect(isModelLoaded()).toBe(true);
    });

    it("should report correct backend", () => {
      expect(getBackend()).toBe("wasm");
    });
  });

  describe("Intent Parsing - Generate Questions", () => {
    it("should parse 'create X questions about Y' pattern", async () => {
      const result = await parseIntent("Create 5 questions about Premier League");

      expect(result.task).toBe("generate_questions");
      expect(result.params.count).toBe(5);
      expect(result.params.topic).toBe("Premier League");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should handle different counts", async () => {
      const result = await parseIntent("Create 10 questions about La Liga");

      expect(result.task).toBe("generate_questions");
      expect(result.params.count).toBe(10);
      expect(result.params.topic).toBe("La Liga");
    });

    it("should be case-insensitive", async () => {
      const result = await parseIntent("CREATE 3 QUESTIONS ABOUT CHAMPIONS LEAGUE");

      expect(result.task).toBe("generate_questions");
      expect(result.params.count).toBe(3);
    });
  });

  describe("Intent Parsing - Top Scorers", () => {
    it("should parse top scorer queries", async () => {
      const result = await parseIntent("Top scorers in Premier League 2023");

      expect(result.task).toBe("top_scorers");
      expect(result.params.league).toBe("premier-league");
      expect(result.params.season).toBe("2023");
    });

    it("should default to current year if not specified", async () => {
      const result = await parseIntent("Leading scorers in La Liga");
      const currentYear = new Date().getFullYear().toString();

      expect(result.task).toBe("top_scorers");
      expect(result.params.season).toBe(currentYear);
    });

    it("should recognize different league names", async () => {
      const leagues = [
        { input: "top scorers in Serie A", expected: "serie-a" },
        { input: "leading scorers Bundesliga", expected: "bundesliga" },
        { input: "top scorer Ligue 1", expected: "ligue-1" },
      ];

      for (const { input, expected } of leagues) {
        const result = await parseIntent(input);
        expect(result.task).toBe("top_scorers");
        expect(result.params.league).toBe(expected);
      }
    });
  });

  describe("Intent Parsing - Transfers", () => {
    it("should parse transfer queries", async () => {
      const result = await parseIntent("Player transfers in 2023");

      expect(result.task).toBe("transfers");
      expect(result.params.season).toBe("2023");
    });

    it("should handle signing keyword", async () => {
      const result = await parseIntent("Big signings in 2024");

      expect(result.task).toBe("transfers");
      expect(result.params.season).toBe("2024");
    });
  });

  describe("Intent Parsing - Team Squad", () => {
    it("should parse squad queries", async () => {
      const result = await parseIntent("Squad of Manchester United");

      expect(result.task).toBe("team_squad");
      expect(result.params.team).toBe("Manchester United");
    });

    it("should handle lineup keyword", async () => {
      const result = await parseIntent("Lineup for Barcelona in 2023");

      expect(result.task).toBe("team_squad");
      expect(result.params.team).toBe("Barcelona");
    });

    it("should handle roster keyword", async () => {
      const result = await parseIntent("Roster of Real Madrid");

      expect(result.task).toBe("team_squad");
      expect(result.params.team).toBe("Real Madrid");
    });
  });

  describe("Intent Parsing - General Query Fallback", () => {
    it("should fallback to general_query for unknown patterns", async () => {
      const result = await parseIntent("Who is the best player ever?");

      expect(result.task).toBe("general_query");
      expect(result.params.query).toBe("Who is the best player ever?");
      expect(result.confidence).toBeLessThan(0.5);
    });

    it("should handle empty or vague prompts", async () => {
      const result = await parseIntent("football stuff");

      expect(result.task).toBe("general_query");
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe("Error Handling", () => {
    it("should throw if model not loaded", async () => {
      // Reset shared module state to simulate fresh import without loadModel
      __resetModelForTests();
      await expect(parseIntent("test")).rejects.toThrow("Model not loaded");
      // Restore model for subsequent tests if any (not strictly needed here)
      await loadModel("wasm");
    });
  });
});
