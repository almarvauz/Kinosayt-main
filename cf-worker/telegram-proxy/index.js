/**
 * Cloudflare Worker — Telegram Bot API Proxy
 * Barcha so'rovlarni api.telegram.org ga yo'naltiradi
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // Telegram API ga yo'naltirish
    // Worker URL: https://your-worker.workers.dev/bot<TOKEN>/getMe
    // → api.telegram.org/bot<TOKEN>/getMe
    const targetUrl = "https://api.telegram.org" + url.pathname + url.search;

    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });

    try {
      const response = await fetch(newRequest);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("Access-Control-Allow-Origin", "*");
      return newResponse;
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
