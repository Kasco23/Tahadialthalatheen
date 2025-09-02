/**
 * Health Check Function
 * 
 * A simple function to validate that Netlify Functions are working properly.
 * Returns basic runtime information including Node.js version.
 * 
 * Available at: /.netlify/functions/health-check
 */

export default async () => {
  return new Response(JSON.stringify({ 
    ok: true, 
    runtime: process.version,
    timestamp: new Date().toISOString(),
    function: 'health-check'
  }), {
    status: 200,
    headers: { 
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};