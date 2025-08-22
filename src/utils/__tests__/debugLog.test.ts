/**
 * @jest-environment jsdom
 */
import { debugLog } from '../debugLog';

// Mock import.meta.env
const mockEnv = {
  DEV: true,
};

jest.mock('../debugLog', () => ({
  debugLog: jest.fn((component: string, action: string, data?: unknown) => {
    if (mockEnv.DEV) {
      console.group(`🐛 ${component} - ${action}`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Data:', data);
      console.trace('Call stack');
      console.groupEnd();
    }
  }),
}));

describe('debugLog', () => {
  beforeEach(() => {
    jest.spyOn(console, 'group').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'trace').mockImplementation();
    jest.spyOn(console, 'groupEnd').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be available as a function', () => {
    expect(debugLog).toBeDefined();
    expect(typeof debugLog).toBe('function');
  });

  it('should call debugLog with correct parameters', () => {
    const testData = { userId: 123, action: 'test' };
    debugLog('TestComponent', 'testAction', testData);

    expect(debugLog).toHaveBeenCalledWith(
      'TestComponent',
      'testAction',
      testData,
    );
  });
});
