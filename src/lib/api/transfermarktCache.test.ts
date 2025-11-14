/**
 * Test script for Transfermarkt Cache Layer
 * Tests cache-first pattern, TTL validation, and performance
 */

// Live cache demonstration script. Converted to opt-in to avoid network calls in default test run.
import {
  searchPlayerCached,
} from "./transfermarktCache";
import { describe, it } from "vitest";

declare global {
  interface ImportMeta {
    vitest?: boolean;
  }
}

async function demoCache() {
  try {
    await searchPlayerCached("Thierry Henry");
  } catch (err) {
    console.error("Cache demo error", err);
  }
}

if (!import.meta.vitest && process.env.LIVE_API_TESTS === "true") {
  demoCache();
}

if (import.meta.vitest) {
  describe.skip("Transfermarkt cache live demo", () => {
    it("skipped live cache calls", () => {});
  });
}
