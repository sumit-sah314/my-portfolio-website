// Portfolio page behaviour: theme, navigation, hero, featured slideshows, gallery lightbox.

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ---------- Theme: "paper" (light), "chalk" (dark), "ocean" (Manim / Intuimation) ----------

const THEME_KEY = "portfolio-theme";
const THEME_META = {
  paper: { label: "paper", next: "chalk", themeColor: "#f5f1e8" },
  chalk: { label: "chalk", next: "ocean", themeColor: "#141a19" },
  ocean: { label: "ocean", next: "gold", themeColor: "#05080d" },
  gold: { label: "gold", next: "paper", themeColor: "#0b0b0f" },
};

function currentTheme() {
  const t = document.documentElement.dataset.theme;
  return t in THEME_META ? t : "paper";
}

function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_META[id].themeColor);
  const label = document.getElementById("theme-btn-label");
  const btn = document.getElementById("theme-btn");
  if (label) label.textContent = THEME_META[id].label;
  if (btn) btn.setAttribute("aria-label", `Theme: ${THEME_META[id].label}. Switch to ${THEME_META[id].next}.`);
}

function initTheme() {
  applyTheme(currentTheme());
  document.getElementById("theme-btn")?.addEventListener("click", () => {
    const next = THEME_META[currentTheme()].next;
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the theme still switches for this visit.
    }
  });
}

// ---------- Mobile navigation ----------

function initMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const backdrop = document.getElementById("nav-backdrop");
  if (!toggle || !backdrop) return;

  function setNavOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
    backdrop.classList.toggle("is-visible", open);
  }

  toggle.addEventListener("click", () => setNavOpen(toggle.getAttribute("aria-expanded") !== "true"));
  backdrop.addEventListener("click", () => setNavOpen(false));
  document.querySelectorAll(".nav-links a").forEach((link) => link.addEventListener("click", () => setNavOpen(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) setNavOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) setNavOpen(false);
  });
}

// ---------- Scroll spy, progress bar, reveal ----------

function initScrollSpy() {
  const links = document.querySelectorAll(".nav-links a");
  const targets = Array.from(document.querySelectorAll("main section[id], footer[id]"));

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const id = visible[0]?.target.id;
      if (!id) return;
      links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
    },
    { threshold: [0.1, 0.3, 0.5], rootMargin: "-35% 0px -45% 0px" }
  );
  targets.forEach((t) => observer.observe(t));
}

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress-bar");
  if (!bar) return;
  let ticking = false;
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

