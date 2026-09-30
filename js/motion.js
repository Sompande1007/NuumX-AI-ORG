/* ==========================================================
   Section animations (everything below the hero).
   Uses Motion (https://motion.dev) from the CDN build, exposed as
   window.Motion. Entrance targets start hidden via css/motion.css
   under html.has-motion; builder micro-animations live in site.js.
   ========================================================== */
(() => {
  const M = window.Motion;
  const html = document.documentElement;
  if (!M || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    html.classList.remove("has-motion");
    return;
  }

  const { animate, scroll, inView, stagger } = M;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EASE = [0.2, 0.7, 0.2, 1];
  const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.5 };
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktop = matchMedia("(min-width: 901px)");

  /* ---------------- Site-wide ---------------- */

  // Reading-progress bar
  scroll(animate(".scroll-progress", { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" }));

  // Nav hides while scrolling down past the hero, returns on scroll up
  const nav = $(".nav");
  const hero = $("#hero");
  let heroH = hero.offsetHeight;
  let lastY = window.scrollY;
  window.addEventListener("resize", () => (heroH = hero.offsetHeight));
  scroll((_, info) => {
    const y = info.y.current;
    if (Math.abs(y - lastY) < 6) return;
    const hide = y > lastY && y > heroH * 0.6 &&
      !nav.classList.contains("is-open") && !nav.contains(document.activeElement);
    nav.classList.toggle("is-hidden", hide);
    lastY = y;
  });

  // Back-to-top button: appears after the hero; its ring shows reading progress
  const toTop = $(".to-top");
  const ring = $(".to-top .ring");
  scroll((p, info) => {
    ring.style.strokeDashoffset = String(1 - p);
    const show = info.y.current > heroH * 0.8;
    if (show !== toTop.classList.contains("is-visible")) {
      toTop.classList.toggle("is-visible", show);
      toTop.tabIndex = show ? 0 : -1;
    }
  });
  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0 });
    toTop.blur();
  });
  // Keep it out of the way of the builder's sticky total bar
  inView(".builder__main", () => {
    document.body.classList.add("builder-in-view");
    return () => document.body.classList.remove("builder-in-view");
  }, { amount: 0.05 });

  // Mobile menu opens with a drop and staggered links
  $(".nav__toggle").addEventListener("click", () => {
    if (!nav.classList.contains("is-open")) return;
    animate(linkList, { opacity: [0, 1], transform: ["translateY(-8px) scale(0.98)", "translateY(0px) scale(1)"] },
      { duration: 0.3, ease: EASE });
    animate($$("li:not(.nav__indicator)", linkList),
      { opacity: [0, 1], transform: ["translateY(-6px)", "translateY(0px)"] },
      { duration: 0.3, ease: EASE, delay: stagger(0.04, { startDelay: 0.05 }) });
  });

  // Active-link indicator slides between links
  const linkList = $(".nav__links");
  const indicator = $(".nav__indicator");
  linkList.classList.add("has-indicator");
  function moveIndicator(link, instant) {
    if (!link || !desktop.matches) return;
    const a = link.getBoundingClientRect();
    const ul = linkList.getBoundingClientRect();
    animate(
      indicator,
      { transform: `translate(${a.left - ul.left}px, ${a.bottom - ul.top - 1.5}px) scaleX(${a.width})`, opacity: 1 },
      instant ? { duration: 0 } : { type: "spring", bounce: 0.15, visualDuration: 0.45 }
    );
  }
  nav.addEventListener("activechange", (e) => moveIndicator(e.detail));
  const placeIndicator = () => moveIndicator($(".nav__links a.active"), true);
  window.addEventListener("resize", placeIndicator);
  document.fonts?.ready.then(placeIndicator);
  // Wait for the nav's own entrance to settle before measuring
  setTimeout(placeIndicator, 1000);

  /* ---------------- Organisation ---------------- */

  const orgVisual = $(".org__visual");
  inView(orgVisual, () => {
    animate($("img", orgVisual),
      { opacity: [0, 1], transform: ["translateY(30px) scale(0.97)", "translateY(0px) scale(1)"] },
      { duration: 0.9, ease: EASE });
  }, { amount: 0.3 });
  // Slow parallax on the team as the section passes
  scroll(
    animate(orgVisual, { transform: ["translateY(40px)", "translateY(-40px)"] }, { ease: "linear" }),
    { target: orgVisual, offset: ["start end", "end start"] }
  );

  // Org chart builds itself: box → connectors → departments → AI roles
  const chart = $(".orgchart");
  inView(chart, () => {
    animate([
      [chart, { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] }, { duration: 0.6, ease: EASE }],
      [".orgchart__root", { opacity: [0, 1], transform: ["scale(0.92)", "scale(1)"] }, { duration: 0.45, ease: EASE, at: "-0.25" }],
      [".orgchart__stem", { transform: ["scaleY(0)", "scaleY(1)"] }, { duration: 0.22, ease: "easeOut" }],
      [".orgchart__bar", { transform: ["scaleX(0)", "scaleX(1)"] }, { duration: 0.32, ease: "easeOut" }],
      [".orgchart__dept", { opacity: [0, 1], transform: ["translateY(-10px)", "translateY(0px)"] }, { duration: 0.45, ease: EASE, delay: stagger(0.1) }],
      [".orgchart__dept li", { opacity: [0, 1], transform: ["translateX(-10px)", "translateX(0px)"] }, { duration: 0.35, ease: EASE, delay: stagger(0.07), at: "-0.2" }],
    ]);
  }, { amount: 0.35 });

  /* ---------------- Paths ---------------- */

  inView(".paths", () => {
    animate(".paths__halo",
      { opacity: [0, 0.9], transform: ["translateX(-50%) scale(0.8)", "translateX(-50%) scale(1)"] },
      { duration: 0.8, ease: EASE });
    animate(".paths__visual img",
      { opacity: [0, 1], transform: ["translateX(-40px) rotate(-4deg)", "translateX(0px) rotate(0deg)"] },
      { ...SPRING, delay: 0.1 });
  }, { amount: 0.25 });

  // Cards slide in from the right, as if she's pointing them out
  inView(".path-list", () => {
    animate(".path",
      { opacity: [0, 1], transform: ["translateX(40px)", "translateX(0px)"] },
      { ...SPRING, delay: stagger(0.12, { startDelay: 0.2 }) });
  }, { amount: 0.2 });

  // The card crossing the middle of the screen gets the highlight
  const paths = $$(".path");
  inView(paths, (el) => {
    paths.forEach((p) => p.classList.toggle("is-active", p === el));
  }, { margin: "-45% 0px -45% 0px" });

  /* ---------------- How it works ---------------- */

  const stepsWrap = $(".steps-wrap");
  const steps = $$(".step");
  const lit = new Set();
  function lightStep(step) {
    if (lit.has(step)) return;
    lit.add(step);
    animate(step, { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] }, { duration: 0.5, ease: EASE });
    animate($(".step__icon", step), { transform: ["scale(0.6)", "scale(1)"] },
      { type: "spring", bounce: 0.35, visualDuration: 0.45 });
  }
  // Desktop: the connector draws with scroll and each icon pops as the line reaches it
  scroll(
    animate(".steps__fill", { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" }),
    { target: stepsWrap, offset: ["start 80%", "start 35%"] }
  );
  scroll((p) => {
    if (!desktop.matches) return;
    if (p <= 0) return;
    steps.forEach((step, i) => p >= i / (steps.length - 1) - 0.02 && lightStep(step));
  }, { target: stepsWrap, offset: ["start 80%", "start 35%"] });
  // Stacked layouts: no line, so each step just pops in on view
  inView(steps, (step) => { if (!desktop.matches) lightStep(step); }, { amount: 0.5 });

  /* ---------------- Pricing ---------------- */

  const priceFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  inView(".plans", () => {
    animate(".plan",
      { opacity: [0, 1], transform: ["translateY(32px)", "translateY(0px)"] },
      { ...SPRING, delay: stagger(0.09) });
    // Prices count up once
    $$(".plan__price").forEach((el) => {
      const node = el.firstChild;
      const value = Number(node.nodeValue.replace(/[^\d]/g, ""));
      if (!value) return;
      animate(0, value, {
        duration: 1.1,
        ease: "easeOut",
        onUpdate: (v) => (node.nodeValue = priceFormat.format(Math.round(v))),
      });
    });
  }, { amount: 0.25 });

  /* ---------------- Experts ---------------- */

  const panel = $(".experts__panel");
  // Panel opens up as it enters
  scroll(
    animate(panel, { transform: ["scale(0.94)", "scale(1)"] }, { ease: "linear" }),
    { target: panel, offset: ["start end", "start 45%"] }
  );
  // Sphere drifts at a different speed for depth
  scroll(
    animate(".experts__sphere", { transform: ["translateY(-40px) rotate(-8deg)", "translateY(60px) rotate(8deg)"] }, { ease: "linear" }),
    { target: panel, offset: ["start end", "end start"] }
  );
  inView(panel, () => {
    animate(".experts__figure", { opacity: [0, 1], transform: ["translateY(60px)", "translateY(0px)"] }, { ...SPRING, delay: 0.25 });
    animate(".service", { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] },
      { duration: 0.5, ease: EASE, delay: stagger(0.08, { startDelay: 0.35 }) });
  }, { amount: 0.3 });
  // Soft spotlight follows the pointer
  if (finePointer) {
    let frame = 0;
    panel.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const r = panel.getBoundingClientRect();
        panel.style.setProperty("--mx", `${e.clientX - r.left}px`);
        panel.style.setProperty("--my", `${e.clientY - r.top}px`);
        frame = 0;
      });
    });
  }

  /* ---------------- FAQ ---------------- */

  inView(".faq__list", () => {
    animate(".qa", { opacity: [0, 1], transform: ["translateY(14px)", "translateY(0px)"] },
      { duration: 0.5, ease: EASE, delay: stagger(0.08) });
  }, { amount: 0.2 });

  // Accordion opens/closes with height instead of snapping
  $$(".qa").forEach((d) => {
    const summary = $("summary", d);
    const answer = $("p", d);
    let running = null;
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      running?.stop();
      const pb = getComputedStyle(answer).paddingBottom;
      if (d.open && !d.classList.contains("is-closing")) {
        d.classList.add("is-closing");
        running = animate(answer,
          { height: [`${answer.offsetHeight}px`, "0px"], paddingBottom: [pb, "0px"], opacity: [1, 0] },
          { duration: 0.25, ease: "easeIn" });
        running.then(() => {
          d.open = false;
          d.classList.remove("is-closing");
          answer.removeAttribute("style");
        });
      } else {
        d.classList.remove("is-closing");
        d.open = true;
        answer.removeAttribute("style");
        const h = answer.offsetHeight;
        const padding = getComputedStyle(answer).paddingBottom;
        running = animate(answer,
          { height: ["0px", `${h}px`], paddingBottom: ["0px", padding], opacity: [0, 1] },
          { duration: 0.35, ease: EASE });
        running.then(() => answer.removeAttribute("style"));
      }
    });
  });

  /* ---------------- Closing ---------------- */

  // Split the headline into words (the gradient phrase stays one unit)
  const headline = $(".closing .h2");
  [...headline.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(part);
        const w = document.createElement("span");
        w.className = "w";
        w.textContent = part;
        frag.append(w);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add("w");
    }
  });
  const closingPanel = $(".closing__panel");
  inView(closingPanel, () => {
    animate($$(".w", headline), { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] },
      { duration: 0.6, ease: EASE, delay: stagger(0.07, { startDelay: 0.15 }) });
  }, { amount: 0.4 });
  scroll(
    animate(".closing__glow", { transform: ["translateY(-30px) scale(0.9)", "translateY(40px) scale(1.1)"] }, { ease: "linear" }),
    { target: closingPanel, offset: ["start end", "end start"] }
  );

  // Buttons lean slightly toward the pointer
  if (finePointer) {
    $$(".closing__ctas .btn").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 8;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * 6;
        btn.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      });
      btn.addEventListener("pointerleave", () => (btn.style.translate = ""));
    });
  }
})();
