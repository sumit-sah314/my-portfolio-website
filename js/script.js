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