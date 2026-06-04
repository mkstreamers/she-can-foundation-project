/**
 * She Can Foundation — Main JS
 * Handles: animated background, counter animation,
 *           client-side form validation, AJAX submit, success modal.
 */

/* ── Footer year ── */
document.getElementById("footer-year").textContent = new Date().getFullYear();

/* ================================================================
   ANIMATED BACKGROUND CANVAS
   Soft moving gradient particles
   ================================================================ */
(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function () {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.r  = Math.random() * 1.8 + 0.4;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = (Math.random() - 0.5) * 0.35;
    this.alpha = Math.random() * 0.5 + 0.1;
    this.color = Math.random() > 0.5
      ? `rgba(201,75,138,${this.alpha})`
      : `rgba(245,166,35,${this.alpha})`;
  };
  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  };

  function init() {
    resize();
    particles = Array.from({ length: 120 }, () => new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      p.update();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  init();
  draw();
})();

/* ================================================================
   COUNTER ANIMATION — hero stats
   ================================================================ */
(function initCounters() {
  const items = document.querySelectorAll(".stat-num[data-target]");
  if (!items.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      animateCounter(entry.target);
    });
  }, { threshold: 0.5 });

  items.forEach(el => io.observe(el));

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const suffix   = el.dataset.suffix || "";
    const duration = 2000;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);   // ease-out-cubic
      const current  = Math.floor(ease * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
})();

/* ================================================================
   FORM VALIDATION & SUBMISSION
   ================================================================ */
(function initForm() {
  const form       = document.getElementById("contact-form");
  const submitBtn  = document.getElementById("submit-btn");
  const modal      = document.getElementById("success-modal");
  const modalClose = document.getElementById("modal-close");
  const charCount  = document.getElementById("char-count");
  const msgInput   = document.getElementById("message");

  if (!form) return;

  /* ── Live char counter ── */
  msgInput.addEventListener("input", () => {
    const len = msgInput.value.length;
    charCount.textContent = `${len} / 2000`;
    charCount.style.color = len > 1800 ? "#f87171" : len > 1500 ? "#fbbf24" : "";
  });

  /* ── Field validators ── */
  const validators = {
    name(v) {
      if (!v || v.trim().length < 2) return "Please enter your full name (at least 2 characters).";
      if (v.trim().length > 100)    return "Name must be under 100 characters.";
      return null;
    },
    email(v) {
      if (!v || !v.trim()) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Please enter a valid email address.";
      return null;
    },
    message(v) {
      if (!v || v.trim().length < 10) return "Message must be at least 10 characters.";
      if (v.trim().length > 2000)     return "Message must be under 2000 characters.";
      return null;
    },
  };

  function setFieldState(fieldId, errorMsg) {
    const group = document.getElementById(`field-${fieldId}`);
    const errEl = document.getElementById(`${fieldId}-error`);
    if (!group) return;

    group.classList.toggle("valid",  !errorMsg);
    group.classList.toggle("error",  !!errorMsg);
    if (errEl) errEl.textContent = errorMsg || "";
  }

  /* ── Real-time validation on blur ── */
  ["name", "email", "message"].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("blur", () => {
      const err = validators[id](input.value);
      setFieldState(id, err);
    });
    input.addEventListener("input", () => {
      if (!document.getElementById(`field-${id}`).classList.contains("error")) return;
      const err = validators[id](input.value);
      setFieldState(id, err);
    });
  });

  /* ── Submit ── */
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const name    = document.getElementById("name").value;
    const email   = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Run all validators
    let hasError = false;
    ["name", "email", "message"].forEach(id => {
      const input = document.getElementById(id);
      const err   = validators[id](input.value);
      setFieldState(id, err);
      if (err) hasError = true;
    });
    if (hasError) {
      // Focus first error field
      const firstError = form.querySelector(".field-group.error .field-input");
      if (firstError) firstError.focus();
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    try {
      const res  = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();

      if (data.success) {
        form.reset();
        charCount.textContent = "0 / 2000";
        ["name","email","message"].forEach(id => setFieldState(id, null));
        showModal();
      } else {
        // Show server-side error inline
        showServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      showServerError("Network error. Please check your connection and try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    }
  });

  function showServerError(msg) {
    // Display above submit button
    let errEl = document.getElementById("server-error");
    if (!errEl) {
      errEl = document.createElement("p");
      errEl.id = "server-error";
      errEl.style.cssText = "color:#f87171;font-size:.85rem;margin-bottom:.75rem;text-align:center;";
      submitBtn.parentNode.insertBefore(errEl, submitBtn);
    }
    errEl.textContent = "⚠ " + msg;
    setTimeout(() => { if (errEl) errEl.remove(); }, 6000);
  }

  /* ── Modal ── */
  function showModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }

  function hideModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  modalClose.addEventListener("click", hideModal);
  modal.addEventListener("click", e => {
    if (e.target === modal) hideModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !modal.hidden) hideModal();
  });
})();

/* ================================================================
   SMOOTH SCROLL for anchor links
   ================================================================ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

/* ================================================================
   HEADER — add shadow on scroll
   ================================================================ */
(function headerScroll() {
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header.style.boxShadow = window.scrollY > 10
      ? "0 4px 30px rgba(0,0,0,.35)"
      : "none";
  }, { passive: true });
})();
