# Portfolio RAG chatbot

The "Ask about Sumit" chat bubble on the site. Visitors ask questions; the bot answers using only the files in `knowledge/` (your resume, plus anything you add), via Google Gemini's free tier.

```
Browser (js/chatbot.js)  ──POST /chat──▶  Cloudflare Worker (src/index.js)
                                            1. embed the question        (Gemini embeddings)
                                            2. find the 4 closest chunks (src/knowledge.json)
                                            3. answer from those chunks  (gemini-2.5-flash)
```

The Gemini API key lives only in the Worker as a secret. It is never in the site's code.

## What the bot knows

`npm run build-index` reads every `knowledge/*.md` file, one chunk per `## ` heading:

- `knowledge/resume.md`: your resume (copied from `assets/Sumit-Sah-Resume.pdf`)
- `knowledge/about-me.md`: more about you; starts empty, with examples in a comment

Run `npm run build-index -- --dry-run` to print the chunks without calling Gemini.
Add `--include-site` to also index the website itself (sections, gallery captions, social links).

**Rebuild and redeploy whenever you change these files**, or the bot will answer from the old version.

## One-time setup

You need Node.js (already installed) and two free accounts.

1. **Get a Gemini API key**: go to https://aistudio.google.com/apikey, then "Create API key". The free tier needs no card.
2. **Create a Cloudflare account**: https://dash.cloudflare.com/sign-up (free, no card).
3. In this folder:

   ```sh
   cd chatbot-worker
   npm install
   cp .dev.vars.example .dev.vars      # then paste your key into .dev.vars (this file is git-ignored)
   npm run build-index                 # embeds the site content into src/knowledge.json
   npx wrangler login                  # opens the browser to connect Cloudflare
   npx wrangler secret put GEMINI_API_KEY   # paste the same key when asked
   npm run deploy
   ```

   The deploy prints a URL like `https://portfolio-chatbot.<your-subdomain>.workers.dev`.

4. **Connect the site**: in `../index.html`, set the endpoint to that URL plus `/chat`:

   ```html
   <meta name="chatbot-endpoint" content="https://portfolio-chatbot.<your-subdomain>.workers.dev/chat" />
   ```

   While this is empty, the chat bubble only appears on `localhost`, so the live site doesn't show a broken bot.

5. If the site isn't served from `https://sumit-sah314.github.io` (for example, a custom domain), add its origin to `ALLOWED_ORIGINS` in `wrangler.toml` and deploy again.

6. Commit the generated `src/knowledge.json` along with the `index.html` change.

## Running locally

```sh
# terminal 1: the site, from the repo root
python -m http.server 8000

# terminal 2: the Worker (reads the key from .dev.vars)
cd chatbot-worker && npm run dev
```

Open http://localhost:8000. The chat bubble talks to http://localhost:8787 automatically.

## Updating the bot after changing knowledge/

```sh
cd chatbot-worker
npm run build-index
npm run deploy
```

Then commit `src/knowledge.json`.

## Limits and safety

- **Rate limit**: 10 messages per minute per visitor IP (`[[ratelimits]]` in `wrangler.toml`). This protects your free Gemini quota from one person or a script.
- **Allowed sites**: browsers on other websites are refused (`ALLOWED_ORIGINS`). Scripts like curl can still call the Worker directly; the rate limit is what protects the quota.
- **Free-tier quota**: if Gemini's daily free limit is reached, visitors see "hit its free usage limit, try again later" instead of an error.
- **Privacy**: the bot can quote anything in `knowledge/*.md`. Only write what you're happy for any visitor to read.
- **Accuracy**: the bot is told to answer only from the retrieved content and to say it doesn't know otherwise, but it can still make mistakes. The widget says so.

## Changing models

Set `GEMINI_CHAT_MODEL` or `GEMINI_EMBED_MODEL` in `wrangler.toml`. If you change the embedding model, rebuild the index with the same model (`GEMINI_EMBED_MODEL=... npm run build-index`). The Worker refuses to answer if the two don't match.

## Tests

```sh
npm test
```
