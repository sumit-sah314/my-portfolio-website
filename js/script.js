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
const DEFAULT_GALLERY_PHOTOS = [
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

const GALLERY_STORAGE_KEY = "portfolio-gallery-photos";
const GALLERY_PIN_HASH_KEY = "portfolio-gallery-pin-hash";
const GALLERY_ADMIN_SESSION_KEY = "portfolio-gallery-admin";
const DEFAULT_GALLERY_PIN = "4170";
const GALLERY_MAX_SOURCE_BYTES = 20_000_000;
const GALLERY_IMAGE_MAX_DIMENSION = 1800;
const GALLERY_TARGET_DATA_URL_LENGTH = 1_250_000;

/** @param {any} item */
function normalizeGalleryPhoto(item) {
  return {
    src: String(item?.src || ""),
    alt: String(item?.alt || "Gallery photo"),
    caption: String(item?.caption || "Untitled photo"),
    description: String(item?.description || ""),
    location: String(item?.location || ""),
    objectPosition: String(item?.objectPosition || "center"),
  };
}

function defaultGalleryPhotos() {
  return DEFAULT_GALLERY_PHOTOS.map((item) => normalizeGalleryPhoto(item));
}

function loadGalleryPhotos() {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return defaultGalleryPhotos();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultGalleryPhotos();
    return parsed.map((item) => normalizeGalleryPhoto(item)).filter((item) => item.src);
  } catch (error) {
    return defaultGalleryPhotos();
  }
}

/** @param {ReturnType<typeof defaultGalleryPhotos>} photos */
function saveGalleryPhotos(photos) {
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(photos));
}

/** @param {string} value */
function hashPin(value) {
  let hash = 5381;
  for (const char of value) {
    hash = (hash * 33) ^ char.charCodeAt(0);
  }
  return String(hash >>> 0);
}

function getActiveGalleryPinHash() {
  return localStorage.getItem(GALLERY_PIN_HASH_KEY) || hashPin(DEFAULT_GALLERY_PIN);
}

/** @param {File} file */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

/** @param {string} src */
function loadImageFromSource(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode image."));
    image.src = src;
  });
}

/** @param {File} file */
async function prepareGalleryUpload(file) {
  if (file.size > GALLERY_MAX_SOURCE_BYTES) {
    throw new Error("Please use an image smaller than about 20 MB.");
  }

  const source = await readFileAsDataUrl(file);
  const image = /** @type {HTMLImageElement} */ (await loadImageFromSource(source));
  const scale = Math.min(1, GALLERY_IMAGE_MAX_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image canvas.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.88;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > GALLERY_TARGET_DATA_URL_LENGTH && quality > 0.46) {
    quality -= 0.08;
    result = canvas.toDataURL("image/jpeg", quality);
  }

  if (result.length > GALLERY_TARGET_DATA_URL_LENGTH) {
    throw new Error("Image is still too large after compression. Try cropping it first.");
  }

  return result;
}

let galleryPhotos = loadGalleryPhotos();

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

// Gallery slider + manager
const galleryImageEl = document.getElementById("gallery-image");
const galleryPrevBtn = document.getElementById("gallery-prev");
const galleryNextBtn = document.getElementById("gallery-next");
const galleryIndexEl = document.getElementById("gallery-index");
const galleryTotalEl = document.getElementById("gallery-total");
const galleryCaptionEl = document.getElementById("gallery-caption");
const galleryDescriptionEl = document.getElementById("gallery-description");
const galleryLocationEl = document.getElementById("gallery-location");
const galleryAdminAuth = document.getElementById("gallery-admin-auth");
const galleryPinInput = document.getElementById("gallery-pin");
const galleryPinLabel = document.getElementById("gallery-pin-label");
const galleryAuthBtn = document.getElementById("gallery-auth-btn");
const galleryEditor = document.getElementById("gallery-editor");
const galleryStatusEl = document.getElementById("gallery-admin-status");
const galleryLockBtn = document.getElementById("gallery-lock-btn");
const galleryUploadInput = document.getElementById("gallery-upload");
const galleryCaptionInput = document.getElementById("gallery-caption-input");
const galleryDescriptionInput = document.getElementById("gallery-description-input");
const galleryLocationInput = document.getElementById("gallery-location-input");
const galleryAltInput = document.getElementById("gallery-alt-input");
const galleryPositionInput = document.getElementById("gallery-position-input");
const galleryAddBtn = document.getElementById("gallery-add-btn");
const galleryDeleteBtn = document.getElementById("gallery-delete-btn");
const galleryResetBtn = document.getElementById("gallery-reset-btn");

