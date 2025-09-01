import { isArabicAtom } from '@/state/languageAtoms';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

interface ApiStatus {
  name: string;
  status: 'online' | 'offline' | 'checking' | 'error';
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
  endpoint?: string;
}

interface ApiTest {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  body?: Record<string, unknown>;
  description: string;
}

interface TestResult {
  success: boolean;
  status?: number;
  responseTime?: number;
  data?: unknown;
  error?: string;
  timestamp: string;
}

const API_TESTS: ApiTest[] = [
  {
    name: 'Supabase Health Check',
    endpoint: '/.netlify/functions/supabase-health',
    method: 'GET',
    description: 'Tests Supabase database connectivity and configuration',
  },
  {
    name: 'Create Daily Room',
    endpoint: '/.netlify/functions/daily-rooms?action=create',
    method: 'POST',
    body: { sessionId: 'TEST_' + Date.now(), roomName: 'TEST_' + Date.now() },
    description: 'Creates a test Daily.co video room',
  },
  {
    name: 'Check Daily Room',
    endpoint: '/.netlify/functions/daily-rooms?action=check',
    method: 'POST',
    body: { roomName: 'test-room' },
    description: 'Checks if a Daily.co room exists',
  },
  {
    name: 'Get Room Presence',
    endpoint: '/.netlify/functions/daily-rooms?action=presence',
    method: 'POST',
    body: { roomName: 'test-room' },
    description: 'Gets presence information for a Daily.co room',
  },
  {
    name: 'Delete Daily Room',
    endpoint: '/.netlify/functions/daily-rooms?action=delete',
    method: 'POST',
    body: { sessionId: 'test-session', roomName: 'test-room' },
    description: 'Deletes a Daily.co video room',
  },
  {
    name: 'Daily Diagnostics',
    endpoint: '/.netlify/functions/daily-rooms?action=list',
    method: 'GET',
    description: 'Gets list of Daily.co rooms',
  },
  {
    name: 'Create Daily Token',
    endpoint: '/.netlify/functions/daily-rooms?action=token',
    method: 'POST',
    body: { roomName: 'test-room', userName: 'test-user' },
    description: 'Creates a Daily.co room access token',
  },
  {
    name: 'Session Event Test',
    endpoint: '/.netlify/functions/session-events',
    method: 'POST',
    body: {
      sessionId: 'TEST123',
      eventType: 'test',
      eventData: { message: 'API test' },
    },
    description: 'Sends a test session event',
  },
];

