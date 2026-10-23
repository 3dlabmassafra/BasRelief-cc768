/**
 * Vercel Serverless Proxy for Triverse AI API
 * Forwards browser requests to api.triverse.ai, bypassing CORS.
 *
 * Routes:
 *   POST /api/proxy  -> POST https://api.triverse.ai/api/v1/<path>
 *   GET  /api/proxy  -> GET  https://api.triverse.ai/api/v1/<path>
 *
 * The client must send the header: X-Api-Key: <triverse_api_key>
 * and the query param:             ?path=<endpoint_path>
 * e.g. ?path=relief/generate  or  ?path=tasks/abc123
 */

export const config = { runtime: "edge" };

const TRIVERSE_BASE = "https://api.triverse.ai/api/v1";

export default async function handler(req) {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "";
  const apiKey = req.headers.get("x-api-key") || "";

  if (!apiKey) {
    return json({ error: "Missing X-Api-Key header" }, 400);
  }
  if (!path) {
    return json({ error: "Missing ?path= query param" }, 400);
  }

  const targetUrl = `${TRIVERSE_BASE}/${path}`;

  // Forward all headers except host-related ones
  const forwardHeaders = new Headers();
  forwardHeaders.set("Authorization", `Bearer ${apiKey}`);

  // Forward content-type for POST
  const contentType = req.headers.get("content-type") || "";
  if (contentType) forwardHeaders.set("content-type", contentType);

  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = req.body;
  }

  let upstreamRes;
  try {
    upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      // Edge runtime supports duplex streaming
      duplex: "half",
    });
  } catch (err) {
    return json({ error: "Upstream fetch failed", detail: String(err) }, 502);
  }

  // Stream the upstream response back with CORS headers
  const responseHeaders = new Headers(upstreamRes.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => responseHeaders.set(k, v));
  // Remove headers that conflict with streaming
  responseHeaders.delete("content-encoding");

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, Authorization",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
