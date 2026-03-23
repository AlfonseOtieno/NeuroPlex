/**
 * NeuroPlex — core.js
 * Shared utilities: custom cursor, neural canvas background,
 * navigation scroll behaviour, scroll-reveal observer.
 * Loaded on every page.
 */

/* ── Custom Cursor ────────────────────────────────────────── */
(function initCursor() {
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  // Grow ring on interactive elements
  document.addEventListener('mouseover', e => {
    const target = e.target.closest('a, button, [role="button"], .activity-card');
    if (target) {
      ring.style.width  = '52px';
      ring.style.height = '52px';
      ring.style.borderColor = 'rgba(0,229,255,0.6)';
    } else {
      ring.style.width  = '34px';
      ring.style.height = '34px';
      ring.style.borderColor = 'rgba(0,229,255,0.45)';
    }
  });
})();

/* ── Neural Canvas Background ─────────────────────────────── */
(function initNeuralBg() {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initNodes() {
    nodes = [];
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) {
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r:  Math.random() * 1.8 + 0.8
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;

      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,255,0.55)';
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,229,255,${(1 - dist / 130) * 0.45})`;
          ctx.lineWidth = 0.55;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  initNodes();
  draw();

  window.addEventListener('resize', () => { resize(); initNodes(); });
})();

/* ── Navigation Scroll State ──────────────────────────────── */
(function initNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();

/* ── Scroll Reveal ────────────────────────────────────────── */
(function initScrollReveal() {
  const selector = '.reveal';
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  els.forEach(el => observer.observe(el));
})();

/* ── Active Timer Registry (shared by exercise scripts) ────── */
window.NeuroPlex = window.NeuroPlex || {};

NeuroPlex.timers = [];

NeuroPlex.clearTimers = function () {
  NeuroPlex.timers.forEach(id => {
    clearInterval(id);
    clearTimeout(id);
    cancelAnimationFrame(id);
  });
  NeuroPlex.timers = [];
};

NeuroPlex.addTimer = function (id) {
  NeuroPlex.timers.push(id);
  return id;
};

/* ── Utility: Format seconds as MM:SS.d ─────────────────── */
NeuroPlex.formatTime = function (seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
};

/* ── Utility: Shuffle array (in-place Fisher-Yates) ────────── */
NeuroPlex.shuffle = function (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