export default function ApiStatus() {
  const isArabic = useAtomValue(isArabicAtom);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [selectedTest, setSelectedTest] = useState<ApiTest | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const checkApiStatus = useCallback(
    async (api: ApiStatus): Promise<ApiStatus> => {
      const startTime = Date.now();
      try {
        if (!api.endpoint) {
          return {
            ...api,
            status: 'error',
            error: 'No endpoint configured',
            lastChecked: new Date(),
          };
        }

        let response: Response;

        // Determine HTTP method and body based on endpoint
        if (
          api.endpoint.includes('daily-rooms') &&
          (api.endpoint.includes('action=check') || api.endpoint.includes('action=presence'))
        ) {
          // These endpoints require POST with body
          response = await fetch(api.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName: 'test-room' }),
          });
        } else {
          // Use GET for other endpoints
          response = await fetch(api.endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          return {
            ...api,
            status: 'online',
            responseTime,
            lastChecked: new Date(),
          };
        } else {
          return {
            ...api,
            status: 'error',
            responseTime,
            lastChecked: new Date(),
            error: `HTTP ${response.status}`,
          };
        }
      } catch (error) {
        return {
          ...api,
          status: 'offline',
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [],
  );

  const checkAllApis = useCallback(async () => {
    const apis: ApiStatus[] = [
      {
        name: 'Supabase Database',
        status: 'checking',
        endpoint: '/.netlify/functions/supabase-health',
      },
      {
        name: 'Daily.co Room List',
        status: 'checking',
        endpoint: '/.netlify/functions/daily-rooms?action=list',
      },
      {
        name: 'Room Presence Check',
        status: 'checking',
        endpoint: '/.netlify/functions/daily-rooms?action=presence',
      },
      {
        name: 'Check Daily Room',
        status: 'checking',
        endpoint: '/.netlify/functions/daily-rooms?action=check',
      },
    ];

    setApiStatuses(apis.map((api) => ({ ...api, status: 'checking' })));

    const results = await Promise.all(apis.map((api) => checkApiStatus(api)));

    setApiStatuses(results);
  }, [checkApiStatus]);

  const runApiTest = async (test: ApiTest) => {
    setIsTestRunning(true);
    setTestResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch(test.endpoint, {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
        body: test.body ? JSON.stringify(test.body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      const data = await response.text();

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }

      setTestResult({
        success: response.ok,
        status: response.status,
        responseTime,
        data: parsedData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  useEffect(() => {
    checkAllApis();
  }, [checkAllApis]);

  const getStatusColor = (status: ApiStatus['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'offline':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'error':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'checking':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: ApiStatus['status']) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'offline':
        return '❌';
      case 'error':
        return '⚠️';
      case 'checking':
        return '🔄';
      default:
        return '❓';
    }
  };

  const formatData = (data: unknown): string => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className={`text-4xl font-bold text-white mb-2 ${isArabic ? 'font-arabic' : ''}`}
          >
            API Status & Playground
          </h1>
          <p className={`text-white/70 ${isArabic ? 'font-arabic' : ''}`}>
            Monitor API health and test endpoints
          </p>
          <button
            onClick={checkAllApis}
            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Refresh All
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Status Panel */}
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2
              className={`text-2xl font-bold text-white mb-4 ${isArabic ? 'font-arabic' : ''}`}
            >
              API Status
            </h2>

            <div className="space-y-4">
              {apiStatuses.map((api, index) => (
                <motion.div
                  key={api.name}
                  className={`p-4 rounded-lg border ${getStatusColor(api.status)}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{api.name}</h3>
                      <p className="text-sm text-white/60">{api.endpoint}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getStatusIcon(api.status)}
                        </span>
                        <span className="capitalize text-sm">{api.status}</span>
                      </div>
                      {api.responseTime && (
                        <p className="text-xs text-white/60">
                          {api.responseTime}ms
                        </p>
                      )}
                    </div>
                  </div>

                  {api.error && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded text-red-300 text-sm">
                      <strong>Error:</strong> {api.error}
                    </div>
                  )}

                  {api.lastChecked && (
                    <p className="text-xs text-white/40 mt-2">
                      Last checked: {api.lastChecked.toLocaleTimeString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* API Test Panel */}
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2
              className={`text-2xl font-bold text-white mb-4 ${isArabic ? 'font-arabic' : ''}`}
            >
              API Playground
            </h2>

            {/* Test Selection */}
            <div className="mb-6">
              <label className="block text-white/80 mb-2">
                Select API Test:
              </label>
              <select
                title="Select an API test to run"
                value={selectedTest?.name || ''}
                onChange={(e) => {
                  const test = API_TESTS.find(
                    (t: ApiTest) => t.name === e.target.value,
                  );
                  setSelectedTest(test || null);
                  setTestResult(null);
                }}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Choose a test...</option>
                {API_TESTS.map((test: ApiTest) => (
                  <option key={test.name} value={test.name}>
                    {test.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTest && (
              <div className="space-y-4">
                {/* Test Details */}
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">
                    {selectedTest.name}
                  </h3>
                  <p className="text-white/70 text-sm mb-2">
                    {selectedTest.description}
                  </p>
                  <div className="text-xs text-white/60">
                    <p>
                      <strong>Method:</strong> {selectedTest.method}
                    </p>
                    <p>
                      <strong>Endpoint:</strong> {selectedTest.endpoint}
                    </p>
                  </div>

                  {selectedTest.body && (
                    <div className="mt-2">
                      <p className="text-xs text-white/60 mb-1">
                        Request Body:
                      </p>
                      <pre className="text-xs bg-black/20 p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedTest.body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Run Test Button */}
                <button
                  onClick={() => runApiTest(selectedTest)}
                  disabled={isTestRunning}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  {isTestRunning ? 'Running Test...' : 'Run Test'}
                </button>

                {/* Test Results */}
                {testResult && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">
                      Test Result
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Success:</strong>{' '}
                        {testResult.success ? '✅' : '❌'}
                      </p>
                      {testResult.status && (
                        <p>
                          <strong>Status:</strong> {testResult.status}
                        </p>
                      )}
                      {testResult.responseTime && (
                        <p>
                          <strong>Response Time:</strong>{' '}
                          {testResult.responseTime}ms
                        </p>
                      )}
                      <p>
                        <strong>Timestamp:</strong> {testResult.timestamp}
                      </p>
                    </div>

                    {testResult.error && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded text-red-300 text-sm">
                        <strong>Error:</strong> {testResult.error}
                      </div>
                    )}

                    {testResult.data ? (
                      <div className="mt-2">
                        <p className="text-xs text-white/60 mb-1">
                          Response Data:
                        </p>
                        <pre className="text-xs bg-black/20 p-2 rounded overflow-x-auto max-h-40">
                          {formatData(testResult.data)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
