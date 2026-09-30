(() => {
  /* ---------------- Sticky nav + active link ---------------- */
  const nav = document.querySelector(".nav");
  const hero = document.getElementById("hero");
  const links = [...document.querySelectorAll(".nav__links a")];

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Mobile menu ---------------- */
  const toggle = nav.querySelector(".nav__toggle");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  links.forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setMenu(false);
  });
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => e.matches && setMenu(false));

  const sectionFor = new Map(
    links.map((a) => [document.querySelector(a.getAttribute("href")), a]).filter(([s]) => s)
  );
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        const link = sectionFor.get(e.target);
        link.classList.add("active");
        nav.dispatchEvent(new CustomEvent("activechange", { detail: link }));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sectionFor.forEach((_, s) => spy.observe(s));

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll(".sr");
  // Stagger siblings that reveal together.
  revealEls.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("sr"));
    el.style.setProperty("--sr-d", `${Math.min(sibs.indexOf(el), 5) * 80}ms`);
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------------- Organisation builder ---------------- */
  const TIERS = {
    Standard: 4999,
    Professional: 9999,
    Expert: 19999,
  };

  const DEPARTMENTS = [
    { name: "Sales", roles: [["Lead Qualifier", "Professional"], ["Proposal Writer", "Professional"]] },
    { name: "Marketing", roles: [["Content Writer", "Professional"], ["Campaign Analyst", "Standard"]] },
    { name: "Customer Support", roles: [["L1 Support Agent", "Standard"], ["Ticket Triage Executive", "Standard"]] },
    { name: "Finance and Accounts", roles: [["Accounts Receivable Executive", "Professional"], ["MIS Reporter", "Expert"]] },
    { name: "Leadership", roles: [["AI Chief of Staff", "Expert"]] },
    { name: "HR and Talent", roles: [["Onboarding Coordinator", "Standard"]] },
    { name: "Operations", roles: [["Procurement Assistant", "Professional"]] },
    { name: "IT and Admin", roles: [["IT Helpdesk Agent", "Standard"]] },
  ];

  // Plans in ascending order; the first one that fits the draft is suggested.
  const PLANS = [
    { id: "starter", name: "Starter", fee: 0, maxDepts: 1, maxEmployees: 3 },
    { id: "growth", name: "Growth", fee: 9999, maxDepts: 5, maxEmployees: 15 },
    { id: "scale", name: "Scale", fee: 29999, maxDepts: Infinity, maxEmployees: 50 },
    { id: "enterprise", name: "Enterprise", fee: null, maxDepts: Infinity, maxEmployees: Infinity },
  ];

  const STORAGE_KEY = "nuumx-org-draft";

  // Motion is optional: without it (or with reduced motion) the builder just updates instantly.
  const M = window.Motion;
  const motionOK = Boolean(M) && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.4 };
  const inrFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const inr = (n) => inrFormat.format(n);
  const roleKey = (dept, role) => `${dept}::${role}`;

  const deptsEl = document.getElementById("depts");
  if (!deptsEl) return;
  const nameInput = document.getElementById("orgName");
  const industrySelect = document.getElementById("orgIndustry");
  const sumName = document.getElementById("sumName");
  const sumMeta = document.getElementById("sumMeta");
  const sumList = document.getElementById("sumList");
  const sumTotal = document.getElementById("sumTotal");
  const sumAnnounce = document.getElementById("sumAnnounce");
  const barMeta = document.getElementById("barMeta");
  const barTotal = document.getElementById("barTotal");
  const planCards = document.querySelectorAll(".plan[data-plan]");
  const summaryEl = document.getElementById("summary");
  const builderBar = document.querySelector(".builder-bar");

  let state = { name: "", industry: "", roles: {} }; // roles: { key: headcount }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") state = { ...state, ...saved, roles: saved.roles || {} };
  } catch (_) { /* storage unavailable — start fresh */ }

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  // Render department cards once; afterwards only toggle state classes.
  deptsEl.innerHTML = DEPARTMENTS.map(
    (d) => `
      <div class="dept">
        <div class="dept__head"><h4>${d.name}</h4><span>${d.roles.length} role${d.roles.length > 1 ? "s" : ""}</span></div>
        <ul class="dept__roles">
          ${d.roles
            .map(
              ([role, tier]) => `
            <li class="role" data-key="${roleKey(d.name, role)}">
              <div>
                <div class="role__name">${role}</div>
                <div class="role__meta">${tier} · <b>${inr(TIERS[tier])}</b>/mo</div>
              </div>
              <button type="button" class="role__add" aria-pressed="false" aria-label="Add ${role}">Add +</button>
            </li>`
            )
            .join("")}
        </ul>
      </div>`
  ).join("");

  const rowFor = (key) =>
    sumList.querySelector(`[data-key="${CSS.escape(key)}"]`)?.closest(".sum-role");

  // Collapse a summary row before removing its role, so it doesn't just vanish.
  function removeRole(key) {
    const finish = () => { delete state.roles[key]; update(); };
    const row = motionOK && rowFor(key);
    if (!row) return finish();
    row.style.overflow = "hidden";
    M.animate(row, { opacity: 0, height: 0, marginTop: 0 }, { duration: 0.22, ease: "easeIn" }).then(finish);
  }

  deptsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".role__add");
    if (!btn) return;
    const key = btn.closest(".role").dataset.key;
    if (motionOK) M.animate(btn, { transform: ["scale(0.88)", "scale(1)"] }, SPRING);
    if (state.roles[key]) return removeRole(key);
    state.roles[key] = 1;
    update();
  });

  sumList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    const key = btn.dataset.key;
    const next = (state.roles[key] || 0) + Number(btn.dataset.step);
    if (next <= 0) return removeRole(key);
    state.roles[key] = Math.min(next, 99);
    update();
  });

  nameInput.value = state.name;
  industrySelect.value = state.industry;
  nameInput.addEventListener("input", () => { state.name = nameInput.value; update(); });
  industrySelect.addEventListener("change", () => { state.industry = industrySelect.value; update(); });

  // Announce only real changes (not the initial render) to screen readers.
  let announced = null;
  function announce(text) {
    if (announced !== null && text !== announced) sumAnnounce.textContent = text;
    announced = text;
  }

  // Previous render, used to animate only what changed.
  let prev = null;
  let totalAnim = null;

  function update() {
    const picked = [];
    DEPARTMENTS.forEach((d) =>
      d.roles.forEach(([role, tier]) => {
        const count = state.roles[roleKey(d.name, role)];
        if (count) picked.push({ dept: d.name, role, tier, count });
      })
    );

    const employees = picked.reduce((n, r) => n + r.count, 0);
    const depts = new Set(picked.map((r) => r.dept)).size;
    const plan = PLANS.find((p) => depts <= p.maxDepts && employees <= p.maxEmployees);
    const rolesCost = picked.reduce((n, r) => n + TIERS[r.tier] * r.count, 0);

    // Role buttons
    deptsEl.querySelectorAll(".role").forEach((li) => {
      const on = Boolean(state.roles[li.dataset.key]);
      li.classList.toggle("is-added", on);
      const b = li.querySelector(".role__add");
      b.textContent = on ? "Added ✓" : "Add +";
      b.setAttribute("aria-pressed", on);
    });

    // Summary
    const title = state.name.trim() || "Your organisation";
    sumName.textContent = title;
    const countText = `${employees} AI employee${employees === 1 ? "" : "s"} · ${plan.name} plan`;
    sumMeta.textContent = countText + (state.industry ? ` · ${state.industry}` : "");

    if (!picked.length) {
      sumList.innerHTML = `<p class="summary__empty">Your selected roles will appear here.</p>`;
    } else {
      const byDept = {};
      picked.forEach((r) => (byDept[r.dept] ||= []).push(r));
      sumList.innerHTML = Object.entries(byDept)
        .map(
          ([dept, rs]) => `
          <div class="sum-dept">
            <h4>${dept}</h4>
            ${rs
              .map((r) => {
                const key = roleKey(r.dept, r.role);
                return `
              <div class="sum-role">
                <span class="sum-role__name">${r.role}</span>
                <span class="stepper" role="group" aria-label="${r.role} headcount">
                  <button type="button" data-key="${key}" data-step="-1" aria-label="Remove one ${r.role}">−</button>
                  <span>${r.count}</span>
                  <button type="button" data-key="${key}" data-step="1" aria-label="Add one ${r.role}">+</button>
                </span>
                <span class="sum-role__price">${inr(TIERS[r.tier] * r.count)}</span>
              </div>`;
              })
              .join("")}
          </div>`
        )
        .join("");
    }

    const total = plan.fee === null ? null : plan.fee + rolesCost;
    const totalText = total === null ? "Custom" : inr(total);
    const paintTotal = (v) => {
      sumTotal.innerHTML = v === null ? `Custom<small> · talk to us</small>` : `${inr(v)}<small>/mo</small>`;
      barTotal.textContent = v === null ? "Custom" : `${inr(v)}/mo`;
    };
    totalAnim?.stop();
    if (motionOK && prev && prev.total !== null && total !== null && prev.total !== total) {
      // Count to the new total rather than jumping.
      totalAnim = M.animate(prev.total, total, {
        duration: 0.5,
        ease: "easeOut",
        onUpdate: (v) => paintTotal(Math.round(v)),
      });
    } else {
      paintTotal(total);
    }
    barMeta.textContent = countText;

    const counts = Object.fromEntries(picked.map((r) => [roleKey(r.dept, r.role), r.count]));
    if (motionOK && prev) {
      Object.entries(counts).forEach(([key, count]) => {
        const row = rowFor(key);
        if (!row) return;
        if (!(key in prev.counts)) {
          // New role slides into the summary.
          M.animate(row, { opacity: [0, 1], transform: ["translateX(14px)", "translateX(0px)"] }, SPRING);
        } else if (prev.counts[key] !== count) {
          // Headcount number flips in the direction it changed.
          const dir = count > prev.counts[key] ? 1 : -1;
          M.animate(row.querySelector(".stepper span"),
            { opacity: [0, 1], transform: [`translateY(${dir * 8}px)`, `translateY(0px)`] }, { duration: 0.25 });
        }
      });
      if (prev.plan !== plan.id) M.animate(sumMeta, { opacity: [0.2, 1] }, { duration: 0.35 });
    }

    // The figure gives a small hop when the first role is added.
    if (motionOK && prev && employees > 0 && !summaryEl.classList.contains("has-roles")) {
      M.animate(summaryEl.querySelector(".summary__figure"),
        { transform: ["translateY(0px)", "translateY(-14px)", "translateY(0px)"] },
        { duration: 0.6, ease: "easeInOut" });
    }
    summaryEl.classList.toggle("has-roles", employees > 0);
    builderBar.classList.toggle("is-visible", employees > 0);

    // Only flag a plan once the draft has something in it.
    planCards.forEach((c) => {
      const on = employees > 0 && c.dataset.plan === plan.id;
      const was = c.classList.contains("is-current");
      c.classList.toggle("is-current", on);
      if (on && !was && motionOK && prev) {
        const badge = c.querySelector(".plan__badge");
        M.animate(badge, { transform: ["scale(0.6)", "scale(1)"] }, { ...SPRING, bounce: 0.35 })
          .then(() => (badge.style.transform = ""));
      }
    });
    prev = { total, counts, plan: plan.id };
    announce(`${countText}, ${plan.fee === null ? "custom pricing" : `${totalText} per month`}`);
    save();
  }

  update();
})();
