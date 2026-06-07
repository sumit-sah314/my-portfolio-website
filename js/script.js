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

/**
 * Home profile carousel — use only assets/images/profile photos here.
 */
const PORTFOLIO_PHOTOS = [
  {
    src: "assets/images/profile/profile.png",
    alt: "Sumit Sah portrait.",
    caption: "Profile portrait.",
  },
  {
    src: "assets/images/profile/microsoft_night.jpg",
    alt: "Sumit Sah at Microsoft campus at night.",
    caption: "Microsoft night profile photo.",
  },
];

// Gallery photos are managed separately from profile carousel photos.
const GALLERY_PHOTOS = [
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
];

const HERO_AUTOPLAY_MS = 5200;
const HERO_FADE_MS = 380;

function initHeroCarousel() {
  const carousel = document.getElementById("hero-carousel");
  const img = document.getElementById("hero-slide-img");
  const dotsHost = document.getElementById("hero-carousel-dots");
  if (!carousel || !img || !dotsHost || PORTFOLIO_PHOTOS.length === 0) return;

  let index = 0;
  let timerId = null;
  let heroInView = true;

  function norm(i) {
    return (i + PORTFOLIO_PHOTOS.length) % PORTFOLIO_PHOTOS.length;
  }

  function updateDots() {
    dotsHost.querySelectorAll(".hero-dot").forEach((btn, i) => {
      const on = i === index;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function applySlide(i) {
    index = norm(i);
    const shot = PORTFOLIO_PHOTOS[index];
    img.src = shot.src;
    img.alt = shot.alt || "Photo";
    updateDots();
  }

  function crossfadeTo(nextIndex) {
    const next = norm(nextIndex);
    const shot = PORTFOLIO_PHOTOS[next];
    const useFade = !prefersReducedMotion() && PORTFOLIO_PHOTOS.length > 1 && HERO_FADE_MS > 0;

    const finish = () => {
      index = next;
      img.src = shot.src;
      img.alt = shot.alt || "Photo";
      updateDots();
      if (useFade) {
        requestAnimationFrame(() => img.classList.remove("is-fading"));
      }
    };

    if (!useFade) {
      finish();
      return;
    }

    img.classList.add("is-fading");
    window.setTimeout(finish, HERO_FADE_MS);
  }

  if (PORTFOLIO_PHOTOS.length < 2) {
    dotsHost.innerHTML = "";
    dotsHost.setAttribute("hidden", "");
    applySlide(0);
    return;
  }

  dotsHost.removeAttribute("hidden");
  dotsHost.innerHTML = "";
  dotsHost.setAttribute("role", "tablist");
  PORTFOLIO_PHOTOS.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hero-dot";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", `Show photo ${i + 1} of ${PORTFOLIO_PHOTOS.length}`);
    btn.addEventListener("click", () => {
      crossfadeTo(i);
      restartAutoplay();
    });
    dotsHost.appendChild(btn);
  });

  applySlide(0);

  function stopAutoplay() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (prefersReducedMotion() || PORTFOLIO_PHOTOS.length < 2) return;
    if (document.hidden || !heroInView) return;
    timerId = window.setInterval(() => crossfadeTo(index + 1), HERO_AUTOPLAY_MS);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  const io = new IntersectionObserver(
    (entries) => {
      heroInView = Boolean(entries[0]?.isIntersecting);
      if (heroInView && !document.hidden) startAutoplay();
      else stopAutoplay();
    },
    { threshold: 0.25 }
  );
  io.observe(carousel);

  startAutoplay();
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

const MATH_CS_ML_INSIGHTS = [
  {
    formula: "P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}",
    fallback: "P(A|B) = P(B|A)P(A) / P(B)",
    meaning: "Bayes theorem updates beliefs after seeing new evidence.",
  },
  {
    formula: "L(\\theta)=\\frac{1}{n}\\sum_{i=1}^{n}(y_i-\\hat{y}_i)^2",
    fallback: "L(theta) = (1/n) sum (y_i - y_hat_i)^2",
    meaning: "Least squares converts prediction error into an optimization objective.",
  },
  {
    formula: "\\mathbf{w}\\leftarrow\\mathbf{w}-\\alpha\\nabla L(\\mathbf{w})",
    fallback: "w <- w - alpha * grad(L(w))",
    meaning: "Gradient descent is calculus implemented as an iterative algorithm.",
  },
  {
    formula: "e^{i\\pi}+1=0",
    fallback: "e^(i*pi) + 1 = 0",
    meaning: "Euler's formula elegantly links exponential growth, trigonometry, and complex numbers.",
  },
  {
    formula: "\\hat{y}=\\arg\\max_{c}\\,P(y=c\\mid x)",
    fallback: "y_hat = argmax_c P(y=c | x)",
    meaning: "In code, classifiers choose the label with maximum posterior probability.",
  },
  {
    formula: "\\sigma(z)=\\frac{1}{1+e^{-z}}",
    fallback: "sigma(z) = 1 / (1 + e^(-z))",
    meaning: "The sigmoid maps real-valued scores into probabilities.",
  },
  {
    formula: "\\mathrm{softmax}(z_i)=\\frac{e^{z_i}}{\\sum_j e^{z_j}}",
    fallback: "softmax(z_i) = e^(z_i) / sum_j e^(z_j)",
    meaning: "Softmax turns logits into a normalized class distribution.",
  },
  {
    formula: "\\theta=(X^TX)^{-1}X^Ty",
    fallback: "theta = (X^T X)^(-1) X^T y",
    meaning: "The normal equation gives a closed-form least squares solution.",
  },
  {
    formula: "\\frac{d}{dx}f(g(x))=f'(g(x))g'(x)",
    fallback: "d/dx f(g(x)) = f'(g(x)) g'(x)",
    meaning: "The chain rule powers backpropagation through neural networks.",
  },
  {
    formula: "H(p)=-\\sum_i p_i\\log p_i",
    fallback: "H(p) = -sum_i p_i log p_i",
    meaning: "Entropy measures uncertainty and appears in cross-entropy losses.",
  },
  {
    formula: "J(\\theta)=L(\\theta)+\\lambda\\lVert\\theta\\rVert_2^2",
    fallback: "J(theta) = L(theta) + lambda ||theta||_2^2",
    meaning: "L2 regularization controls model complexity and overfitting.",
  },
];

function initMathCsMlWidget() {
  const host = document.getElementById("math-cs-ml-widget");
  const formulaEl = document.getElementById("insight-formula");
  const meaningEl = document.getElementById("insight-meaning");
  if (!host || !formulaEl || !meaningEl || MATH_CS_ML_INSIGHTS.length === 0) return;

  let index = 0;

  function paint(i) {
    const item = MATH_CS_ML_INSIGHTS[i % MATH_CS_ML_INSIGHTS.length];
    if (window.katex && typeof window.katex.render === "function") {
      window.katex.render(item.formula, formulaEl, { throwOnError: false, displayMode: false });
    } else {
      formulaEl.textContent = item.fallback || item.formula;
    }
    meaningEl.textContent = item.meaning;
  }

  paint(0);
  if (prefersReducedMotion() || MATH_CS_ML_INSIGHTS.length < 2) return;

  window.setInterval(() => {
    host.classList.add("is-switching");
    window.setTimeout(() => {
      index = (index + 1) % MATH_CS_ML_INSIGHTS.length;
      paint(index);
      host.classList.remove("is-switching");
    }, 160);
  }, 3600);
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

// Gallery slider (custom list — see GALLERY_PHOTOS)
const galleryImageEl = document.getElementById("gallery-image");
const galleryPrevBtn = document.getElementById("gallery-prev");
const galleryNextBtn = document.getElementById("gallery-next");
const galleryIndexEl = document.getElementById("gallery-index");
const galleryTotalEl = document.getElementById("gallery-total");
const galleryCaptionEl = document.getElementById("gallery-caption");
const galleryLocationEl = document.getElementById("gallery-location");

if (
  galleryImageEl &&
  galleryPrevBtn &&
  galleryNextBtn &&
  galleryIndexEl &&
  galleryTotalEl &&
  galleryCaptionEl &&
  galleryLocationEl
) {
  let galleryCurrent = 0;
  galleryTotalEl.textContent = String(GALLERY_PHOTOS.length);
  galleryCaptionEl.textContent = GALLERY_PHOTOS[galleryCurrent].caption;
  galleryLocationEl.textContent = GALLERY_PHOTOS[galleryCurrent].location || "";
  galleryImageEl.src = GALLERY_PHOTOS[galleryCurrent].src;
  galleryImageEl.alt = GALLERY_PHOTOS[galleryCurrent].alt || "Gallery photo";
  galleryImageEl.style.objectPosition = GALLERY_PHOTOS[galleryCurrent].objectPosition || "center";

  const flickerMs = prefersReducedMotion() ? 0 : 140;

  function updateGalleryImage(newIndex) {
    galleryImageEl.classList.add("is-changing");
    setTimeout(() => {
      galleryCurrent = (newIndex + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
      const item = GALLERY_PHOTOS[galleryCurrent];
      galleryImageEl.src = item.src;
      galleryImageEl.alt = item.alt || `Gallery image ${galleryCurrent + 1}`;
      galleryIndexEl.textContent = String(galleryCurrent + 1);
      galleryCaptionEl.textContent = item.caption;
      galleryLocationEl.textContent = item.location || "";
      galleryImageEl.style.objectPosition = item.objectPosition || "center";
      galleryImageEl.classList.remove("is-changing");
    }, flickerMs);
  }

  galleryPrevBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent - 1));
  galleryNextBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent + 1));
}

