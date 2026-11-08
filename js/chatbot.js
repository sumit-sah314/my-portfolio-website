// "Sigma" chat widget (Σ = the sum of Sumit). Talks to the Cloudflare Worker in /chatbot-worker.
// The endpoint comes from <meta name="chatbot-endpoint">. When it's empty, the widget only
// appears on localhost (pointing at `npm run dev` on port 8787) and stays hidden on the live site.

(function initChatbot() {
  const LOCAL_ENDPOINT = "http://localhost:8787/chat";
  const MAX_CHARS = 600;
  const MAX_HISTORY = 6;
  const BOT_NAME = "Sigma";
  const SUGGESTIONS = [
    "What did Sumit work on at Microsoft?",
    "What research has Sumit done?",
    "What awards has Sumit won?",
    "How can I contact Sumit?",
  ];

  const configured = document.querySelector('meta[name="chatbot-endpoint"]')?.content.trim() || "";
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const endpoint = configured || (isLocal ? LOCAL_ENDPOINT : "");
  if (!endpoint) return;

  /** @type {{role: "user" | "assistant", text: string}[]} */
  const history = [];
  let busy = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ---------- Build the widget ----------

  const toggle = el("button", "chatbot-toggle");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "chatbot-panel");
  toggle.setAttribute("aria-label", `Chat with ${BOT_NAME}`);
  toggle.innerHTML =
    '<span class="chatbot-orb" aria-hidden="true">Σ</span>' +
    `<span class="chatbot-toggle-label">Ask ${BOT_NAME}</span>`;

  const panel = el("section", "chatbot-panel");
  panel.id = "chatbot-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", `Chat with ${BOT_NAME}`);

  const header = el("header", "chatbot-header");
  const identity = el("div", "chatbot-identity");
  const headerAvatar = el("span", "chatbot-avatar chatbot-avatar-lg", "Σ");
  headerAvatar.setAttribute("aria-hidden", "true");
  const titleWrap = el("div");
  const title = el("p", "chatbot-title", BOT_NAME);
  title.append(el("span", "chatbot-status", "online"));
  titleWrap.append(title, el("p", "chatbot-subtitle", "The sum of all things Sumit · AI, may make mistakes"));
  identity.append(headerAvatar, titleWrap);
  const closeBtn = el("button", "chatbot-close");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close chat");
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  header.append(identity, closeBtn);

  const log = el("div", "chatbot-log");
  log.setAttribute("aria-live", "polite");

  const suggestions = el("div", "chatbot-suggestions");
  SUGGESTIONS.forEach((question) => {
    const chip = el("button", "chatbot-chip", question);
    chip.type = "button";
    chip.addEventListener("click", () => ask(question));
    suggestions.append(chip);
  });

  const form = el("form", "chatbot-form");
  const input = el("input", "chatbot-input");
  input.type = "text";
  input.maxLength = MAX_CHARS;
  input.placeholder = `Ask ${BOT_NAME} anything about Sumit…`;
  input.setAttribute("aria-label", "Your question");
  input.autocomplete = "off";
  const send = el("button", "chatbot-send");
  send.type = "submit";
  send.setAttribute("aria-label", "Send");
  send.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  form.append(input, send);

  panel.append(header, log, suggestions, form);
  document.body.append(panel, toggle);

  addMessage(
    "assistant",
    `Hey, I'm ${BOT_NAME}, Sumit's assistant. Σ means "sum", so think of me as the sum of everything Sumit: experience, projects, research, and awards. What would you like to know?`
  );

  // ---------- Behaviour ----------

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.classList.toggle("is-open", open);
    if (open) input.focus();
    else toggle.focus();
  }

  // Appends a message row (assistant rows get a Σ avatar) and returns the bubble.
  function appendRow(role, bubble) {
    const row = el("div", `chatbot-row chatbot-row-${role}`);
    if (role === "assistant") {
      const avatar = el("span", "chatbot-avatar", "Σ");
      avatar.setAttribute("aria-hidden", "true");
      row.append(avatar);
    }
    row.append(bubble);
    log.append(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function addMessage(role, text, sources) {
    const bubble = el("div", `chatbot-msg chatbot-msg-${role}`);
    bubble.append(el("p", "chatbot-msg-text", text));
    if (sources?.length) bubble.append(el("p", "chatbot-sources", `From: ${sources.join(", ")}`));
    appendRow(role, bubble);
    return bubble;
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    send.disabled = value;
    suggestions.querySelectorAll("button").forEach((b) => (b.disabled = value));
  }

  async function ask(question) {
    const text = question.trim().slice(0, MAX_CHARS);
    if (!text || busy) return;

    suggestions.hidden = true;
    addMessage("user", text);
    input.value = "";
    setBusy(true);

    const typing = el("div", "chatbot-msg chatbot-msg-assistant chatbot-typing");
    typing.setAttribute("aria-label", `${BOT_NAME} is thinking`);
    typing.append(el("span"), el("span"), el("span"));
    const typingRow = appendRow("assistant", typing);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-MAX_HISTORY) }),
      });
      const data = await response.json().catch(() => ({}));
      typingRow.remove();

      if (!response.ok || !data.answer) {
        addMessage("assistant", data.error || "Sorry, I couldn't answer that right now. Please try again.").classList.add("chatbot-msg-error");
        return;
      }

      addMessage("assistant", data.answer, data.sources);
      history.push({ role: "user", text }, { role: "assistant", text: data.answer });
    } catch {
      typingRow.remove();
      addMessage("assistant", "I couldn't reach the chatbot service. Please check your connection and try again.").classList.add("chatbot-msg-error");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  closeBtn.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
})();
