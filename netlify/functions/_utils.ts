// Base response utilities for Netlify functions

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
export function handleCors(): Response {
  return new Response('', {
    status: 200,
    headers: corsHeaders,
  });
}

// Create success response
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
): Response {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: corsHeaders,
  });
}

// Create error response
export function createErrorResponse(
  error: string,
  code: string,
  statusCode: number = 400,
  details?: string,
): Response {
  const response: ApiError = {
    error,
    code,
    ...(details && { details }),
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: corsHeaders,
  });
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
