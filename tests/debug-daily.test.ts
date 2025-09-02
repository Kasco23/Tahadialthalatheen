import type { HandlerEvent, HandlerContext } from '@netlify/functions';

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

describe('Daily Rooms Function Debug', () => {
  test('should handle OPTIONS request correctly', async () => {
    const { default: handler } = await import('../netlify/functions/daily-rooms');

    const eventWithOptions: HandlerEvent = {
      ...mockEvent,
      path: '',
      httpMethod: 'OPTIONS',
    };

    try {
      const response = await handler(eventWithOptions, mockContext);
      console.log('✓ OPTIONS response status:', response.status);
      console.log('✓ OPTIONS response instance:', response instanceof Response);
      
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
    } catch (error) {
      console.error('✗ OPTIONS test error:', error);
      throw error;
    }
  });

  test('should handle GET request with valid action', async () => {
    const { default: handler } = await import('../netlify/functions/daily-rooms');

    const eventWithListAction: HandlerEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      queryStringParameters: { action: 'list' },
      path: '/.netlify/functions/daily-rooms',
    };

    try {
      const response = await handler(eventWithListAction, mockContext);
      console.log('✓ GET action=list response status:', response.status);
      
      const responseText = await response.text();
      console.log('✓ GET action=list response body:', responseText.substring(0, 200));
      
      expect(response).toBeInstanceOf(Response);
      // Response should be either success or proper error, not MISSING_ACTION
      expect(response.status).not.toBe(400); // The error from MISSING_ACTION
    } catch (error) {
      console.error('✗ GET action=list error:', error);
      throw error;
    }
  });

  test('should return MISSING_ACTION for requests without action', async () => {
    const { default: handler } = await import('../netlify/functions/daily-rooms');

    const eventWithoutAction: HandlerEvent = {
      ...mockEvent,
      httpMethod: 'GET',
      queryStringParameters: null,
      path: '/.netlify/functions/daily-rooms',
    };

    try {
      const response = await handler(eventWithoutAction, mockContext);
      console.log('✓ No action response status:', response.status);
      
      const responseText = await response.text();
      console.log('✓ No action response body:', responseText);
      
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400); // Should be MISSING_ACTION error
      
      const responseJson = JSON.parse(responseText);
      expect(responseJson.code).toBe('MISSING_ACTION');
    } catch (error) {
      console.error('✗ No action test error:', error);
      throw error;
    }
  });
});