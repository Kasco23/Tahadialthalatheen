import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock import.meta.env for Vitest tests
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_DATABASE_URL: "https://mock-project.supabase.co",
        VITE_SUPABASE_ANON_KEY: "mock-anon-key-for-testing",
        VITE_DAILY_API_KEY: "mock-daily-api-key",
      },
    },
  },
  writable: true,
});

// Mock Supabase client for tests
vi.mock("./lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  },
}));
