/**
 * Netlify Serverless Function — Triverse API Proxy
 * Endpoint: /.netlify/functions/proxy
 *
 * Query params:
 *   ?path=relief/generate   (o qualsiasi endpoint Triverse)
 *
 * Headers richiesti dal client:
 *   X-Api-Key: <triverse_api_key>
 */

const TRIVERSE_BASE = 'https://api.triverse.ai/api/v1';

exports.handler = async function (event) {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: '',
    };
  }

  const path   = (event.queryStringParameters || {}).path || '';
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'] || '';

  if (!apiKey) return errJson(400, 'Missing X-Api-Key header');
  if (!path)   return errJson(400, 'Missing ?path= query param');

  const targetUrl = `${TRIVERSE_BASE}/${path}`;

  // Build upstream headers
  const upstreamHeaders = {
    Authorization: `Bearer ${apiKey}`,
  };

  // Forward content-type (needed for multipart/form-data)
  const ct = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (ct) upstreamHeaders['content-type'] = ct;

  // Body: Netlify gives base64-encoded body for binary (multipart)
  let body;
  if (event.body) {
    body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;
  }

  let upstreamRes;
  try {
    upstreamRes = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: upstreamHeaders,
      body: body || undefined,
    });
  } catch (err) {
    return errJson(502, `Upstream fetch failed: ${err.message}`);
  }

  // Read response
  const resContentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
  let resBody;
  let isBase64 = false;

  if (resContentType.includes('json') || resContentType.includes('text')) {
    resBody = await upstreamRes.text();
  } else {
    // Binary (GLB, STL…)
    const buf = await upstreamRes.arrayBuffer();
    resBody = Buffer.from(buf).toString('base64');
    isBase64 = true;
  }

  return {
    statusCode: upstreamRes.status,
    headers: {
      'content-type': resContentType,
      ...corsHeaders(),
    },
    body: resBody,
    isBase64Encoded: isBase64,
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization',
  };
}

function errJson(status, message) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    body: JSON.stringify({ code: status, message }),
  };
}
