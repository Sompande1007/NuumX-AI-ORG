(() => {
  const FRAME_COUNT = 219;
  const FPS = 30;
  const src = (i) => `hero-frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

  const canvas = document.getElementById("heroCanvas");
  const ctx = canvas.getContext("2d");
  const hero = document.getElementById("hero");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const frames = new Array(FRAME_COUNT);
  let current = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(hero.clientWidth * dpr);
    canvas.height = Math.round(hero.clientHeight * dpr);
    draw(current);
  }

  // Lay the illustration out like the reference: sized to the viewport
  // height and pushed right so the copy has room on the left.
  function draw(i) {
    const img = frames[i];
    if (!img || !img.complete || !img.naturalWidth) return;
    current = i;
    const W = canvas.width, H = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const mobile = hero.clientWidth <= 900;

    let s, x0, y0;
    if (mobile) {
      // Copy on top, illustration anchored below it. Phones get a larger
      // crop; tablets a smaller one so the building doesn't dwarf the copy.
      // Keep these scales in sync with .hero padding-bottom in hero.css.
      s = (W * (hero.clientWidth <= 600 ? 1.45 : 1.15)) / iw;
      const dw = iw * s, dh = ih * s;
      // Centre the building, but never leave a gap at either edge.
      x0 = Math.min(0, Math.max(W * 0.5 - dw * 0.58, W - dw));
      y0 = H - dh;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#2f64c4");
      g.addColorStop(0.5, "#5b93e2");
      g.addColorStop(1, "#8dbcf2");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Feather only the top edge so it dissolves into the gradient.
      ctx.drawImage(feathered(img, dw, dh, { top: 0.16 }), x0, y0);
      return;
    }

    // Desktop: keep the building clear of the copy. Scale the frame so the
    // building sits entirely to the right of the text column, then feather
    // its left and bottom edges into an empty backdrop frame.
    const dpr = W / hero.clientWidth;
    const room = W - (textRight() + 56) * dpr;
    const bgImg = frames[0];
    s = Math.min(H / ih, room / (iw * (1 - BLD_LEFT - CROP_RIGHT)));
    const dw = iw * s, dh = ih * s;
    x0 = W - dw * (1 - CROP_RIGHT);
    // Line the building up with the copy when there's spare height.
    y0 = (H - dh) * 0.4;

    // Backdrop: the opening (empty) frame, covering the whole hero.
    const bs = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    ctx.drawImage(bgImg, W - bgImg.naturalWidth * bs, 0, bgImg.naturalWidth * bs, bgImg.naturalHeight * bs);

    if (s >= H / ih - 1e-6 && x0 <= 0) {
      ctx.drawImage(img, x0, y0, dw, dh);
      return;
    }
    ctx.drawImage(feathered(img, dw, dh, { left: 0.2, top: 0.12, bottom: 0.18 }), x0, y0);
  }

  // Where the building sits inside each frame, as fractions of its width.
  const BLD_LEFT = 0.255;
  const CROP_RIGHT = 0.02;

  // Right edge (CSS px) of the actual text and buttons, not their boxes.
  function textRight() {
    let r = 0;
    const range = document.createRange();
    document.querySelectorAll(".eyebrow, .headline, .sub").forEach((el) => {
      range.selectNodeContents(el);
      r = Math.max(r, range.getBoundingClientRect().right);
    });
    document.querySelectorAll(".ctas > *, .features > li").forEach((el) => {
      r = Math.max(r, el.getBoundingClientRect().right);
    });
    return r - hero.getBoundingClientRect().left;
  }

  const buf = document.createElement("canvas");
  const bctx = buf.getContext("2d");
  const mask = document.createElement("canvas");
  let maskKey = "";

  // Draw `img` at dw×dh with its edges faded to transparent. `edges` gives
  // the fade length per side as a fraction of the drawn size.
  function feathered(img, dw, dh, edges) {
    const w = Math.ceil(dw), h = Math.ceil(dh);
    const { left = 0, top = 0, bottom = 0 } = edges;
    const key = [w, h, left, top, bottom].join();
    if (key !== maskKey) {
      maskKey = key;
      mask.width = buf.width = w;
      mask.height = buf.height = h;
      const m = mask.getContext("2d");
      const gx = m.createLinearGradient(0, 0, Math.max(w * left, 1), 0);
      gx.addColorStop(0, left ? "rgba(0,0,0,0)" : "#000");
      gx.addColorStop(1, "#000");
      m.fillStyle = gx;
      m.fillRect(0, 0, w, h);
      m.globalCompositeOperation = "destination-in";
      const gy = m.createLinearGradient(0, 0, 0, h);
      gy.addColorStop(0, top ? "rgba(0,0,0,0)" : "#000");
      gy.addColorStop(top || 0, "#000");
      gy.addColorStop(1 - bottom, "#000");
      gy.addColorStop(1, bottom ? "rgba(0,0,0,0)" : "#000");
      m.fillStyle = gy;
      m.fillRect(0, 0, w, h);
    }
    bctx.globalCompositeOperation = "copy";
    bctx.drawImage(img, 0, 0, w, h);
    bctx.globalCompositeOperation = "destination-in";
    bctx.drawImage(mask, 0, 0);
    return buf;
  }

  function load(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => resolve();
      img.src = src(i + 1);
      frames[i] = img;
    });
  }

  // Any interaction skips the intro straight to the finished building.
  let skip = false;
  ["wheel", "touchstart", "pointerdown", "keydown"].forEach((type) =>
    window.addEventListener(type, () => (skip = true), { once: true, passive: true })
  );

  function play() {
    let start = null;
    const step = (t) => {
      if (start === null) start = t;
      const last = frames[FRAME_COUNT - 1];
      const target = skip && last && last.complete && last.naturalWidth
        ? FRAME_COUNT - 1
        : Math.min(FRAME_COUNT - 1, Math.floor(((t - start) / 1000) * FPS));
      // Only advance to frames that have arrived; otherwise hold.
      if (frames[target] && frames[target].complete) draw(target);
      if (current < FRAME_COUNT - 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize);
  document.fonts && document.fonts.ready.then(resize);

  if (reduceMotion) {
    Promise.all([load(0), load(FRAME_COUNT - 1)]).then(() => {
      current = FRAME_COUNT - 1;
      resize();
      document.body.classList.add("is-ready");
    });
    return;
  }

  // First frame immediately, then preload the rest before playing.
  load(0).then(() => {
    resize();
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
    const rest = [];
    for (let i = 1; i < FRAME_COUNT; i++) rest.push(load(i));
    // Start once the first ~third is in; later frames stream in behind.
    Promise.all(rest.slice(0, 70)).then(play);
  });
})();
