// Base response utilities for Netlify functions
export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// Handle CORS preflight requests
export function handleCors(): ApiResponse {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: '',
  };
}

// Create success response
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
): ApiResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response),
  };
}

// Create error response
export function createErrorResponse(
  error: string,
  code: string,
  statusCode: number = 400,
  details?: string,
): ApiResponse {
  const response: ApiError = {
    error,
    code,
    ...(details && { details }),
  };

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response),
  };
}

// Validate JSON request body
export function parseRequestBody<T>(body: string | null): T | null {
  if (!body) return null;
  
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

// Validate method
export function validateMethod(
  method: string,
  allowedMethods: string[],
): boolean {
  return allowedMethods.includes(method);
}
