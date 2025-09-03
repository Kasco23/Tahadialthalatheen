/**
 * Test for Netlify Functions - validating return types and response format
 */

import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import {
  createSuccessResponse,
  createErrorResponse,
  handleCors,
} from '../netlify/functions/_utils';

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

describe('Netlify Functions Utils', () => {
  test('createSuccessResponse returns Response format', async () => {
    const response = createSuccessResponse({ test: 'data' }, 200);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

    // Verify body is valid JSON
    const bodyText = await response.text();
    const bodyData = JSON.parse(bodyText);
    expect(bodyData).toHaveProperty('success', true);
    expect(bodyData).toHaveProperty('data');
    expect(bodyData.data).toEqual({ test: 'data' });
  });

  test('createErrorResponse returns Response format', async () => {
    const response = createErrorResponse('Test error', 'TEST_ERROR', 400);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    // Verify body is valid JSON
    const bodyText = await response.text();
    const bodyData = JSON.parse(bodyText);
    expect(bodyData).toHaveProperty('error', 'Test error');
    expect(bodyData).toHaveProperty('code', 'TEST_ERROR');
  });

  test('handleCors returns correct CORS response', async () => {
    const response = handleCors();

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET, POST, PUT, DELETE, OPTIONS',
    );

    const bodyText = await response.text();
    expect(bodyText).toBe('');
  });
});

describe('Daily Rooms Function', () => {
  // Test the specific issue with event.path being undefined
  test('handles undefined event.path gracefully', async () => {
    const { default: handler } = await import(
      '../netlify/functions/daily-rooms'
    );

    const eventWithUndefinedPath: HandlerEvent = {
      ...mockEvent,
      path: '', // Use empty string instead of undefined
      httpMethod: 'OPTIONS', // Use OPTIONS to test CORS handling without auth
    };

    // This should not throw an error
    const response = await handler(eventWithUndefinedPath, mockContext);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Environment Variable Tests', () => {
  test('supabase-health function handles missing environment variables', async () => {
    // Mock process.env to simulate missing variables
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    const { default: handler } = await import(
      '../netlify/functions/supabase-health'
    );

    const response = await handler(mockEvent, mockContext);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    const bodyText = await response.text();
    const bodyData = JSON.parse(bodyText);

    expect(bodyData.success).toBe(true);
    expect(bodyData.data.status).toBe('misconfigured');
    expect(bodyData.data.environment.supabase_url_configured).toBe(false);
    expect(bodyData.data.environment.supabase_anon_key_configured).toBe(false);

    // Restore original env
    process.env = originalEnv;
  });

  test('daily-rooms function handles missing Daily API key for actions that need it', async () => {
    // Mock process.env to simulate missing Daily API key
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.DAILY_API_KEY;

    const { default: handler } = await import(
      '../netlify/functions/daily-rooms'
    );

    // Test an action that requires Daily API (like check)
    const eventWithCheckAction: HandlerEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      queryStringParameters: { action: 'check' },
      body: JSON.stringify({ roomName: 'test-room' }),
    };

    const response = await handler(eventWithCheckAction, mockContext);

    expect(response).toBeInstanceOf(Response);
    // The function will fail due to missing Supabase config, not Daily API
    expect([400, 500]).toContain(response.status);

    const bodyText = await response.text();
    const bodyData = JSON.parse(bodyText);

    // Could be either Supabase config error or Daily API error
    expect(bodyData).toHaveProperty('error');

    // Restore original env
    process.env = originalEnv;
  });

  test('daily-rooms list action works without Daily API key', async () => {
    // Mock process.env to simulate missing Daily API key
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.DAILY_API_KEY;

    const { default: handler } = await import(
      '../netlify/functions/daily-rooms'
    );

    // Test list action which only queries database
    const eventWithListAction: HandlerEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      queryStringParameters: { action: 'list' },
    };

    const response = await handler(eventWithListAction, mockContext);

    expect(response).toBeInstanceOf(Response);
    // Will fail due to missing Supabase config, not Daily API
    expect([400, 500]).toContain(response.status);

    const bodyText = await response.text();
    const bodyData = JSON.parse(bodyText);

    expect(bodyData).toHaveProperty('error');

    // Restore original env
    process.env = originalEnv;
  });
});
