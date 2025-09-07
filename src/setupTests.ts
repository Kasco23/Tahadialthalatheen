import "@testing-library/jest-dom";

// Mock import.meta.env for Jest tests
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
jest.mock("./lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
}));
