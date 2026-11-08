#!/usr/bin/env node
// Builds src/knowledge.json: the chatbot's searchable knowledge base.
//
// Sources:
//   - knowledge/*.md            your resume and notes (one chunk per "## " heading)
//   - ../index.html             every website section, one chunk per card
//   - ../js/script.js           photo gallery captions
//
// Usage:
//   npm run build-index                   embed with Gemini and write src/knowledge.json
//   npm run build-index -- --dry-run      print the chunks only (no API key needed)
//   npm run build-index -- --knowledge-only  skip the website, use only knowledge/*.md

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_EMBED_MODEL, EMBED_DIMENSIONS, embedBatch } from "../src/gemini.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKER_DIR = resolve(HERE, "..");
const SITE_DIR = resolve(WORKER_DIR, "..");
const OUT_FILE = join(WORKER_DIR, "src", "knowledge.json");
const MAX_CHUNK_CHARS = 1400;
// Visitors' questions almost always name Sumit, but most chunks don't. Without this prefix the few
// chunks that mention the name win every search (tested: 5/12 vs 12/12 questions found the right chunk).
// Only the embedded text gets the prefix; the stored text the bot reads is unchanged.
const EMBED_PREFIX = "About Sumit Sah. ";
const EMBED_BATCH_SIZE = 50;

