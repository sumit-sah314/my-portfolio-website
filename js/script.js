const THEME_KEY = "portfolio-theme";
const THEMES = /** @type {const} */ (["dark", "light", "ocean"]);
/** @typedef {(typeof THEMES)[number]} ThemeId */

/** @type {Record<ThemeId, { emoji: string; label: string; themeColor: string }>} */
const THEME_META = {
  dark: { emoji: "🌙", label: "dark", themeColor: "#0b0b0f" },
  light: { emoji: "☀️", label: "light", themeColor: "#f6f4ef" },
  ocean: { emoji: "🌊", label: "ocean", themeColor: "#060a12" },
};

/** @returns {ThemeId} */
function getStoredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "ocean" || saved === "dark") {
    return saved;
  }
  return "dark";
}

/** @param {ThemeId} id */
function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", THEME_META[id].themeColor);
  }

  const btn = document.getElementById("theme-btn");
  if (btn) {
    const { emoji, label } = THEME_META[id];
    btn.textContent = emoji;
    btn.title = `Theme: ${label} (click to cycle)`;
    btn.setAttribute("aria-label", `Cycle theme. Current theme: ${label}.`);
  }
}

/** @param {ThemeId} id */
function persistTheme(id) {
  localStorage.setItem(THEME_KEY, id);
}

function initTheme() {
  applyTheme(getStoredTheme());
  const btn = document.getElementById("theme-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = /** @type {ThemeId} */ (document.documentElement.dataset.theme || "dark");
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    applyTheme(next);
    persistTheme(next);
  });
}

function initMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const backdrop = document.getElementById("nav-backdrop");
  const navAnchors = document.querySelectorAll(".nav-links a");

  if (!toggle || !backdrop) return;

  function setNavOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
    backdrop.classList.toggle("is-visible", open);
    backdrop.setAttribute("aria-hidden", open ? "false" : "true");
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    setNavOpen(!expanded);
  });

  backdrop.addEventListener("click", () => setNavOpen(false));

  navAnchors.forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      setNavOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && document.body.classList.contains("nav-open")) {
      setNavOpen(false);
    }
  });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Scroll spy — navbar + sidebar rail dots
const sections = Array.from(document.querySelectorAll("section[id]"));
const navLinks = document.querySelectorAll(".nav-links a");
const railLinks = document.querySelectorAll(".rail-nav a");

function syncSectionHighlight(activeId) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });

  railLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const match = href && href.startsWith("#") && href.slice(1) === activeId;
    if (match) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

const spyObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => {
        const r = (b.intersectionRatio || 0) - (a.intersectionRatio || 0);
        return r !== 0 ? r : a.target.id.localeCompare(b.target.id);
      });
    if (visible[0]?.target?.id) {
      syncSectionHighlight(visible[0].target.id);
    }
  },
  {
    threshold: [0.08, 0.14, 0.22, 0.34, 0.5],
    rootMargin: "-38% 0px -42% 0px",
  }
);

sections.forEach((s) => spyObserver.observe(s));

function initScrollReveal() {
  if (prefersReducedMotion()) {
    document.querySelectorAll(".section.section-reveal").forEach((el) => el.classList.add("is-in-view"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
        }
      });
    },
    {
      threshold: 0,
      rootMargin: "0px 0px -6% 0px",
    }
  );

  document.querySelectorAll(".section.section-reveal").forEach((el) => revealObserver.observe(el));
}

// Typewriter effect
function typeWriter(el, text, speed, done) {
  let i = 0;
  el.textContent = "";
  function tick() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(tick, speed);
    } else if (done) {
      done();
    }
  }
  tick();
}

const nameEl = document.getElementById("typewriter-name");
const lineEl = document.getElementById("typewriter-line");

if (nameEl && lineEl) {
  const nameText = "Sumit Sah.";
  const lineText = "I go by Sum. Yeah, like the summation in math - a math lover, lol.";

  if (prefersReducedMotion()) {
    nameEl.textContent = nameText;
    lineEl.textContent = lineText;
  } else {
    typeWriter(nameEl, nameText, 80, () => {
      typeWriter(lineEl, lineText, 35);
    });
  }
}

// Gallery slider
const galleryImageEl = document.getElementById("gallery-image");
const galleryPrevBtn = document.getElementById("gallery-prev");
const galleryNextBtn = document.getElementById("gallery-next");
const galleryIndexEl = document.getElementById("gallery-index");
const galleryTotalEl = document.getElementById("gallery-total");
const galleryCaptionEl = document.getElementById("gallery-caption");

if (
  galleryImageEl &&
  galleryPrevBtn &&
  galleryNextBtn &&
  galleryIndexEl &&
  galleryTotalEl &&
  galleryCaptionEl
) {
  const galleryItems = [
    { src: "assets/images/profile.jpg", caption: "Profile portrait - replace with your own caption." },
    { src: "assets/images/profile.jpg", caption: "Conference, campus, or project moment." },
    { src: "assets/images/profile.jpg", caption: "Data science or machine learning work snapshot." },
    { src: "assets/images/profile.jpg", caption: "Math + code creative work sample." },
    { src: "assets/images/profile.jpg", caption: "Research or presentation highlight." },
    { src: "assets/images/profile.jpg", caption: "Another favorite moment from your journey." },
  ];

  let galleryCurrent = 0;
  galleryTotalEl.textContent = String(galleryItems.length);
  galleryCaptionEl.textContent = galleryItems[galleryCurrent].caption;

  const flickerMs = prefersReducedMotion() ? 0 : 140;

  function updateGalleryImage(newIndex) {
    galleryImageEl.classList.add("is-changing");
    setTimeout(() => {
      galleryCurrent = (newIndex + galleryItems.length) % galleryItems.length;
      galleryImageEl.src = galleryItems[galleryCurrent].src;
      galleryImageEl.alt = `Gallery image ${galleryCurrent + 1}`;
      galleryIndexEl.textContent = String(galleryCurrent + 1);
      galleryCaptionEl.textContent = galleryItems[galleryCurrent].caption;
      galleryImageEl.classList.remove("is-changing");
    }, flickerMs);
  }

  galleryPrevBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent - 1));
  galleryNextBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent + 1));
}

initTheme();
initMobileNav();
initScrollReveal();

if (sections[0]?.id) {
  syncSectionHighlight(sections[0].id);
}