function initScrollReveal() {
  const els = document.querySelectorAll(".section-reveal");
  if (prefersReducedMotion()) {
    els.forEach((el) => el.classList.add("is-in-view"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  els.forEach((el) => observer.observe(el));
}

// ---------- Hero ----------

/** Filled from content/profile-photos.json. */
let PORTFOLIO_PHOTOS = [];

function initHeroCarousel() {
  const carousel = document.getElementById("hero-carousel");
  const img = document.getElementById("hero-slide-img");
  const dotsHost = document.getElementById("hero-carousel-dots");
  if (!carousel || !img || !dotsHost) return;
  if (PORTFOLIO_PHOTOS[0]) {
    img.src = PORTFOLIO_PHOTOS[0].src;
    img.alt = PORTFOLIO_PHOTOS[0].alt;
  }
  if (PORTFOLIO_PHOTOS.length < 2) {
    dotsHost.hidden = true;
    return;
  }

  let index = 0;
  let timerId = null;

  function updateDots() {
    dotsHost.querySelectorAll("button").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      dot.setAttribute("aria-selected", String(i === index));
    });
  }

  function show(next) {
    const target = (next + PORTFOLIO_PHOTOS.length) % PORTFOLIO_PHOTOS.length;
    const swap = () => {
      index = target;
      img.src = PORTFOLIO_PHOTOS[index].src;
      img.alt = PORTFOLIO_PHOTOS[index].alt;
      updateDots();
      requestAnimationFrame(() => img.classList.remove("is-fading"));
    };
    if (prefersReducedMotion()) return swap();
    img.classList.add("is-fading");
    window.setTimeout(swap, 350);
  }

  dotsHost.setAttribute("role", "tablist");
  PORTFOLIO_PHOTOS.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show photo ${i + 1} of ${PORTFOLIO_PHOTOS.length}`);
    dot.addEventListener("click", () => {
      show(i);
      restart();
    });
    dotsHost.append(dot);
  });
  updateDots();

  function stop() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  }
  function start() {
    stop();
    if (!prefersReducedMotion() && !document.hidden) timerId = window.setInterval(() => show(index + 1), 5200);
  }
  function restart() {
    stop();
    start();
  }

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
}

const MATH_CS_ML_INSIGHTS = [
  { formula: "P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}", fallback: "P(A|B) = P(B|A)P(A) / P(B)", meaning: "Bayes theorem updates beliefs after seeing new evidence." },
  { formula: "L(\\theta)=\\frac{1}{n}\\sum_{i=1}^{n}(y_i-\\hat{y}_i)^2", fallback: "L(theta) = (1/n) sum (y_i - y_hat_i)^2", meaning: "Least squares converts prediction error into an optimization objective." },
  { formula: "\\mathbf{w}\\leftarrow\\mathbf{w}-\\alpha\\nabla L(\\mathbf{w})", fallback: "w <- w - alpha * grad(L(w))", meaning: "Gradient descent is calculus implemented as an iterative algorithm." },
  { formula: "e^{i\\pi}+1=0", fallback: "e^(i*pi) + 1 = 0", meaning: "Euler's formula elegantly links exponential growth, trigonometry, and complex numbers." },
  { formula: "\\hat{y}=\\arg\\max_{c}\\,P(y=c\\mid x)", fallback: "y_hat = argmax_c P(y=c | x)", meaning: "In code, classifiers choose the label with maximum posterior probability." },
  { formula: "\\sigma(z)=\\frac{1}{1+e^{-z}}", fallback: "sigma(z) = 1 / (1 + e^(-z))", meaning: "The sigmoid maps real-valued scores into probabilities." },
  { formula: "\\mathrm{softmax}(z_i)=\\frac{e^{z_i}}{\\sum_j e^{z_j}}", fallback: "softmax(z_i) = e^(z_i) / sum_j e^(z_j)", meaning: "Softmax turns logits into a normalized class distribution." },
  { formula: "\\theta=(X^TX)^{-1}X^Ty", fallback: "theta = (X^T X)^(-1) X^T y", meaning: "The normal equation gives a closed-form least squares solution." },
  { formula: "\\frac{d}{dx}f(g(x))=f'(g(x))g'(x)", fallback: "d/dx f(g(x)) = f'(g(x)) g'(x)", meaning: "The chain rule powers backpropagation through neural networks." },
  { formula: "H(p)=-\\sum_i p_i\\log p_i", fallback: "H(p) = -sum_i p_i log p_i", meaning: "Entropy measures uncertainty and appears in cross-entropy losses." },
  { formula: "J(\\theta)=L(\\theta)+\\lambda\\lVert\\theta\\rVert_2^2", fallback: "J(theta) = L(theta) + lambda ||theta||_2^2", meaning: "L2 regularization controls model complexity and overfitting." },
];

function initEquationNote() {
  const host = document.getElementById("math-cs-ml-widget");
  const formulaEl = document.getElementById("insight-formula");
  const meaningEl = document.getElementById("insight-meaning");
  const tagEl = document.getElementById("insight-tag");
  if (!host || !formulaEl || !meaningEl) return;

  let index = 0;
  function paint() {
    const item = MATH_CS_ML_INSIGHTS[index];
    if (window.katex?.render) {
      window.katex.render(item.formula, formulaEl, { throwOnError: false, displayMode: false });
    } else {
      formulaEl.textContent = item.fallback;
    }
    meaningEl.textContent = item.meaning;
    if (tagEl) tagEl.textContent = `(${index + 1})`;
  }

  paint();
  // KaTeX loads with `defer`; repaint once it is available.
  window.addEventListener("load", paint);
  if (prefersReducedMotion()) return;

  window.setInterval(() => {
    if (document.hidden) return;
    host.classList.add("is-switching");
    window.setTimeout(() => {
      index = (index + 1) % MATH_CS_ML_INSIGHTS.length;
      paint();
      host.classList.remove("is-switching");
    }, 220);
  }, 4200);
}

function initTypewriter() {
  const lineEl = document.getElementById("typewriter-line");
  if (!lineEl || prefersReducedMotion()) return;
  const text = lineEl.textContent;
  lineEl.textContent = "";
  let i = 0;
  (function tick() {
    if (i < text.length) {
      lineEl.textContent += text[i++];
      window.setTimeout(tick, 32);
    }
  })();
}

// ---------- Featured slideshows ----------

function initFeaturedCarousel(carouselId, dotsId, photoLabel) {
  const carousel = document.getElementById(carouselId);
  const dotsHost = document.getElementById(dotsId);
  if (!carousel || !dotsHost) return;

  const slides = Array.from(carousel.querySelectorAll(".featured-media-slide"));
  if (slides.length < 2) {
    dotsHost.hidden = true;
    return;
  }

  let index = 0;
  let timerId = null;

  function render(i) {
    index = (i + slides.length) % slides.length;
    // Slides are stacked; the active one fades in over the others (see .featured-media-slide).
    slides.forEach((slide, idx) => {
      slide.classList.toggle("is-active", idx === index);
      slide.setAttribute("aria-hidden", String(idx !== index));
    });
    dotsHost.querySelectorAll("button").forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === index);
      dot.setAttribute("aria-selected", String(idx === index));
    });
  }

  function stop() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  }
  function start() {
    stop();
    if (!prefersReducedMotion() && !document.hidden) timerId = window.setInterval(() => render(index + 1), 5000);
  }

  dotsHost.setAttribute("role", "tablist");
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show ${photoLabel} photo ${i + 1} of ${slides.length}`);
    dot.addEventListener("click", () => {
      render(i);
      start();
    });
    dotsHost.append(dot);
  });

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  render(0);
  start();
}

