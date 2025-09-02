// Jest setup file for Thirty Challenge tests
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_DAILY_DOMAIN = 'test.daily.co';

// Mock console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock fetch for network requests
global.fetch = jest.fn();

// Mock Headers for Node.js environment
global.Headers = class MockHeaders {
  private _headers: Record<string, string> = {};

  constructor(init?: HeadersInit) {
    if (init) {
      if (init instanceof Headers) {
        // Copy from another Headers object
        init.forEach((value, key) => {
          this._headers[key.toLowerCase()] = value;
        });
      } else if (Array.isArray(init)) {
        // Array of [key, value] pairs
        init.forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      } else {
        // Object
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
  }

  get(name: string): string | null {
    return this._headers[name.toLowerCase()] || null;
  }

  set(name: string, value: string): void {
    this._headers[name.toLowerCase()] = value;
  }

  has(name: string): boolean {
    return name.toLowerCase() in this._headers;
  }

  delete(name: string): void {
    delete this._headers[name.toLowerCase()];
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    Object.entries(this._headers).forEach(([key, value]) => {
      callback(value, key, this as any);
    });
  }
} as any;

// Mock Response for Node.js environment (Netlify functions use Response)
global.Response = class MockResponse {
  body: ReadableStream<Uint8Array> | null;
  headers: Headers;
  ok: boolean;
  redirected: boolean;
  status: number;
  statusText: string;
  type: ResponseType;
  url: string;
  private _bodyText: string;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this._bodyText = typeof body === 'string' ? body : '';
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(init?.headers);
    this.redirected = false;
    this.type = 'basic';
    this.url = '';
    this.body = null;
  }

  async text(): Promise<string> {
    return this._bodyText;
  }

  async json(): Promise<any> {
    return JSON.parse(this._bodyText);
  }

  clone(): Response {
    return new MockResponse(this._bodyText, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    }) as any;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Not implemented');
  }

  async blob(): Promise<Blob> {
    throw new Error('Not implemented');
  }

  async formData(): Promise<FormData> {
    throw new Error('Not implemented');
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