function initSectionCarousel({
  containerId,
  slideSelector,
  prevBtnId,
  nextBtnId,
  indexId,
  totalId,
  autoMs = 5200,
}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const slides = Array.from(container.querySelectorAll(slideSelector));
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);
  const indexEl = document.getElementById(indexId);
  const totalEl = document.getElementById(totalId);

  if (!slides.length || !prevBtn || !nextBtn || !indexEl || !totalEl) return;

  let current = 0;
  let timerId = null;

  function norm(i) {
    return (i + slides.length) % slides.length;
  }

  function render(i) {
    current = norm(i);
    slides.forEach((slide, idx) => {
      const active = idx === current;
      slide.classList.toggle("is-active", active);
      slide.toggleAttribute("hidden", !active);
    });
    indexEl.textContent = String(current + 1);
  }

  function stopAuto() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startAuto() {
    stopAuto();
    if (prefersReducedMotion() || slides.length < 2) return;
    if (document.hidden) return;
    timerId = window.setInterval(() => render(current + 1), autoMs);
  }

  function restartAuto() {
    stopAuto();
    startAuto();
  }

  totalEl.textContent = String(slides.length);
  render(0);

  if (slides.length < 2) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  prevBtn.addEventListener("click", () => {
    render(current - 1);
    restartAuto();
  });

  nextBtn.addEventListener("click", () => {
    render(current + 1);
    restartAuto();
  });

  container.addEventListener("mouseenter", stopAuto);
  container.addEventListener("mouseleave", startAuto);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  startAuto();
}

