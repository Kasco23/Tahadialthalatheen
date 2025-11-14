/**
 * Test script for Transfermarkt API wrapper
 * Tests all core methods with real API calls
 */

// Live API demonstration script. Not a unit test. Wrapped to avoid running on vitest by default.
import { transfermarktClient, TransfermarktAPIError } from "./transfermarkt";
import { describe, it } from "vitest";

// Augment ImportMeta locally to expose vitest flag without using 'any'
declare global {
  interface ImportMeta {
    vitest?: boolean;
  }
}

async function demo() {
  console.log("🚀 Transfermarkt API Live Demo (opt-in)\n");
  try {
    const searchResults = await transfermarktClient.searchPlayer("Thierry Henry");
    const henry = searchResults.results[0];
    await transfermarktClient.getPlayerProfile(henry.id);
    await transfermarktClient.getPlayerTransfers(henry.id);
  } catch (error) {
    if (error instanceof TransfermarktAPIError) {
      console.error(`❌ API Error: ${error.message}`);
    } else {
      console.error("❌ Unexpected error:", error);
    }
  }
}

// Only run live when explicitly opted in via env var
// Use type cast to access vitest meta flag without TS augmentation
if (!import.meta.vitest && process.env.LIVE_API_TESTS === "true") {
  demo();
}

// Provide a skipped test suite so vitest reports cleanly
if (import.meta.vitest) {
  describe.skip("Transfermarkt live API", () => {
    it("skipped live calls", () => {});
  });
}
