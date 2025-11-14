import type { Context } from "@netlify/functions";

const TRANSFERMARKT_API_BASE = "https://transfermarkt-api-jftx.onrender.com";

export default async (req: Request, context: Context) => {
  // Get the path from query params
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint");

  if (!endpoint) {
    return new Response(
      JSON.stringify({ error: "Missing endpoint parameter" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }

  try {
    // Make request to Transfermarkt API
    const apiUrl = `${TRANSFERMARKT_API_BASE}${endpoint}`;
    console.log("Proxying request to:", apiUrl);

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
};