function initFeaturedMicrosoftCarousel() {
  const carousel = document.getElementById("featured-msft-carousel");
  const dotsHost = document.getElementById("featured-msft-dots");
  if (!carousel || !dotsHost) return;

  const slides = Array.from(carousel.querySelectorAll(".featured-media-slide"));
  if (slides.length < 2) {
    dotsHost.setAttribute("hidden", "");
    return;
  }

  let index = 0;
  let timerId = null;

  function norm(i) {
    return (i + slides.length) % slides.length;
  }

  function render(i) {
    index = norm(i);
    slides.forEach((slide, idx) => {
      const active = idx === index;
      slide.classList.toggle("is-active", active);
      slide.toggleAttribute("hidden", !active);
    });

    dotsHost.querySelectorAll(".featured-media-dot").forEach((dot, idx) => {
      const active = idx === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function stopAuto() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startAuto() {
    stopAuto();
    if (prefersReducedMotion() || document.hidden) return;
    timerId = window.setInterval(() => render(index + 1), 5000);
  }

  function restartAuto() {
    stopAuto();
    startAuto();
  }

  dotsHost.innerHTML = "";
  dotsHost.setAttribute("role", "tablist");
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "featured-media-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show Microsoft photo ${i + 1} of ${slides.length}`);
    dot.addEventListener("click", () => {
      render(i);
      restartAuto();
    });
    dotsHost.appendChild(dot);
  });

  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  render(0);
  startAuto();
}

initTheme();
initMobileNav();
initScrollReveal();
initHeroCarousel();
initMathCsMlWidget();
initFeaturedMicrosoftCarousel();

initSectionCarousel({
  containerId: "projects-carousel",
  slideSelector: ".project-slide",
  prevBtnId: "projects-prev",
  nextBtnId: "projects-next",
  indexId: "projects-index",
  totalId: "projects-total",
  autoMs: 5600,
});

initSectionCarousel({
  containerId: "awards-carousel",
  slideSelector: ".award-slide",
  prevBtnId: "awards-prev",
  nextBtnId: "awards-next",
  indexId: "awards-index",
  totalId: "awards-total",
  autoMs: 6000,
});

if (sections[0]?.id) {
  syncSectionHighlight(sections[0].id);
}
