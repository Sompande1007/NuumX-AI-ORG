# NuumX — Hire AI Employees

Landing page for NuumX AI employees: hero, organisation overview, build paths,
how it works, an interactive organisation builder, pricing, Forward Deployed
Engineers, FAQ and closing call to action.

Static HTML, CSS and JavaScript — no build step.

## Run locally

Serve the folder over HTTP rather than opening `index.html` directly, so the
hero's frame sequence and scripts load reliably:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Page markup |
| `css/hero.css` | Hero, nav and shared tokens |
| `css/sections.css` | Sections below the hero |
| `css/motion.css` | Hover/press states, ambient loops, animation start states |
| `js/hero.js` | Canvas frame animation for the hero |
| `js/site.js` | Nav, mobile menu, scroll reveals, organisation builder |
| `js/motion.js` | Scroll and in-view animations ([Motion](https://motion.dev), loaded from jsDelivr) |
| `assets/` | Optimised illustrations (WebP) |
| `hero-frames/` | Frame sequence for the hero animation |

Animations respect `prefers-reduced-motion`, and the page stays fully usable if
the Motion library fails to load.