// ---------- Content (edited through Pages CMS, stored in content/*.json) ----------

/**
 * Pages CMS stores image paths with a leading slash ("/assets/..."). The site is served from a
 * sub-folder on GitHub Pages, so make them relative or they would point at the domain root.
 */
function asset(path) {
  return String(path || "").replace(/^\/+/, "");
}

async function loadJson(name) {
  try {
    const response = await fetch(`content/${name}.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Could not load content/${name}.json:`, error);
    return [];
  }
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function renderExperience(items) {
  const host = document.getElementById("experience-list");
  if (!host) return;
  host.replaceChildren(
    ...items.map((item) => {
      const li = make("li", "timeline-item");
      const body = make("div", "timeline-body");
      body.append(make("h3", "", item.title), make("p", "timeline-org", item.organization), make("p", "", item.description));
      li.append(make("span", "timeline-date", item.dates), body);
      return li;
    })
  );
}

function renderProjects(items) {
  const host = document.getElementById("project-list");
  if (!host) return;
  host.replaceChildren(
    ...items.map((item, i) => {
      const card = make("article", "project-card");
      if (item.image) {
        const figure = make("figure", "project-media");
        const img = make("img");
        img.src = asset(item.image);
        img.alt = item.imageAlt || item.title || "";
        img.loading = "lazy";
        figure.append(img);
        card.append(figure);
      }
      const body = make("div", "project-body");
      body.append(make("p", "card-label", `Problem 4.${i + 1}`), make("h3", "", item.title), make("p", "", item.description));
      const links = make("div", "project-links");
      (item.links || []).forEach((link) => {
        if (!link?.url) return;
        const a = make("a", "text-link", link.label || link.url);
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener";
        links.append(a);
      });
      body.append(links);
      card.append(body);
      return card;
    })
  );
}

function renderAwards(items) {
  const host = document.getElementById("award-list");
  if (!host) return;
  host.replaceChildren(
    ...items.map((item, i) => {
      const card = make("article", "theorem");
      if (item.image) {
        const img = make("img", "theorem-image");
        img.src = asset(item.image);
        img.alt = item.imageAlt || item.title || "";
        img.loading = "lazy";
        if (item.imagePosition) img.style.objectPosition = item.imagePosition;
        card.append(img);
      }
      const body = make("div", "theorem-body");
      const label = make("p", "theorem-label", `Theorem 5.${i + 1} `);
      if (item.year) label.append(make("span", "theorem-year", item.year));
      body.append(label, make("h3", "", item.title), make("p", "", item.description));
      card.append(body);
      return card;
    })
  );
}

async function loadContent() {
  const [profile, gallery, experience, projects, awards] = await Promise.all(
    ["profile-photos", "gallery", "experience", "projects", "awards"].map(loadJson)
  );

  PORTFOLIO_PHOTOS = profile.filter((p) => p.image).map((p) => ({ src: asset(p.image), alt: p.alt || "Photo of Sumit Sah" }));
  GALLERY_PHOTOS = gallery
    .filter((p) => p.image)
    .map((p) => ({
      src: asset(p.image),
      alt: p.alt || p.location || "Gallery photo",
      caption: p.caption || "",
      location: p.location || "",
      objectPosition: p.imagePosition || "center",
    }));

  renderExperience(experience);
  renderProjects(projects);
  renderAwards(awards);
}

// ---------- Gallery grid + lightbox ----------

/** Filled from content/gallery.json. */
let GALLERY_PHOTOS = [];

// Clear data left behind by the old in-browser gallery manager.
try {
  ["portfolio-gallery-photos", "portfolio-gallery-pin-hash"].forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem("portfolio-gallery-admin");
} catch {
  // Storage unavailable; nothing to clean up.
}

function initGallery() {
  const grid = document.getElementById("gallery-grid");
  const dialog = /** @type {HTMLDialogElement | null} */ (document.getElementById("lightbox"));
  if (!grid || !dialog) return;

  const img = /** @type {HTMLImageElement} */ (document.getElementById("lightbox-image"));
  const caption = document.getElementById("lightbox-caption");
  const location = document.getElementById("lightbox-location");
  const indexEl = document.getElementById("lightbox-index");
  document.getElementById("lightbox-total").textContent = String(GALLERY_PHOTOS.length);
  let current = 0;

  GALLERY_PHOTOS.forEach((photo, i) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "gallery-tile";
    tile.setAttribute("aria-label", `Open photo: ${photo.location || photo.alt}`);

    const thumb = document.createElement("img");
    thumb.src = photo.src;
    thumb.alt = photo.alt;
    thumb.loading = "lazy";
    thumb.style.objectPosition = photo.objectPosition || "center";

    const label = document.createElement("span");
    label.className = "gallery-tile-label";
    label.textContent = photo.location;

    tile.append(thumb, label);
    tile.addEventListener("click", () => open(i));
    grid.append(tile);
  });

  function show(i) {
    current = (i + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
    const photo = GALLERY_PHOTOS[current];
    img.src = photo.src;
    img.alt = photo.alt;
    caption.textContent = photo.caption;
    location.textContent = photo.location || "";
    indexEl.textContent = String(current + 1);
  }

  function open(i) {
    show(i);
    dialog.showModal();
  }

  document.getElementById("lightbox-prev").addEventListener("click", () => show(current - 1));
  document.getElementById("lightbox-next").addEventListener("click", () => show(current + 1));
  document.getElementById("lightbox-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close(); // click on the backdrop
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
}

// ---------- Backdrop: floating equations + neural nets ----------

const BACKDROP_EQUATIONS = [
  "\\nabla_\\theta \\mathcal{L}",
  "\\mathrm{Attention}(Q,K,V)=\\mathrm{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V",
  "\\frac{\\partial \\mathcal{L}}{\\partial w_{ij}} = \\delta_j\\, a_i",
  "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}",
  "\\hat{f}(\\xi)=\\int_{-\\infty}^{\\infty} f(x)\\,e^{-2\\pi i x\\xi}\\,dx",
  "p(\\theta\\mid\\mathcal{D}) \\propto p(\\mathcal{D}\\mid\\theta)\\,p(\\theta)",
  "\\mathrm{ReLU}(x)=\\max(0,x)",
  "A = U\\Sigma V^\\top",
  "\\mathbb{E}[X]=\\sum_x x\\,p(x)",
  "D_{\\mathrm{KL}}(P\\Vert Q)=\\sum P\\log\\frac{P}{Q}",
  "h_t = \\tanh(W h_{t-1} + U x_t)",
  "\\det(A-\\lambda I)=0",
  "\\theta_{t+1}=\\theta_t-\\eta\\,\\hat{m}_t/(\\sqrt{\\hat{v}_t}+\\epsilon)",
  "\\mathcal{N}(\\mu,\\sigma^2)",
  "\\lim_{n\\to\\infty}\\left(1+\\frac{1}{n}\\right)^n=e",
  "y = \\sigma(Wx+b)",
  "\\oint_C \\mathbf{F}\\cdot d\\mathbf{r}",
  "\\Sigma",
  "W_2(\\mu,\\nu)",
  "\\arg\\min_\\theta \\; \\mathcal{L}(\\theta)",
];

// Layer sizes for the little network diagrams.
const BACKDROP_NETS = [
  [3, 5, 5, 2],
  [4, 6, 3],
  [2, 4, 4, 4, 1],
  [3, 4, 2],
];

/** Small deterministic PRNG so the layout is stable between visits. */
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildNetworkSvg(layers, width, height, rand) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.classList.add("bd-net");

  const pad = 14;
  const cols = layers.map((count, li) => {
    const x = pad + (li * (width - 2 * pad)) / (layers.length - 1);
    return Array.from({ length: count }, (_, ni) => ({
      x,
      y: pad + ((ni + 0.5) * (height - 2 * pad)) / count,
    }));
  });

  for (let li = 0; li < cols.length - 1; li++) {
    for (const a of cols[li]) {
      for (const b of cols[li + 1]) {
        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        line.classList.add("bd-edge");
        svg.append(line);

        // About a third of the edges carry a travelling "signal".
        if (rand() < 0.35) {
          const pulse = line.cloneNode();
          pulse.setAttribute("class", "bd-pulse");
          pulse.setAttribute("pathLength", "100");
          pulse.style.animationDelay = `${(li * 0.6 + rand() * 2.4).toFixed(2)}s`;
          pulse.style.animationDuration = `${(2.4 + rand() * 1.6).toFixed(2)}s`;
          svg.append(pulse);
        }
      }
    }
  }

  cols.flat().forEach((n) => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", n.x);
    c.setAttribute("cy", n.y);
    c.setAttribute("r", "4.5");
    c.classList.add("bd-node");
    svg.append(c);
  });
  return svg;
}

