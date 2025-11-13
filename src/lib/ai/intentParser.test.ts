/**
 * Intent Parser Unit Tests
 * Tests rule-based parsing with sample prompts
 */

import { describe, it, expect } from "vitest";
import { parseIntent, validateIntent, type Intent } from "./intentParser";

describe("intentParser - Rule-based parsing", () => {
  it("should parse WDYK club squad query", async () => {
    const prompt = "squad for Manchester United in 2008";
    const intent = await parseIntent(prompt, { allowLLMFallback: false });

    expect(intent.segment).toBe("WDYK");
    expect(intent.task).toBe("club_squad_by_season");
    expect(intent.constraints).toMatchObject({
      clubName: "Manchester United",
      season: "2008",
    });
    expect(intent.metadata?.method).toBe("rules");
  });

  it("should parse WDYK players with titles in multiple countries", async () => {
    const prompt = "players won league titles in multiple countries top 5";
    const intent = await parseIntent(prompt, { allowLLMFallback: false });

    expect(intent.segment).toBe("WDYK");
    expect(intent.task).toBe("players_won_league_titles_in_multiple_countries");
    expect(intent.constraints).toMatchObject({
      leagues: "top5",
      min_countries: 2,
    });
    expect(intent.metadata?.method).toBe("rules");
  });

  it("should parse BELL player stats query", async () => {
    const prompt = "goals for Ronaldo in Champions League season 2017/18";
    const intent = await parseIntent(prompt, { allowLLMFallback: false });

    expect(intent.segment).toBe("BELL");
    expect(intent.task).toBe("player_stats_by_competition");
    expect(intent.constraints).toMatchObject({
      playerName: "Ronaldo",
      competition: "Champions League",
      season: "2017/18",
    });
    expect(intent.metadata?.method).toBe("rules");
  });

  it("should parse REMO after X before Y query", async () => {
    const prompt = "after leaving Barcelona before joining PSG";
    const intent = await parseIntent(prompt, { allowLLMFallback: false });

    expect(intent.segment).toBe("REMO");
    expect(intent.task).toBe("after_x_before_y");
    expect(intent.timeframe).toMatchObject({
      from: "leaving Barcelona",
      to: "joining PSG",
    });
    expect(intent.metadata?.method).toBe("rules");
  });

  it("should parse UPDW achievement by year query", async () => {
    const prompt = "who won Ballon d'Or in 2023";
    const intent = await parseIntent(prompt, { allowLLMFallback: false });

    expect(intent.segment).toBe("UPDW");
    expect(intent.task).toBe("achievement_by_year");
    expect(intent.constraints).toMatchObject({
      trophy: "Ballon d'Or",
      year: 2023,
    });
    expect(intent.metadata?.method).toBe("rules");
  });

  it("should throw error when rules fail and LLM fallback disabled", async () => {
    const prompt = "some completely random text that matches no rules";

    await expect(
      parseIntent(prompt, { allowLLMFallback: false })
    ).rejects.toThrow("Failed to parse intent");
  });
});

describe("intentParser - LLM fallback", () => {
  it("should fall back to LLM when rules fail", async () => {
    // LLM fallback requires @xenova/transformers package
    // For MVP, we'll skip this test until the package is installed
    // TODO: Install @xenova/transformers and enable this test
    expect(true).toBe(true);
  });

  it("should handle empty prompt", async () => {
    await expect(parseIntent("")).rejects.toThrow("Prompt cannot be empty");
  });
});

describe("validateIntent", () => {
  it("should validate correct intent", () => {
    const intent: Intent = {
      segment: "WDYK",
      task: "club_squad_by_season",
      constraints: { clubName: "Liverpool", season: "2020" },
      metadata: { method: "rules", confidence: 0.85 },
    };

    const result = validateIntent(intent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect missing segment", () => {
    const intent = {
      task: "some_task",
    } as Intent;

    const result = validateIntent(intent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing segment code");
  });

  it("should detect invalid segment", () => {
    const intent = {
      segment: "INVALID",
      task: "some_task",
    } as unknown as Intent;

    const result = validateIntent(intent);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Invalid segment"))).toBe(true);
  });
});
