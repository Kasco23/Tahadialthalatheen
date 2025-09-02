/**
 * Test for Netlify Functions 2.0 migration - verifying Response objects
 */

import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import {
  createSuccessResponse,
  createErrorResponse,
  handleCors,
} from '../netlify/functions/_utils';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Mock event for testing
const mockEvent: HandlerEvent = {
  rawUrl: 'https://test.netlify.app/.netlify/functions/test',
  rawQuery: '',
  path: '/.netlify/functions/test',
  httpMethod: 'GET',
  headers: {},
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  body: null,
  isBase64Encoded: false,
};

const mockContext: HandlerContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test',
  logStreamName: '2023/01/01/[$LATEST]test',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('Netlify Functions 2.0 Migration Tests', () => {
  test('health-check function returns Response object', async () => {
    const { default: healthCheck } = await import(
      '../netlify/functions/health-check'
    );
    const response = await healthCheck();

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const body = await response.text();
    const data = JSON.parse(body);
    expect(data).toHaveProperty('ok', true);
    expect(data).toHaveProperty('runtime');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('function', 'health-check');
  });

  test('utility functions return proper Response objects', async () => {
    // Test CORS
    const corsResponse = handleCors();
    expect(corsResponse).toBeInstanceOf(Response);
    expect(corsResponse.status).toBe(200);
    expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(corsResponse.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET, POST, PUT, DELETE, OPTIONS',
    );

    const corsBody = await corsResponse.text();
    expect(corsBody).toBe('');

    // Test success response
    const successResponse = createSuccessResponse({ test: 'data' }, 200);
    expect(successResponse).toBeInstanceOf(Response);
    expect(successResponse.status).toBe(200);
    expect(successResponse.headers.get('Content-Type')).toBe(
      'application/json',
    );

    const successBody = await successResponse.text();
    const successData = JSON.parse(successBody);
    expect(successData).toEqual({
      success: true,
      data: { test: 'data' },
    });

    // Test error response
    const errorResponse = createErrorResponse('Test error', 'TEST_ERROR', 400);
    expect(errorResponse).toBeInstanceOf(Response);
    expect(errorResponse.status).toBe(400);
    expect(errorResponse.headers.get('Content-Type')).toBe('application/json');

    const errorBody = await errorResponse.text();
    const errorData = JSON.parse(errorBody);
    expect(errorData).toEqual({
      error: 'Test error',
      code: 'TEST_ERROR',
    });
  });

  test('functions handle CORS OPTIONS requests correctly', async () => {
    const corsEvent: HandlerEvent = {
      ...mockEvent,
      httpMethod: 'OPTIONS',
    };

    // Test multiple functions
    const functions = [
      '../netlify/functions/supabase-health',
      '../netlify/functions/session-events',
    ];

    for (const functionPath of functions) {
      const { default: handler } = await import(functionPath);
      const response = await handler(corsEvent, mockContext);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const body = await response.text();
      expect(body).toBe('');
    }
  });

  test('functions handle invalid methods correctly', async () => {
    const invalidMethodEvent: HandlerEvent = {
      ...mockEvent,
      httpMethod: 'PATCH', // Unsupported method
    };

    const { default: supabaseHealth } = await import(
      '../netlify/functions/supabase-health'
    );
    const response = await supabaseHealth(invalidMethodEvent, mockContext);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(405); // Method not allowed
    expect(response.headers.get('Content-Type')).toBe('application/json');

    const body = await response.text();
    const data = JSON.parse(body);
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('code');
  });

  test('batch-check-rooms function returns Response objects', async () => {
    const postEvent: HandlerEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      body: JSON.stringify({ roomNames: ['test-room-1', 'test-room-2'] }),
    };

    // Mock Daily API key for this test
    const originalApiKey = process.env.DAILY_API_KEY;
    process.env.DAILY_API_KEY = 'test-key';

    try {
      const { default: batchCheckRooms } = await import(
        '../netlify/functions/batch-check-rooms'
      );
      const response = await batchCheckRooms(postEvent, mockContext);

      expect(response).toBeInstanceOf(Response);
      // Should be 200 or 500 depending on API availability
      expect([200, 500]).toContain(response.status);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.text();
      const data = JSON.parse(body);

      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
      } else {
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('code');
      }
    } finally {
      // Restore original environment
      if (originalApiKey) {
        process.env.DAILY_API_KEY = originalApiKey;
      } else {
        delete process.env.DAILY_API_KEY;
      }
    }
  });
});
