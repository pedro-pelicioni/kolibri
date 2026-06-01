// Kolibri landing — progressive enhancement only.
// Page is fully readable with JS disabled; this adds nav state, reveals, gauges.

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- nav: solid background after scrolling past the hero edge ----
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- scroll reveals ----
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  }

  // ---- DPP gauges: animate the arc to data-pct when the card appears ----
  const meters = document.querySelectorAll(".gauge .meter");
  const R = 32;
  const C = 2 * Math.PI * R;

  meters.forEach((m) => {
    m.style.strokeDasharray = String(C);
    m.style.strokeDashoffset = String(C); // start empty
  });

  const fill = (m) => {
    const pct = Math.max(0, Math.min(100, Number(m.dataset.pct) || 0));
    m.style.strokeDashoffset = String(C * (1 - pct / 100));
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    meters.forEach(fill);
  } else {
    const gio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // small stagger so the three arcs sweep in sequence
            const m = e.target;
            const idx = [...meters].indexOf(m);
            setTimeout(() => fill(m), 120 * idx);
            gio.unobserve(m);
          }
        });
      },
      { threshold: 0.5 }
    );
    meters.forEach((m) => gio.observe(m));
  }

  // ---- smooth-scroll for in-page anchors (respects reduced motion) ----
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (ev) => {
      const id = a.getAttribute("href");
      if (id === "#" || id === "#top") return;
      const target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });
})();