if (
  galleryImageEl &&
  galleryPrevBtn &&
  galleryNextBtn &&
  galleryIndexEl &&
  galleryTotalEl &&
  galleryCaptionEl &&
  galleryDescriptionEl &&
  galleryLocationEl
) {
  let galleryCurrent = 0;
  const hasPin = () => true;
  const isUnlocked = () => sessionStorage.getItem(GALLERY_ADMIN_SESSION_KEY) === "true";

  const flickerMs = prefersReducedMotion() ? 0 : 140;

  function setGalleryStatus(message) {
    if (galleryStatusEl) galleryStatusEl.textContent = message;
  }

  function syncEditorFields() {
    if (!galleryEditor || galleryEditor.hidden || !galleryCaptionInput || !galleryDescriptionInput || !galleryLocationInput || !galleryAltInput || !galleryPositionInput) {
      return;
    }
    const item = galleryPhotos[galleryCurrent];
    if (!item) return;
    galleryCaptionInput.value = item.caption || "";
    galleryDescriptionInput.value = item.description || "";
    galleryLocationInput.value = item.location || "";
    galleryAltInput.value = item.alt || "";
    galleryPositionInput.value = item.objectPosition || "center";
    if (galleryUploadInput) galleryUploadInput.value = "";
  }

  function updateManagerUi() {
    if (!galleryEditor || !galleryAuthBtn || !galleryPinInput || !galleryPinLabel || !galleryLockBtn || !galleryAdminAuth) return;
    const unlocked = isUnlocked();
    galleryPinLabel.textContent = "Enter your PIN";
    galleryPinInput.placeholder = "Unlock manager";
    galleryAuthBtn.textContent = "Unlock";
    galleryAdminAuth.hidden = unlocked;
    galleryEditor.hidden = !unlocked;
    galleryLockBtn.hidden = !unlocked;
    if (unlocked) syncEditorFields();
  }

  function renderGallery(newIndex) {
    if (!galleryPhotos.length) return;
    galleryCurrent = (newIndex + galleryPhotos.length) % galleryPhotos.length;
    const item = galleryPhotos[galleryCurrent];
    galleryImageEl.src = item.src;
    galleryImageEl.alt = item.alt || `Gallery image ${galleryCurrent + 1}`;
    galleryImageEl.style.objectPosition = item.objectPosition || "center";
    galleryCaptionEl.textContent = item.caption;
    galleryDescriptionEl.textContent = item.description || "";
    galleryDescriptionEl.hidden = !item.description;
    galleryLocationEl.textContent = item.location || "";
    galleryLocationEl.hidden = !item.location;
    galleryIndexEl.textContent = String(galleryCurrent + 1);
    galleryTotalEl.textContent = String(galleryPhotos.length);
    syncEditorFields();
  }

  function updateGalleryImage(newIndex) {
    galleryImageEl.classList.add("is-changing");
    setTimeout(() => {
      renderGallery(newIndex);
      galleryImageEl.classList.remove("is-changing");
    }, flickerMs);
  }

  renderGallery(0);
  updateManagerUi();

  galleryPrevBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent - 1));
  galleryNextBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent + 1));

  if (galleryAuthBtn && galleryPinInput) {
    galleryAuthBtn.addEventListener("click", () => {
      const pin = galleryPinInput.value.trim();
      if (pin.length < 4) {
        setGalleryStatus("Use a PIN with at least 4 characters.");
        return;
      }

      if (getActiveGalleryPinHash() === hashPin(pin)) {
        sessionStorage.setItem(GALLERY_ADMIN_SESSION_KEY, "true");
        galleryPinInput.value = "";
        updateManagerUi();
        setGalleryStatus("Gallery manager unlocked.");
      } else {
        setGalleryStatus("Incorrect PIN.");
      }
    });
  }

  if (galleryLockBtn) {
    galleryLockBtn.addEventListener("click", () => {
      sessionStorage.removeItem(GALLERY_ADMIN_SESSION_KEY);
      updateManagerUi();
      setGalleryStatus("Gallery manager locked.");
    });
  }

  if (
    galleryEditor &&
    galleryCaptionInput &&
    galleryDescriptionInput &&
    galleryLocationInput &&
    galleryAltInput &&
    galleryPositionInput
  ) {
    galleryEditor.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isUnlocked()) {
        setGalleryStatus("Unlock the gallery manager first.");
        return;
      }

      const item = { ...galleryPhotos[galleryCurrent] };
      item.caption = galleryCaptionInput.value.trim() || "Untitled photo";
      item.description = galleryDescriptionInput.value.trim();
      item.location = galleryLocationInput.value.trim();
      item.alt = galleryAltInput.value.trim() || item.caption;
      item.objectPosition = galleryPositionInput.value.trim() || "center";

      if (galleryUploadInput?.files?.[0]) {
        const file = galleryUploadInput.files[0];
        try {
          item.src = await prepareGalleryUpload(file);
        } catch (error) {
          setGalleryStatus(error instanceof Error ? error.message : "Could not process the selected image.");
          return;
        }
      }

      galleryPhotos[galleryCurrent] = normalizeGalleryPhoto(item);
      saveGalleryPhotos(galleryPhotos);
      renderGallery(galleryCurrent);
      setGalleryStatus("Current photo updated.");
    });
  }

  if (
    galleryAddBtn &&
    galleryUploadInput &&
    galleryCaptionInput &&
    galleryDescriptionInput &&
    galleryLocationInput &&
    galleryAltInput &&
    galleryPositionInput
  ) {
    galleryAddBtn.addEventListener("click", async () => {
      if (!isUnlocked()) {
        setGalleryStatus("Unlock the gallery manager first.");
        return;
      }

      const file = galleryUploadInput.files?.[0];
      if (!file) {
        setGalleryStatus("Choose an image before adding a new photo.");
        return;
      }

      try {
        const src = await prepareGalleryUpload(file);
        galleryPhotos.push(normalizeGalleryPhoto({
          src,
          caption: galleryCaptionInput.value.trim() || "New photo",
          description: galleryDescriptionInput.value.trim(),
          location: galleryLocationInput.value.trim(),
          alt: galleryAltInput.value.trim() || galleryCaptionInput.value.trim() || "Gallery photo",
          objectPosition: galleryPositionInput.value.trim() || "center",
        }));
        saveGalleryPhotos(galleryPhotos);
        renderGallery(galleryPhotos.length - 1);
        setGalleryStatus("New photo added to the gallery.");
      } catch (error) {
        setGalleryStatus(error instanceof Error ? error.message : "Could not add the selected image.");
      }
    });
  }

  if (galleryDeleteBtn) {
    galleryDeleteBtn.addEventListener("click", () => {
      if (!isUnlocked()) {
        setGalleryStatus("Unlock the gallery manager first.");
        return;
      }
      if (galleryPhotos.length <= 1) {
        setGalleryStatus("Keep at least one photo in the gallery.");
        return;
      }
      galleryPhotos.splice(galleryCurrent, 1);
      saveGalleryPhotos(galleryPhotos);
      renderGallery(Math.max(0, galleryCurrent - 1));
      setGalleryStatus("Current photo deleted.");
    });
  }

  if (galleryResetBtn) {
    galleryResetBtn.addEventListener("click", () => {
      if (!isUnlocked()) {
        setGalleryStatus("Unlock the gallery manager first.");
        return;
      }
      galleryPhotos = defaultGalleryPhotos();
      saveGalleryPhotos(galleryPhotos);
      renderGallery(0);
      setGalleryStatus("Gallery reset to the default photos.");
    });
  }
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

