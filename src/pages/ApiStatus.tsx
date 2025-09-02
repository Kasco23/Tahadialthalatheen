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
  method: 'GET' | 'POST' | 'DELETE';
  requiresAuth?: boolean;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
  description: string;
  category: 'supabase' | 'daily' | 'session';
}

interface TestResult {
  success: boolean;
  status?: number;
  responseTime?: number;
  data?: string | Record<string, unknown> | unknown[];
  error?: string;
  timestamp: string;
  requestDetails?: {
    method: string;
    endpoint: string;
    headers: Record<string, string>;
    body?: string;
  };
}

interface TestInputs {
  sessionId: string;
  roomName: string;
  userName: string;
  gameId: string;
}

export default function ApiStatus() {
  const isArabic = useAtomValue(isArabicAtom);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [selectedTest, setSelectedTest] = useState<ApiTest | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testInputs, setTestInputs] = useState<TestInputs>({
    sessionId: `TEST_${Date.now()}`,
    roomName: `test-room-${Date.now()}`,
    userName: 'test-user',
    gameId: `game_${Date.now()}`,
  });

  // Configurable API tests with proper method/parameter combinations
  const createApiTests = useCallback(
    (inputs: TestInputs): ApiTest[] => [
      // Supabase Tests
      {
        name: 'Supabase Health Check',
        endpoint: '/.netlify/functions/supabase-health',
        method: 'GET',
        description: 'Tests Supabase database connectivity and configuration',
        category: 'supabase',
      },

      // Daily.co Tests with correct methods and parameters
      {
        name: 'List Daily Rooms',
        endpoint: '/.netlify/functions/daily-rooms',
        method: 'GET',
        queryParams: { action: 'list' },
        description: 'Gets list of active Daily.co rooms',
        category: 'daily',
      },
      {
        name: 'Check Daily Room Exists',
        endpoint: '/.netlify/functions/daily-rooms',
        method: 'GET',
        queryParams: { action: 'check', roomName: inputs.roomName },
        description: 'Checks if a specific Daily.co room exists',
        category: 'daily',
      },
      {
        name: 'Get Room Presence',
        endpoint: '/.netlify/functions/daily-rooms',
        method: 'GET',
        queryParams: { action: 'presence', roomName: inputs.roomName },
        description: 'Gets presence information for a Daily.co room',
        category: 'daily',
      },
      {
        name: 'Create Daily Room',
        endpoint: '/.netlify/functions/daily-rooms',
        method: 'POST',
        queryParams: { action: 'create' },
        requiresAuth: true,
        body: {
          sessionId: inputs.sessionId,
          roomName: `test-${Date.now()}`,
          properties: {
            max_participants: 10,
            enable_screenshare: true,
            enable_chat: true,
          },
        },
        description: 'Creates a test Daily.co video room',
        category: 'daily',
      },
      {
        name: 'Create Daily Token',
        endpoint: '/.netlify/functions/daily-rooms',
        method: 'POST',
        queryParams: { action: 'token' },
        requiresAuth: true,
        body: {
          roomName: inputs.roomName,
          properties: {
            user_name: inputs.userName,
            is_owner: false,
          },
        },
        description: 'Creates a Daily.co room access token',
        category: 'daily',
      },
      {
        name: 'Delete Daily Room',
        endpoint: '/.netlify/functions/daily-rooms',
        method: 'DELETE',
        queryParams: {
          action: 'delete',
          roomName: inputs.roomName,
          sessionId: inputs.sessionId,
        },
        requiresAuth: true,
        description: 'Deletes a Daily.co video room',
        category: 'daily',
      },

      // Session Event Tests
      {
        name: 'Session Event Test',
        endpoint: '/.netlify/functions/session-events',
        method: 'POST',
        requiresAuth: true,
        body: {
          sessionId: inputs.sessionId,
          eventType: 'test',
          eventData: {
            message: 'API test',
            timestamp: new Date().toISOString(),
          },
        },
        description: 'Sends a test session event',
        category: 'session',
      },
    ],
    [],
  );

  // Get authentication context
  const getAuthHeaders = useCallback(async (): Promise<
    Record<string, string>
  > => {
    try {
      // Try to get auth token from local storage or context
      const token = localStorage.getItem('auth_token');
      if (token) {
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (error) {
      console.warn('Could not get auth token:', error);
    }

    return {
      'Content-Type': 'application/json',
    };
  }, []);

  const buildUrl = useCallback(
    (endpoint: string, queryParams?: Record<string, string>): string => {
      if (!queryParams || Object.keys(queryParams).length === 0) {
        return endpoint;
      }

      const url = new URL(endpoint, window.location.origin);
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      return url.pathname + url.search;
    },
    [],
  );

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

        const headers = await getAuthHeaders();
        const response = await fetch(api.endpoint, {
          method: 'GET',
          headers,
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          return {
            ...api,
            status: 'online',
            responseTime,
            lastChecked: new Date(),
          };
        } else {
          const errorText = await response.text();
          return {
            ...api,
            status: 'error',
            responseTime,
            lastChecked: new Date(),
            error: `HTTP ${response.status}: ${errorText}`,
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
    [getAuthHeaders],
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
        endpoint: `/.netlify/functions/daily-rooms?action=presence&roomName=${testInputs.roomName}`,
      },
      {
        name: 'Check Daily Room',
        status: 'checking',
        endpoint: `/.netlify/functions/daily-rooms?action=check&roomName=${testInputs.roomName}`,
      },
    ];

    setApiStatuses(apis.map((api) => ({ ...api, status: 'checking' })));

    const results = await Promise.all(apis.map((api) => checkApiStatus(api)));

    setApiStatuses(results);
  }, [checkApiStatus, testInputs.roomName]);

  const runApiTest = async (test: ApiTest) => {
    setIsTestRunning(true);
    setTestResult(null);

    try {
      const startTime = Date.now();
      const headers = await getAuthHeaders();

      // Build URL with query parameters
      const url = buildUrl(test.endpoint, test.queryParams);

      const requestInit: RequestInit = {
        method: test.method,
        headers,
      };

      if (test.body && test.method !== 'GET') {
        requestInit.body = JSON.stringify(test.body);
      }

      const response = await fetch(url, requestInit);
      const responseTime = Date.now() - startTime;

      let data: string | Record<string, unknown> | unknown[] | undefined;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = (await response.json()) as Record<string, unknown> | unknown[];
      } else {
        data = await response.text();
      }

      setTestResult({
        success: response.ok,
        status: response.status,
        responseTime,
        data,
        timestamp: new Date().toISOString(),
        requestDetails: {
          method: test.method,
          endpoint: url,
          headers,
          body: test.body ? JSON.stringify(test.body, null, 2) : undefined,
        },
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
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'offline':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'checking':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'error':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: ApiStatus['status']) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'offline':
        return '❌';
      case 'checking':
        return '⏳';
      case 'error':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const formatData = (
    data: string | Record<string, unknown> | unknown[] | undefined,
  ): string => {
    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  };

  const apiTests = createApiTests(testInputs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-4">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className={`text-3xl font-bold text-white mb-8 ${isArabic ? 'font-arabic text-right' : ''}`}
        >
          {isArabic ? 'حالة واجهة برمجة التطبيقات' : 'API Status Dashboard'}
        </h1>

        {/* Test Configuration */}
        <motion.div
          className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border backdrop-blur-sm mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2
            className={`text-xl font-semibold text-white mb-4 ${isArabic ? 'font-arabic text-right' : ''}`}
          >
            {isArabic ? 'إعداد الاختبار' : 'Test Configuration'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text-muted mb-2">
                {isArabic ? 'معرف الجلسة' : 'Session ID'}
              </label>
              <input
                type="text"
                value={testInputs.sessionId}
                onChange={(e) =>
                  setTestInputs((prev) => ({
                    ...prev,
                    sessionId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-theme-surface/30 border border-theme-border rounded-lg text-white placeholder-theme-text-muted focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                placeholder="TEST_123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-muted mb-2">
                {isArabic ? 'اسم الغرفة' : 'Room Name'}
              </label>
              <input
                type="text"
                value={testInputs.roomName}
                onChange={(e) =>
                  setTestInputs((prev) => ({
                    ...prev,
                    roomName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-theme-surface/30 border border-theme-border rounded-lg text-white placeholder-theme-text-muted focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                placeholder="test-room-123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-muted mb-2">
                {isArabic ? 'اسم المستخدم' : 'User Name'}
              </label>
              <input
                type="text"
                value={testInputs.userName}
                onChange={(e) =>
                  setTestInputs((prev) => ({
                    ...prev,
                    userName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-theme-surface/30 border border-theme-border rounded-lg text-white placeholder-theme-text-muted focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                placeholder="test-user"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-muted mb-2">
                {isArabic ? 'معرف اللعبة' : 'Game ID'}
              </label>
              <input
                type="text"
                value={testInputs.gameId}
                onChange={(e) =>
                  setTestInputs((prev) => ({ ...prev, gameId: e.target.value }))
                }
                className="w-full px-3 py-2 bg-theme-surface/30 border border-theme-border rounded-lg text-white placeholder-theme-text-muted focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                placeholder="game_123456"
              />
            </div>
          </div>
        </motion.div>

        {/* API Status Overview */}
        <motion.div
          className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border backdrop-blur-sm mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-xl font-semibold text-white ${isArabic ? 'font-arabic' : ''}`}
            >
              {isArabic ? 'نظرة عامة على حالة الواجهة' : 'API Status Overview'}
            </h2>
            <button
              onClick={checkAllApis}
              className="px-4 py-2 bg-theme-primary/20 hover:bg-theme-primary/30 text-theme-primary border border-theme-primary/30 rounded-lg transition-colors"
            >
              {isArabic ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {apiStatuses.map((api, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(api.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{api.name}</span>
                  <span className="text-lg">{getStatusIcon(api.status)}</span>
                </div>
                <div className="text-sm opacity-75">
                  <div>{api.status.toUpperCase()}</div>
                  {api.responseTime && <div>{api.responseTime}ms</div>}
                  {api.error && (
                    <div className="text-xs mt-1 truncate" title={api.error}>
                      {api.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* API Tests */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Test Selection */}
          <div className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border backdrop-blur-sm">
            <h3
              className={`text-lg font-semibold text-white mb-4 ${isArabic ? 'font-arabic' : ''}`}
            >
              {isArabic ? 'اختبارات الواجهة' : 'API Tests'}
            </h3>

            {/* Group tests by category */}
            {['supabase', 'daily', 'session'].map((category) => (
              <div key={category} className="mb-6">
                <h4 className="text-md font-medium text-theme-text-muted mb-3 capitalize">
                  {category} APIs
                </h4>
                <div className="space-y-2">
                  {apiTests
                    .filter((test) => test.category === category)
                    .map((test, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTest(test)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedTest === test
                            ? 'bg-theme-primary/20 border-theme-primary/50 text-theme-primary'
                            : 'bg-theme-surface/10 border-theme-border hover:bg-theme-surface/20 text-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{test.name}</div>
                            <div className="text-sm opacity-75 mt-1">
                              {test.method} {test.endpoint}
                              {test.queryParams && (
                                <span className="text-theme-primary">
                                  ?
                                  {new URLSearchParams(
                                    test.queryParams,
                                  ).toString()}
                                </span>
                              )}
                            </div>
                            <div className="text-xs opacity-60 mt-1">
                              {test.description}
                            </div>
                          </div>
                          {test.requiresAuth && (
                            <span className="px-2 py-1 text-xs bg-yellow-400/20 text-yellow-400 rounded">
                              Auth
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Test Results */}
          <div className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-semibold text-white ${isArabic ? 'font-arabic' : ''}`}
              >
                {isArabic ? 'نتائج الاختبار' : 'Test Results'}
              </h3>
              {selectedTest && (
                <button
                  onClick={() => runApiTest(selectedTest)}
                  disabled={isTestRunning}
                  className="px-4 py-2 bg-theme-primary hover:bg-theme-primary/80 disabled:bg-theme-primary/50 text-white rounded-lg transition-colors"
                >
                  {isTestRunning
                    ? isArabic
                      ? 'جاري التشغيل...'
                      : 'Running...'
                    : isArabic
                      ? 'تشغيل الاختبار'
                      : 'Run Test'}
                </button>
              )}
            </div>

            {!selectedTest && (
              <div className="text-center text-theme-text-muted py-8">
                {isArabic ? 'اختر اختبارًا لتشغيله' : 'Select a test to run'}
              </div>
            )}

            {selectedTest && !testResult && !isTestRunning && (
              <div className="text-center text-theme-text-muted py-8">
                {isArabic
                  ? 'انقر على "تشغيل الاختبار" لبدء الاختبار'
                  : 'Click "Run Test" to start testing'}
              </div>
            )}

            {isTestRunning && (
              <div className="text-center text-theme-text-muted py-8">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2"></div>
                <div>
                  {isArabic ? 'جاري تشغيل الاختبار...' : 'Running test...'}
                </div>
              </div>
            )}

            {testResult && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${
                    testResult.success
                      ? 'bg-green-400/10 border-green-400/30 text-green-400'
                      : 'bg-red-400/10 border-red-400/30 text-red-400'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {testResult.success
                        ? isArabic
                          ? 'نجح الاختبار'
                          : 'Test Passed'
                        : isArabic
                          ? 'فشل الاختبار'
                          : 'Test Failed'}
                    </span>
                    <span className="text-sm">
                      {testResult.status && `HTTP ${testResult.status}`}
                      {testResult.responseTime &&
                        ` • ${testResult.responseTime}ms`}
                    </span>
                  </div>
                  {testResult.error && (
                    <div className="text-sm opacity-75">{testResult.error}</div>
                  )}
                </div>

                {/* Request Details */}
                {testResult.requestDetails && (
                  <div className="bg-theme-surface/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">
                      {isArabic ? 'تفاصيل الطلب' : 'Request Details'}
                    </h4>
                    <pre className="text-sm text-theme-text-muted whitespace-pre-wrap overflow-auto max-h-40">
                      {`Method: ${testResult.requestDetails.method}
Endpoint: ${testResult.requestDetails.endpoint}
Headers: ${JSON.stringify(testResult.requestDetails.headers, null, 2)}${testResult.requestDetails.body ? `\nBody: ${testResult.requestDetails.body}` : ''}`}
                    </pre>
                  </div>
                )}

                {/* Response Data */}
                {testResult.data && (
                  <div className="bg-theme-surface/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">
                      {isArabic ? 'بيانات الاستجابة' : 'Response Data'}
                    </h4>
                    <pre className="text-sm text-theme-text-muted whitespace-pre-wrap overflow-auto max-h-60">
                      {formatData(testResult.data)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
