// Portfolio page behaviour: theme, navigation, hero, featured slideshows, gallery lightbox.

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ---------- Theme: "paper" (light) and "chalk" (dark) ----------

const THEME_KEY = "portfolio-theme";
const THEME_META = {
  paper: { label: "paper", next: "chalk", themeColor: "#f5f1e8" },
  chalk: { label: "chalk", next: "paper", themeColor: "#141a19" },
};

function currentTheme() {
  return document.documentElement.dataset.theme === "chalk" ? "chalk" : "paper";
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

const PORTFOLIO_PHOTOS = [
  { src: "assets/images/profile/profile.png", alt: "Sumit Sah portrait." },
  { src: "assets/images/profile/microsoft_night.jpg", alt: "Sumit Sah at Microsoft campus at night." },
];

function initHeroCarousel() {
  const carousel = document.getElementById("hero-carousel");
  const img = document.getElementById("hero-slide-img");
  const dotsHost = document.getElementById("hero-carousel-dots");
  if (!carousel || !img || !dotsHost) return;
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
    slides.forEach((slide, idx) => {
      slide.classList.toggle("is-active", idx === index);
      slide.hidden = idx !== index;
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

// ---------- Gallery grid + lightbox ----------

const GALLERY_PHOTOS = [
  {
    src: "assets/images/gallery/pytorch_conference.jpg",
    alt: "Sumit Sah beside the PyTorch Conference North America 2026 sponsor wall.",
    caption: "PyTorch Conference North America 2026 - attended on a scholarship, met the people building PyTorch, and explored Silicon Valley.",
    location: "PyTorch Conference, Silicon Valley",
    objectPosition: "20% 82%",
  },
  {
    src: "assets/images/gallery/google.jpeg",
    alt: "Riding a colorful Google bike past a row of Google bikes at Google headquarters.",
    caption: "Cycling around Google headquarters in Mountain View on the iconic colorful Google bikes.",
    location: "Google Headquarters, Mountain View, Silicon Valley",
    objectPosition: "center 40%",
  },
  {
    src: "assets/images/gallery/jrmf.jpeg",
    alt: "JRFM photo highlight.",
    caption: "JRMF volunteering - playing with kids at a fun event at San Marcos Public Library.",
    location: "San Marcos Public Library",
  },
  {
    src: "assets/images/gallery/njtemple.jpg",
    alt: "NJ Temple visit photo.",
    caption: "An unusual hobby of mine is visiting temples - a peaceful way to worship, strengthen faith, and keep my mind calm.",
    location: "New Jersey Temple",
    objectPosition: "center 65%",
  },
  {
    src: "assets/images/gallery/brooklyn.jpg",
    alt: "Brooklyn Bridge visit photo.",
    caption: "Brooklyn - one of the best moments of my life: visiting the Brooklyn Bridge, enjoying spectacular views, and watching a sunset I could not take my eyes off.",
    location: "Brooklyn Bridge, New York",
  },
  {
    src: "assets/images/gallery/bigbend.jpg",
    alt: "Big Bend trip photo.",
    caption: "Big Bend adventure - one of my favorite hobbies, exploring trails, hills, and mountains.",
    location: "Big Bend National Park",
  },
  {
    src: "assets/images/gallery/bayloruniv.jpeg",
    alt: "Baylor University campus photo.",
    caption: "Baylor University visit - a memorable MAA conference experience with TXST professors and teammates.",
    location: "Baylor University",
  },
  {
    src: "assets/images/gallery/pi_day.jpg",
    alt: "Pi Day event photo.",
    caption: "Pi Day celebration - selling pies, pieing professors, and one of the most memorable and fun Texas State Math Department events as president.",
    location: "Texas State University",
  },
  {
    src: "assets/images/gallery/dataspace.jpeg",
    alt: "DataSpace event photo.",
    caption: "DataSpace and University Libraries event - a successful team effort with participants, and a fun experience organizing such a big campuswide event.",
    location: "Texas State University Libraries",
  },
  {
    src: "assets/images/gallery/mathclubdinner.jpeg",
    alt: "Math Club dinner photo.",
    caption: "Math Club dinner - sharing Nepali cuisine with our American advisors and officers, and enjoying a fun dinner together.",
    location: "Texas State Math Department",
  },
  {
    src: "assets/images/gallery/uni.jpg",
    alt: "University of Washington campus photo.",
    caption: "University of Washington - such a beautiful campus to visit in my life.",
    location: "University of Washington",
  },
  {
    src: "assets/images/gallery/golf.jpg",
    alt: "Golf outing photo.",
    caption: "Golf - I am not usually a big fan of outdoor games, but I gave golf a shot and it was worth playing.",
    location: "Golf Course",
  },
];

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

// ---------- Boot ----------

initTheme();
initMobileNav();
initScrollSpy();
initScrollProgress();
initScrollReveal();
initHeroCarousel();
initEquationNote();
initTypewriter();
initFeaturedCarousel("featured-msft-carousel", "featured-msft-dots", "Microsoft");
initFeaturedCarousel("featured-pytorch-carousel", "featured-pytorch-dots", "PyTorch Conference");
initGallery();
