console.log("Sumit Sah portfolio loaded successfully.");

// Active nav link on scroll
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

// Typewriter effect for name only
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

typeWriter(document.getElementById("typewriter-name"), "Sumit Sah.", 80, () => {
  typeWriter(
    document.getElementById("typewriter-line"),
    "I go by Sum. Yeah, like the summation in math - a math lover, lol.",
    35
  );
});

// Gallery slider
const galleryImageEl = document.getElementById("gallery-image");
const galleryPrevBtn = document.getElementById("gallery-prev");
const galleryNextBtn = document.getElementById("gallery-next");
const galleryIndexEl = document.getElementById("gallery-index");
const galleryTotalEl = document.getElementById("gallery-total");
const galleryCaptionEl = document.getElementById("gallery-caption");

if (galleryImageEl && galleryPrevBtn && galleryNextBtn && galleryIndexEl && galleryTotalEl && galleryCaptionEl) {
  const galleryItems = [
    {
      src: "assets/images/profile.jpg",
      caption: "Profile portrait - replace with your own caption."
    },
    {
      src: "assets/images/profile.jpg",
      caption: "Conference, campus, or project moment."
    },
    {
      src: "assets/images/profile.jpg",
      caption: "Data science or machine learning work snapshot."
    },
    {
      src: "assets/images/profile.jpg",
      caption: "Math + code creative work sample."
    },
    {
      src: "assets/images/profile.jpg",
      caption: "Research or presentation highlight."
    },
    {
      src: "assets/images/profile.jpg",
      caption: "Another favorite moment from your journey."
    }
  ];

  let galleryCurrent = 0;
  galleryTotalEl.textContent = String(galleryItems.length);
  galleryCaptionEl.textContent = galleryItems[galleryCurrent].caption;

  function updateGalleryImage(newIndex) {
    galleryImageEl.classList.add("is-changing");
    setTimeout(() => {
      galleryCurrent = (newIndex + galleryItems.length) % galleryItems.length;
      galleryImageEl.src = galleryItems[galleryCurrent].src;
      galleryImageEl.alt = `Gallery image ${galleryCurrent + 1}`;
      galleryIndexEl.textContent = String(galleryCurrent + 1);
      galleryCaptionEl.textContent = galleryItems[galleryCurrent].caption;
      galleryImageEl.classList.remove("is-changing");
    }, 140);
  }

  galleryPrevBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent - 1));
  galleryNextBtn.addEventListener("click", () => updateGalleryImage(galleryCurrent + 1));
}