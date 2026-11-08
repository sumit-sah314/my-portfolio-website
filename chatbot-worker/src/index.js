// Cloudflare Worker: RAG chatbot backend for the portfolio site.
// POST /chat {message, history} -> {answer, sources}
// GET  /health                  -> {ok, chunks}

import knowledge from "./knowledge.json";
import { DEFAULT_CHAT_MODEL, DEFAULT_EMBED_MODEL, GeminiError, embedQuery, generate } from "./gemini.js";
import { SYSTEM_PROMPT, buildContents, cleanHistory, cleanMessage, sourceSections, topK } from "./rag.js";

// 8 short chunks is still a small prompt, and list questions ("what awards...") need several.
const TOP_K = 8;

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  if (!origin || !allowedOrigins(env).includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: cors["Access-Control-Allow-Origin"] ? 204 : 403, headers: cors });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, chunks: knowledge.chunks.length }, 200, cors);
    }

    if (url.pathname !== "/chat" || request.method !== "POST") {
      return json({ error: "Not found." }, 404, cors);
    }

    // Browsers from other sites are refused. (This does not stop scripts like curl; see README for rate limiting.)
    if (!cors["Access-Control-Allow-Origin"]) {
      return json({ error: "Origin not allowed." }, 403, cors);
    }

    if (env.RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: "You're sending messages too quickly. Please wait a minute." }, 429, cors);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: "The chatbot isn't configured yet (missing API key)." }, 503, cors);
    }
    if (!knowledge.chunks.length) {
      return json({ error: "The chatbot's knowledge base hasn't been built yet." }, 503, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be JSON." }, 400, cors);
    }

    const message = cleanMessage(body?.message);
    if (!message) {
      return json({ error: "Please send a question between 1 and 600 characters." }, 400, cors);
    }
    const history = cleanHistory(body?.history);

    const embedModel = env.GEMINI_EMBED_MODEL || DEFAULT_EMBED_MODEL;
    if (knowledge.embedModel && knowledge.embedModel !== embedModel) {
      // Query and document vectors must come from the same model to be comparable.
      return json({ error: "Knowledge base was built with a different embedding model. Rebuild it." }, 500, cors);
    }

    try {
      const queryEmbedding = await embedQuery(env.GEMINI_API_KEY, embedModel, message);
      const retrieved = topK(queryEmbedding, knowledge.chunks, TOP_K);
      const contents = buildContents(message, history, retrieved);
      const answer = await generate(env.GEMINI_API_KEY, env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL, SYSTEM_PROMPT, contents);
      // When the bot couldn't answer, listing sources would wrongly suggest it found something.
      const couldNotAnswer = /\b(don't|do not) know\b|can only help with/i.test(answer);
      return json({ answer, sources: couldNotAnswer ? [] : sourceSections(retrieved) }, 200, cors);
    } catch (error) {
      console.error(error);
      if (error instanceof GeminiError && error.status === 429) {
        return json({ error: "The chatbot has hit its free usage limit for now. Please try again later." }, 429, cors);
      }
      return json({ error: "Something went wrong answering that. Please try again." }, 502, cors);
    }
  },
};
