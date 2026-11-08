// Minimal Gemini REST client, shared by the Worker and the build script (both have global fetch).

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";
export const DEFAULT_EMBED_MODEL = "gemini-embedding-001";
// Smaller vectors keep knowledge.json small; 768 is one of the sizes Google recommends.
export const EMBED_DIMENSIONS = 768;

export class GeminiError extends Error {
  /** @param {string} message @param {number} status */
  constructor(message, status) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

async function call(apiKey, model, method, body) {
  const response = await fetch(`${API_BASE}/models/${model}:${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error?.message || "";
    } catch {
      // Body was not JSON; the status code is enough.
    }
    throw new GeminiError(`Gemini ${method} failed (${response.status})${detail ? `: ${detail}` : ""}`, response.status);
  }

  return response.json();
}

/**
 * Embed several texts in one request.
 * @param {string} apiKey
 * @param {string} model
 * @param {{text: string, title?: string}[]} items
 * @param {"RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"} taskType
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(apiKey, model, items, taskType) {
  const data = await call(apiKey, model, "batchEmbedContents", {
    requests: items.map((item) => ({
      model: `models/${model}`,
      content: { parts: [{ text: item.text }] },
      taskType,
      ...(item.title && taskType === "RETRIEVAL_DOCUMENT" ? { title: item.title } : {}),
      outputDimensionality: EMBED_DIMENSIONS,
    })),
  });
  return data.embeddings.map((e) => e.values);
}

/** @returns {Promise<number[]>} */
export async function embedQuery(apiKey, model, text) {
  const [values] = await embedBatch(apiKey, model, [{ text }], "RETRIEVAL_QUERY");
  return values;
}

/**
 * Generate an answer.
 * @param {string} apiKey
 * @param {string} model
 * @param {string} systemPrompt
 * @param {object[]} contents Gemini `contents` array
 * @returns {Promise<string>}
 */
export async function generate(apiKey, model, systemPrompt, contents) {
  const data = await call(apiKey, model, "generateContent", {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 600,
      // Short factual answers don't need "thinking"; turning it off saves free-tier quota and latency.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || "").join("").trim();
  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "empty response";
    throw new GeminiError(`Gemini returned no text (${reason})`, 502);
  }
  return text;
}
