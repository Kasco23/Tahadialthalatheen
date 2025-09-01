/**
 * Test for Netlify Functions - validating return types and response format
 */

import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSuccessResponse, createErrorResponse, handleCors } from '../netlify/functions/_utils';

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
  test('createSuccessResponse returns HandlerResponse format', () => {
    const response = createSuccessResponse({ test: 'data' }, 200);
    
    expect(response).toHaveProperty('statusCode', 200);
    expect(response).toHaveProperty('headers');
    expect(response).toHaveProperty('body');
    expect(response.headers).toHaveProperty('Content-Type', 'application/json');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    // Verify body is valid JSON
    const bodyData = JSON.parse(response.body);
    expect(bodyData).toHaveProperty('success', true);
    expect(bodyData).toHaveProperty('data');
    expect(bodyData.data).toEqual({ test: 'data' });
  });

  test('createErrorResponse returns HandlerResponse format', () => {
    const response = createErrorResponse('Test error', 'TEST_ERROR', 400);
    
    expect(response).toHaveProperty('statusCode', 400);
    expect(response).toHaveProperty('headers');
    expect(response).toHaveProperty('body');
    expect(response.headers).toHaveProperty('Content-Type', 'application/json');
    
    // Verify body is valid JSON
    const bodyData = JSON.parse(response.body);
    expect(bodyData).toHaveProperty('error', 'Test error');
    expect(bodyData).toHaveProperty('code', 'TEST_ERROR');
  });

  test('handleCors returns correct CORS response', () => {
    const response = handleCors();
    
    expect(response).toHaveProperty('statusCode', 200);
    expect(response).toHaveProperty('headers');
    expect(response).toHaveProperty('body', '');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  });
});

describe('Daily Rooms Function', () => {
  // Test the specific issue with event.path being undefined
  test('handles undefined event.path gracefully', async () => {
    const { default: handler } = await import('../netlify/functions/daily-rooms');
    
    const eventWithUndefinedPath: HandlerEvent = {
      ...mockEvent,
      path: undefined as any, // Simulate undefined path
      httpMethod: 'OPTIONS', // Use OPTIONS to test CORS handling without auth
    };

    // This should not throw an error
    const response = await handler(eventWithUndefinedPath, mockContext);
    
    expect(response).toHaveProperty('statusCode');
    expect(response).toHaveProperty('headers');
    expect(response).toHaveProperty('body');
  });
});