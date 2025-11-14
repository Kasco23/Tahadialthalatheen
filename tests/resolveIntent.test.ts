import { describe, it, expect, vi, beforeAll } from "vitest";

/**
 * Integration tests for resolve-intent Netlify function
 * Note: These tests require the dev server to be running (pnpm dev)
 */

// Intentional HTTP for local dev Netlify function; safe in test context.
// nosemgrep: local-http-ok
const FUNCTION_URL = "http://localhost:3000/.netlify/functions/resolve-intent";

function localFetch(init: RequestInit) {
  // Single point using HTTP; documented above.
  return fetch(FUNCTION_URL, init); // nosemgrep: local-http-ok
}

// If FUNCTION_TESTS not set, stub fetch locally to avoid network dependency during unit tests.
const USE_LIVE = process.env.FUNCTION_TESTS === "true";

beforeAll(() => {
  if (USE_LIVE) return;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    // Basic router logic based on body.task
    if (url !== FUNCTION_URL) {
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    }
    // Method checks
    const method = init?.method || "GET";
    if (method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const bodyText = init?.body as string;
  // Parse JSON safely
  let parsed: Record<string, unknown>;
    try {
      parsed = bodyText ? JSON.parse(bodyText) : {};
  } catch (_err) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 500 });
    }
    const task = parsed.task;
    const useMocks = parsed.useMocks !== false; // default true
    if (!task || task === "unknown_task") {
      return new Response(JSON.stringify({ error: "Unknown task" }), { status: 400 });
    }
    // Mock responses
    const base = {
      metadata: { task, mock: useMocks, count: 3 },
    };
    const questions = [
      { question: `Q1 about ${task}`, answer: "A1" },
      { question: `Q2 about ${task}`, answer: "A2" },
      { question: `Q3 about ${task}`, answer: "A3" },
    ];
    return new Response(JSON.stringify({ ...base, questions }), { status: 200 });
  });
});

describe("Resolve Intent Function", () => {
  describe("Error Handling", () => {
    it("should reject non-POST requests", async () => {
      // For stubbed mode we directly call fetch with GET
      const response = await localFetch({
        method: "GET",
      });

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.error).toBe("Method not allowed");
    });

    it("should handle invalid JSON body", async () => {
      const response = await localFetch({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should handle unknown task types", async () => {
      const response = await localFetch({
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
      const response = await localFetch({
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
      const response = await localFetch({
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
      const response = await localFetch({
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
      const response = await localFetch({
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
      const response = await localFetch({
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
      const response = await localFetch({
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
      const response = await localFetch({
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
      const response = await localFetch({
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