function initBackdrop() {
  const host = document.getElementById("backdrop");
  if (!host) return;

  let lastKey = "";

  function layout() {
    const width = document.documentElement.clientWidth;
    // Measure from the footer, not scrollHeight: the backdrop itself would inflate scrollHeight.
    const footer = document.querySelector("footer");
    const height = footer ? footer.offsetTop + footer.offsetHeight : document.body.offsetHeight;
    const key = `${width}x${Math.round(height / 200)}|${Boolean(window.katex)}`;
    if (key === lastKey) return; // nothing meaningful changed
    lastKey = key;

    host.replaceChildren();
    host.style.height = `${height}px`;
    const rand = seededRandom(314159);
    const narrow = width < 900;

    // Content column bounds; decorations prefer the margins outside it.
    const pageWidth = Math.min(width, 1140);
    const left = (width - pageWidth) / 2;
    const right = left + pageWidth;

    // Floating equations, one every ~260px of page height.
    const count = Math.round(height / (narrow ? 380 : 260));
    for (let i = 0; i < count; i++) {
      const tex = BACKDROP_EQUATIONS[i % BACKDROP_EQUATIONS.length];
      const el = document.createElement("span");
      el.className = "bd-eq";
      if (window.katex?.render) {
        window.katex.render(tex, el, { throwOnError: false });
      } else {
        el.textContent = tex.replace(/\\[a-zA-Z]+|[{}\\!]/g, " ").replace(/\s+/g, " ");
      }

      const onLeft = i % 2 === 0;
      const y = (i + 0.3 + rand() * 0.4) * (height / count);
      // In the margin when there is room, otherwise hugging the edge behind content.
      const marginRoom = onLeft ? left : width - right;
      const x = marginRoom > 160 ? (onLeft ? 8 + rand() * (left - 150) : right - 40 + rand() * (marginRoom - 120)) : onLeft ? -20 + rand() * width * 0.25 : width * (0.55 + rand() * 0.2);

      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y)}px`;
      el.style.fontSize = `${Math.round(14 + rand() * 12)}px`;
      el.style.setProperty("--rot", `${(rand() * 16 - 8).toFixed(1)}deg`);
      el.style.setProperty("--drift", `${Math.round(12 + rand() * 22)}px`);
      el.style.animationDuration = `${Math.round(14 + rand() * 14)}s`;
      el.style.animationDelay = `${(-rand() * 20).toFixed(1)}s`;
      host.append(el);
    }

    // Neural nets: one large behind the title page, then alternating margins down the page.
    const hero = document.getElementById("home");
    if (hero && !narrow) {
      const net = buildNetworkSvg([4, 7, 7, 5, 2], 520, 300, rand);
      net.classList.add("bd-net-hero");
      net.style.left = `${Math.round(left + pageWidth * 0.28)}px`;
      net.style.top = `${Math.round(hero.offsetTop + 70)}px`;
      host.append(net);
    }

    const netEvery = narrow ? 1600 : 1100;
    const nets = Math.max(1, Math.floor(height / netEvery));
    for (let i = 0; i < nets; i++) {
      const layers = BACKDROP_NETS[i % BACKDROP_NETS.length];
      const w = narrow ? 180 : 230;
      const h = narrow ? 120 : 150;
      const net = buildNetworkSvg(layers, w, h, rand);
      const onLeft = i % 2 === 1;
      const x = onLeft ? Math.max(-60, left - w * 0.75) : Math.min(width - w * 0.3, right - w * 0.25);
      net.style.left = `${Math.round(x)}px`;
      net.style.top = `${Math.round(900 + i * netEvery + rand() * 200)}px`;
      host.append(net);
    }
  }

  layout();
  window.addEventListener("load", layout); // KaTeX + images are ready: re-render with real math
  let timer = null;
  const relayout = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(layout, 200);
  };
  window.addEventListener("resize", relayout);
  new ResizeObserver(relayout).observe(document.body);
}

// ---------- Boot ----------

initTheme();
initMobileNav();
initScrollSpy();
initScrollProgress();
initScrollReveal();
initEquationNote();
initTypewriter();
initFeaturedCarousel("featured-msft-carousel", "featured-msft-dots", "Microsoft");
initFeaturedCarousel("featured-pytorch-carousel", "featured-pytorch-dots", "PyTorch Conference");
initBackdrop();

loadContent().then(() => {
  initHeroCarousel();
  initGallery();
});
