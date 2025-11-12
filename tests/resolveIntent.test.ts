import { describe, it, expect } from "vitest";

/**
 * Integration tests for resolve-intent Netlify function
 * Note: These tests require the dev server to be running (pnpm dev)
 */

const FUNCTION_URL = "http://localhost:3000/.netlify/functions/resolve-intent";

describe("Resolve Intent Function", () => {
  describe("Error Handling", () => {
    it("should reject non-POST requests", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "GET",
      });

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.error).toBe("Method not allowed");
    });

    it("should handle invalid JSON body", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should handle unknown task types", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "unknown_task",
          params: {},
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Unknown task");
    });
  });

  describe("Mock Mode", () => {
    it("should return mock data for generate_questions", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "generate_questions",
          params: { count: 5, topic: "Premier League" },
          useMocks: true,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.questions).toBeDefined();
      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
      expect(data.metadata.mock).toBe(true);
    });

    it("should return mock data for top_scorers", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "top_scorers",
          params: { league: "premier-league", season: "2023" },
          useMocks: true,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.questions).toBeDefined();
      expect(data.questions.length).toBeGreaterThan(0);
      expect(data.metadata.mock).toBe(true);
    });

    it("should return mock data for transfers", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "transfers",
          params: { season: "2023" },
          useMocks: true,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.questions).toBeDefined();
      expect(data.metadata.mock).toBe(true);
    });

    it("should return mock data for team_squad", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "team_squad",
          params: { team: "Manchester City" },
          useMocks: true,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.questions).toBeDefined();
      expect(data.metadata.mock).toBe(true);
    });
  });

  describe("Real Mode (Placeholder)", () => {
    it("should handle generate_questions in real mode", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "generate_questions",
          params: { count: 3, topic: "Champions League" },
          useMocks: false,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.questions).toBeDefined();
      expect(data.questions.length).toBe(3);
      expect(data.metadata.task).toBe("generate_questions");
    });

    it("should handle top_scorers in real mode", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "top_scorers",
          params: { league: "laliga", season: "2023" },
          useMocks: false,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.questions).toBeDefined();
      expect(data.metadata.task).toBe("top_scorers");
    });
  });

  describe("Response Format", () => {
    it("should return properly structured question objects", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "generate_questions",
          params: {},
          useMocks: true,
        }),
      });

      const data = await response.json();
      const question = data.questions[0];

      expect(question).toHaveProperty("question");
      expect(question).toHaveProperty("answer");
      expect(typeof question.question).toBe("string");
      expect(typeof question.answer).toBe("string");
    });

    it("should include metadata in response", async () => {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "transfers",
          params: { season: "2023" },
          useMocks: true,
        }),
      });

      const data = await response.json();

      expect(data.metadata).toBeDefined();
      expect(data.metadata.task).toBe("transfers");
      expect(data.metadata.count).toBeDefined();
    });
  });
});