// ---------- HTML to text ----------

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", bull: "•", middot: "·", mdash: "—", ndash: "–" };

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/** Turn an HTML fragment into readable text. Links keep their URL so the bot can share it. */
export function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|svg|canvas|video|button)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/(span|div)>/gi, " ")
      .replace(/<a\b[^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
        const text = label.replace(/<[^>]+>/g, "").trim();
        return text ? `${text} (${href})` : href;
      })
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|h[1-6]|div|figcaption)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** Split long text at line (then sentence) boundaries so each piece stays under the size limit. */
function splitLong(text) {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const units = text
    .split("\n")
    .flatMap((line) => (line.length <= MAX_CHUNK_CHARS ? [line] : line.match(/[^.!?]+[.!?]*\s*/g) || [line]));
  const pieces = [];
  let current = "";
  for (const unit of units) {
    if (current && current.length + unit.length + 1 > MAX_CHUNK_CHARS) {
      pieces.push(current.trim());
      current = "";
    }
    current += `${unit}\n`;
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

// ---------- Chunk sources ----------

/**
 * The hero greeting is typed out by js/script.js, so the HTML spans are empty.
 * Copy that text in so the intro chunk says who the site is about.
 */
export function fillTypewriter(html, js) {
  const name = js.match(/const nameText = "((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  const line = js.match(/const lineText = "((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  return html
    .replace(/<span class="tw-cursor">\|<\/span>/g, "")
    .replace(/(<span id="typewriter-name">)(<\/span>)/, `$1${name}$2`)
    .replace(/(<span id="typewriter-line">)(<\/span>)/, `$1${line}$2`);
}

/** One chunk per card (<article> or .card) in each <section>, plus the section's own intro text. */
export function chunksFromHtml(html) {
  const chunks = [];
  const sectionRe = /<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;

  for (const [, id, rawBody] of html.matchAll(sectionRe)) {
    // Drop slide counters like "1 / 5".
    const body = rawBody.replace(/<p class="(?:section-carousel-meta|gallery-meta)"[\s\S]*?<\/p>/gi, "");

    // The gallery is filled in by JavaScript; its captions come from chunksFromGallery instead.
    if (id === "gallery") continue;

    if (id === "home") {
      const text = htmlToText(body.replace(/<div class="hero-symbols"[\s\S]*?<\/div>/i, ""));
      if (text) chunks.push({ id: "home", section: "Introduction", title: "Introduction: Sumit Sah", text });
      continue;
    }

    const h2 = body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    const sectionName = h2 ? htmlToText(h2[1]) : id;
    const afterH2 = h2 ? body.slice(h2.index + h2[0].length) : body;
    const parts = afterH2.split(/(?=<article\b|<div class="card")/i);

    parts.forEach((part, i) => {
      const h3 = part.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
      const heading = h3 ? htmlToText(h3[1]) : "";
      const text = htmlToText(h3 ? part.replace(h3[0], "") : part);
      if (!heading && text.length < 40) return; // wrappers, empty containers

      const title = heading ? `${sectionName}: ${heading}` : sectionName;
      splitLong(heading ? `${heading}\n${text}` : text).forEach((piece, j) => {
        chunks.push({ id: `${id}-${i}-${j}`, section: sectionName, title, text: piece });
      });
    });
  }

  return chunks;
}

/** Social links and resume link, so "how do I contact Sumit?" has an answer. */
export function contactChunk(html) {
  const links = [...html.matchAll(/<a\b[^>]*href="(https?:[^"]+)"[^>]*aria-label="([^"]+)"/gi)].map(([, rawHref, label]) => {
    const href = decodeEntities(rawHref);
    // The email icon opens a Gmail compose URL; show the plain address instead.
    const email = href.match(/[?&]to=([^&]+@[^&]+)/);
    return email ? `${label}: ${decodeURIComponent(email[1])}` : `${label}: ${href}`;
  });
  const resume = html.match(/href="([^"]*Resume[^"]*\.pdf)"/i);
  const lines = [...new Set(links)];
  if (resume) lines.push(`Resume (PDF): ${resume[1]} (also linked from the "View Resume" button on the site)`);
  if (!lines.length) return [];
  return [{ id: "contact", section: "Contact", title: "Contact and social links", text: `Ways to reach Sumit Sah:\n${lines.join("\n")}` }];
}

/** Gallery captions from DEFAULT_GALLERY_PHOTOS in js/script.js. */
export function chunksFromGallery(js) {
  const block = js.match(/const DEFAULT_GALLERY_PHOTOS = \[([\s\S]*?)\n\];/);
  if (!block) return [];
  const items = [...block[1].matchAll(/caption:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?location:\s*"((?:[^"\\]|\\.)*)"/g)].map(
    ([, caption, location]) => `- ${caption} (${location})`,
  );
  if (!items.length) return [];
  return splitLong(`Photos and moments from Sumit's life, from the site's photo gallery:\n${items.join("\n")}`).map(
    (text, i) => ({ id: `gallery-${i}`, section: "Photo Gallery", title: "Photo Gallery", text }),
  );
}

/** Your own notes in knowledge/*.md, one chunk per "## " heading. */
export function chunksFromNotes(dir) {
  if (!existsSync(dir)) return [];
  const chunks = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    const raw = readFileSync(join(dir, file), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    raw.split(/^## /m).slice(1).forEach((block, i) => {
      const [headingLine, ...rest] = block.split("\n");
      const heading = headingLine.trim();
      const text = rest.join("\n").trim();
      if (!heading || !text) return;
      splitLong(`${heading}\n${text}`).forEach((piece, j) => {
        chunks.push({ id: `${file.replace(/\.md$/, "")}-${i}-${j}`, section: heading, title: heading, text: piece });
      });
    });
  }
  return chunks;
}

// ---------- Main ----------

function readApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const devVars = join(WORKER_DIR, ".dev.vars");
  if (existsSync(devVars)) {
    const match = readFileSync(devVars, "utf8").match(/^\s*GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
    if (match) return match[1].trim();
  }
  return "";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  // `source` tells the bot where each fact came from, so it can prefer the resume when sources disagree.
  const chunks = chunksFromNotes(join(WORKER_DIR, "knowledge")).map((c) => ({
    ...c,
    source: c.id.startsWith("resume-") ? "resume" : "Sumit's notes",
  }));

  // The website itself: sections, gallery captions, social links.
  if (!process.argv.includes("--knowledge-only")) {
    const js = readFileSync(join(SITE_DIR, "js", "script.js"), "utf8");
    const html = fillTypewriter(readFileSync(join(SITE_DIR, "index.html"), "utf8"), js);
    const siteChunks = [...chunksFromHtml(html), ...contactChunk(html), ...chunksFromGallery(js)];
    chunks.push(...siteChunks.map((c) => ({ ...c, source: "website" })));
  }

  if (!chunks.length) {
    console.error("No knowledge found. Add sections to chatbot-worker/knowledge/*.md.");
    process.exit(1);
  }

  if (dryRun) {
    for (const c of chunks) console.log(`\n=== [${c.id}] ${c.title} (${c.text.length} chars)\n${c.text}`);
    console.log(`\n${chunks.length} chunks (dry run, nothing written).`);
    return;
  }

  const apiKey = readApiKey();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY. Put it in chatbot-worker/.dev.vars or set the environment variable.");
    process.exit(1);
  }

  const model = process.env.GEMINI_EMBED_MODEL || DEFAULT_EMBED_MODEL;
  const out = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await embedBatch(
      apiKey,
      model,
      batch.map((c) => ({ title: c.title, text: EMBED_PREFIX + c.text })),
      "RETRIEVAL_DOCUMENT",
    );
    batch.forEach((chunk, j) => {
      // Round to 6 decimals: plenty of precision, much smaller file.
      out.push({ ...chunk, embedding: vectors[j].map((v) => Math.round(v * 1e6) / 1e6) });
    });
    console.log(`Embedded ${Math.min(i + EMBED_BATCH_SIZE, chunks.length)}/${chunks.length}`);
  }

  writeFileSync(
    OUT_FILE,
    JSON.stringify({ embedModel: model, dimensions: EMBED_DIMENSIONS, builtAt: new Date().toISOString(), chunks: out }) + "\n",
  );
  console.log(`Wrote ${out.length} chunks to ${OUT_FILE}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