/**
 * Animated neural-network background for the hero section.
 * Drifting nodes link with edges when close — a math x code x ML signature.
 * Respects reduced motion and pauses when offscreen or the tab is hidden.
 */
function initNeuralCanvas() {
  const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById("neural-canvas"));
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = prefersReducedMotion();

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  /** @type {{ x: number; y: number; vx: number; vy: number }[]} */
  let nodes = [];
  let rafId = null;
  let inView = true;

  /** @returns {{ r: number; g: number; b: number }} */
  function accentRgb() {
    let hex = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const int = parseInt(hex, 16);
    if (hex.length !== 6 || Number.isNaN(int)) return { r: 184, g: 164, b: 111 };
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.round((width * height) / 16000);
    const count = Math.max(16, Math.min(64, target));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const rgb = accentRgb();
    const linkDist = Math.min(160, Math.max(108, width / 9));

    if (!reduceMotion) {
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDist) {
          const alpha = (1 - dist / linkDist) * 0.5;
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    for (const node of nodes) {
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (!reduceMotion) {
      rafId = window.requestAnimationFrame(draw);
    }
  }

  function start() {
    if (reduceMotion) {
      draw();
      return;
    }
    if (rafId !== null || document.hidden || !inView) return;
    rafId = window.requestAnimationFrame(draw);
  }

  function stop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  resize();
  start();

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (reduceMotion) draw();
    }, 180);
  });

  if (reduceMotion) return;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const io = new IntersectionObserver(
    (entries) => {
      inView = Boolean(entries[0]?.isIntersecting);
      if (inView) start();
      else stop();
    },
    { threshold: 0 }
  );
  io.observe(canvas);
}

initTheme();
initMobileNav();
initScrollReveal();
initHeroCarousel();
initMathCsMlWidget();
initNeuralCanvas();
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
