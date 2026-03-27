/**
 * NeuroPlex — Gorilla Effect Challenge (v4)
 *
 * Round structure:
 *  1. HIGHLIGHT  — targets glow, no mention of intruder
 *  2. TRACK      — all objects identical, user tracks mentally
 *  3. INTRUDER   — subtle dim object(s) pass in random directions
 *  4. RECALL     — user must tap ALL targets before proceeding
 *  5. AWARENESS  — multiple choice: what passed across the screen?
 *  6. RESULTS    — tracking + awareness result + cognitive insight
 */

(function GorillaExercise() {
  'use strict';

  /* ── Metadata ────────────────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'gorilla');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML =
      act.chips.map(c => `<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML =
      act.benefits.map(b => `<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML =
      act.instructions.map(i => `<li>${i}</li>`).join('');
  }

  /* ── Pools ───────────────────────────────────────────────── */
  const INTRUDERS = ['🦍','🐘','🚀','🌈','👻','🐉','🎪','🌊','⚡','🦁'];
  const EMOJIS    = ['⚽','🎱','🔵','🟡','🔴','🟢','🟠','🟣'];

  /* ── Configs ─────────────────────────────────────────────── */
  const CONFIGS = {
    easy:   { nObjects: 5, nTargets: 1, speed: 1.6, trackMs: 20000, highlightMs: 2500 },
    medium: { nObjects: 6, nTargets: 2, speed: 2.4, trackMs: 25000, highlightMs: 2000 },
    hard:   { nObjects: 8, nTargets: 3, speed: 3.2, trackMs: 30000, highlightMs: 1500 }
  };

  /* ── State ───────────────────────────────────────────────── */
  let level            = 'easy';
  let phase            = 'idle';
  let objects          = [];
  let targetIdx        = [];
  let animId           = null;
  let phaseTimer       = null;
  let intruder         = null;
  let intruderShown    = false;
  let intruderVisible  = false;
  let intruderEmoji    = '';
  let intruder2        = null;
  let intruder2Visible = false;
  let intruder2Emoji   = '';
  let userTappedIdx    = null;
  let userTappedIndices= [];
  let trackingCorrect  = false;
  let roundsPlayed     = 0;
  let roundsCorrect    = 0;
  let noticeCount      = 0;

  /* ── DOM ─────────────────────────────────────────────────── */
  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `
    <button class="btn btn-primary btn-sm" id="start-btn">▶ Start Round</button>
    <button class="btn btn-ghost btn-sm"   id="reset-btn">↺ Reset</button>`;

  document.getElementById('start-btn').addEventListener('click', startRound);
  document.getElementById('reset-btn').addEventListener('click', resetAll);

  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      level = btn.dataset.level;
      resetAll();
    });
  });

  /* ── Layout ──────────────────────────────────────────────── */
  exBody.innerHTML = `
    <p id="gor-status"
       style="text-align:center;font-family:var(--font-display);
              font-weight:700;font-size:0.95rem;color:var(--cyan);
              min-height:24px;margin-bottom:12px;"
       aria-live="polite">Press Start Round to begin.</p>

    <canvas id="gor-canvas" class="ex-canvas" height="320"
      style="border-radius:12px;background:#04070f;display:block;"
      aria-label="Gorilla effect canvas"></canvas>

    <div style="display:flex;gap:20px;justify-content:center;
                margin-top:14px;flex-wrap:wrap;">
      <span style="font-size:0.8rem;color:var(--text-muted);">
        Tracking: <span id="track-score"
          style="color:var(--cyan);font-family:var(--font-display);
                 font-weight:700;">0/0</span>
      </span>
      <span style="font-size:0.8rem;color:var(--text-muted);">
        Noticed: <span id="notice-score"
          style="color:var(--green);font-family:var(--font-display);
                 font-weight:700;">0/0</span>
      </span>
    </div>

    <div id="question-area" style="margin-top:18px;"></div>`;

  const canvas = document.getElementById('gor-canvas');
  const ctx    = canvas.getContext('2d');

  function resize() { canvas.width = canvas.offsetWidth; }
  resize();
  window.addEventListener('resize', resize);

  /* ── Canvas tap ──────────────────────────────────────────── */
  canvas.addEventListener('click', e => {
    if (phase !== 'recall') return;
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const my   = (e.clientY - rect.top)  * (canvas.height / rect.height);
    handleRecallTap(mx, my);
  });

  canvas.addEventListener('touchstart', e => {
    if (phase !== 'recall') return;
    e.preventDefault();
    const rect  = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx    = (touch.clientX - rect.left) * (canvas.width  / rect.width);
    const my    = (touch.clientY - rect.top)  * (canvas.height / rect.height);
    handleRecallTap(mx, my);
  }, { passive: false });

  /* ══════════════════════════════════════════════════════════
     OBJECT CREATION
     ══════════════════════════════════════════════════════════ */
  function createObjects() {
    const cfg         = CONFIGS[level];
    const W           = canvas.width;
    const H           = canvas.height;
    const R           = 20;
    const sharedEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const arr         = [];

    for (let i = 0; i < cfg.nObjects; i++) {
      let x, y, attempts = 0, overlap;
      do {
        x       = R + Math.random() * (W - R * 2);
        y       = R + Math.random() * (H - R * 2);
        overlap = arr.some(b =>
          Math.sqrt((b.x - x) ** 2 + (b.y - y) ** 2) < R * 3
        );
        attempts++;
      } while (overlap && attempts < 30);

      arr.push({
        x, y,
        vx:    (Math.random() - 0.5) * cfg.speed * 2,
        vy:    (Math.random() - 0.5) * cfg.speed * 2,
        r:     R,
        emoji: sharedEmoji,
        idx:   i
      });
    }
    return arr;
  }

  /* ══════════════════════════════════════════════════════════
     INTRUDER PATH — 5 random directions
     ══════════════════════════════════════════════════════════ */
  function makeIntruderPath() {
    const W   = canvas.width;
    const H   = canvas.height;
    const dir = Math.floor(Math.random() * 5);
    const spd = 3.0 + Math.random() * 1.5;

    if (dir === 0) return { x: -80,    y: H*(0.2+Math.random()*0.6), vx:  spd, vy: 0    };
    if (dir === 1) return { x: W+80,   y: H*(0.2+Math.random()*0.6), vx: -spd, vy: 0    };
    if (dir === 2) return { x: W*(0.2+Math.random()*0.6), y: -80,    vx: 0,    vy:  spd };
    if (dir === 3) return { x: W*(0.2+Math.random()*0.6), y: H+80,   vx: 0,    vy: -spd };
    /* diagonal */
    const fromLeft = Math.random() > 0.5;
    return {
      x:  fromLeft ? -80 : W+80,
      y:  Math.random() > 0.5 ? -80 : H+80,
      vx: fromLeft ?  2.5 : -2.5,
      vy: Math.random() > 0.5 ? 2.5 : -2.5
    };
  }

  /* ══════════════════════════════════════════════════════════
     ROUND FLOW
     ══════════════════════════════════════════════════════════ */
  function startRound() {
    clearTimeout(phaseTimer);
    cancelAnimationFrame(animId);
    clearQuestionArea();

    const cfg        = CONFIGS[level];
    objects          = createObjects();

    const allIdx     = Array.from({ length: objects.length }, (_, i) => i);
    NeuroPlex.shuffle(allIdx);
    targetIdx        = allIdx.slice(0, cfg.nTargets);

    intruder         = null;
    intruderShown    = false;
    intruderVisible  = false;
    intruderEmoji    = INTRUDERS[Math.floor(Math.random() * INTRUDERS.length)];
    intruder2        = null;
    intruder2Visible = false;
    intruder2Emoji   = '';
    userTappedIdx    = null;
    userTappedIndices= [];
    phase            = 'highlight';

    setStatus(
      cfg.nTargets === 1
        ? 'Remember this object — track it when it moves'
        : `Remember these ${cfg.nTargets} objects — track them`,
      'var(--cyan)'
    );

    disableStartBtn();
    drawFrame();

    phaseTimer = setTimeout(() => {
      phase = 'track';
      setStatus('Track your object…', 'var(--text-dim)');
      scheduleIntruder();
      animateBalls();

      phaseTimer = setTimeout(stopTracking, cfg.trackMs);
      NeuroPlex.addTimer(phaseTimer);
    }, cfg.highlightMs);
    NeuroPlex.addTimer(phaseTimer);
  }

  /* ── Schedule intruder(s) ────────────────────────────────── */
  function scheduleIntruder() {
    const cfg      = CONFIGS[level];
    const minDelay = cfg.trackMs * 0.3;
    const maxDelay = cfg.trackMs * 0.65;
    const delay1   = minDelay + Math.random() * (maxDelay - minDelay);

    const t1 = setTimeout(() => {
      intruderShown   = true;
      intruderVisible = true;
      intruder        = makeIntruderPath();
    }, delay1);
    NeuroPlex.addTimer(t1);

    /* 50% chance of second intruder */
    if (Math.random() > 0.5) {
      const delay2 = delay1 + 4000 + Math.random() * 3000;
      if (delay2 < cfg.trackMs * 0.88) {
        const t2 = setTimeout(() => {
          intruder2        = makeIntruderPath();
          intruder2Visible = true;
          intruder2Emoji   = INTRUDERS
            .filter(e => e !== intruderEmoji)
            [Math.floor(Math.random() * (INTRUDERS.length - 1))];
        }, delay2);
        NeuroPlex.addTimer(t2);
      }
    }
  }

  /* ── Stop tracking, ask recall ───────────────────────────── */
  function stopTracking() {
    phase = 'recall';
    cancelAnimationFrame(animId);
    const cfg = CONFIGS[level];
    setStatus(
      cfg.nTargets === 1
        ? 'Tap the object you were tracking'
        : `Tap all ${cfg.nTargets} objects you were tracking`,
      'var(--orange)'
    );
    drawFrame();
  }

  /* ══════════════════════════════════════════════════════════
     RECALL — must tap ALL targets
     ══════════════════════════════════════════════════════════ */
  function handleRecallTap(mx, my) {
    if (phase !== 'recall') return;
    const cfg = CONFIGS[level];

    const tapped = objects.find(o =>
      !userTappedIndices.includes(o.idx) &&
      Math.sqrt((mx - o.x) ** 2 + (my - o.y) ** 2) <= o.r + 10
    );
    if (!tapped) return;

    userTappedIndices.push(tapped.idx);
    drawFrame();

    if (userTappedIndices.length >= cfg.nTargets) {
      trackingCorrect = userTappedIndices.every(idx => targetIdx.includes(idx));
      userTappedIdx   = userTappedIndices[0];
      phase           = 'awareness';
      setTimeout(askAwarenessQuestion, 400);
    } else {
      const remaining = cfg.nTargets - userTappedIndices.length;
      setStatus(
        `Tap ${remaining} more object${remaining > 1 ? 's' : ''}`,
        'var(--orange)'
      );
    }
  }

  /* ══════════════════════════════════════════════════════════
     AWARENESS — multiple choice
     ══════════════════════════════════════════════════════════ */
  function askAwarenessQuestion() {
    setStatus('One more question…', 'var(--text-dim)');

    const decoys  = INTRUDERS
      .filter(e => e !== intruderEmoji)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = NeuroPlex.shuffle([intruderEmoji, ...decoys]);

    const qa = document.getElementById('question-area');
    qa.innerHTML = `
      <div style="background:var(--surface-2);border:1px solid var(--border);
                  border-radius:var(--r-lg);padding:20px 24px;">
        <p style="font-family:var(--font-display);font-weight:700;
                  font-size:0.95rem;color:var(--text);margin-bottom:6px;
                  text-align:center;">
          Did anything pass across the screen?
        </p>
        <p style="font-size:0.78rem;color:var(--text-muted);
                  text-align:center;margin-bottom:16px;">
          Select what you saw, or the last option if nothing.
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${options.map(opt => `
            <button class="awareness-opt" data-val="${opt}"
              style="padding:11px 16px;border-radius:var(--r-md);
                     border:1.5px solid var(--border);
                     background:var(--surface);color:var(--text);
                     font-size:1.1rem;cursor:pointer;text-align:left;
                     transition:all 0.2s;">
              ${opt}
            </button>`).join('')}
          <button class="awareness-opt" data-val="nothing"
            style="padding:11px 16px;border-radius:var(--r-md);
                   border:1.5px solid var(--border);
                   background:var(--surface);color:var(--text-dim);
                   font-size:0.88rem;cursor:pointer;text-align:left;
                   transition:all 0.2s;">
            Nothing — I didn't see anything pass
          </button>
        </div>
      </div>`;

    qa.querySelectorAll('.awareness-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        handleAwareness(btn.dataset.val === intruderEmoji);
      });
    });
  }

  function handleAwareness(noticed) {
    roundsPlayed++;
    if (trackingCorrect) roundsCorrect++;
    if (noticed) noticeCount++;
    updateScoreDisplay();
    showResults(noticed);
  }

  /* ══════════════════════════════════════════════════════════
     RESULTS
     ══════════════════════════════════════════════════════════ */
  function showResults(noticed) {
    phase = 'results';

    let insightMsg;
    if (trackingCorrect && !noticed) {
      insightMsg = `You tracked perfectly but missed the intruder. This is inattentional blindness — deep focus on one thing makes the brain literally invisible to other events. This is normal and trainable.`;
    } else if (trackingCorrect && noticed) {
      insightMsg = `You tracked correctly AND noticed the intruder. Excellent divided awareness — your attentional field is wide. This is the goal.`;
    } else if (!trackingCorrect && noticed) {
      insightMsg = `You noticed the intruder but lost your target. The novel object hijacked your attention — exactly what this exercise trains you to resist.`;
    } else {
      insightMsg = `You lost the target and missed the intruder. Focus harder on encoding during the highlight phase — the first seconds are the most important.`;
    }

    const qa = document.getElementById('question-area');
    qa.innerHTML = `
      <div style="background:var(--surface-2);border:1px solid var(--border);
                  border-radius:var(--r-lg);padding:20px 24px;">

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <span style="font-size:1.4rem;">${trackingCorrect ? '✅' : '❌'}</span>
          <p style="font-family:var(--font-display);font-weight:700;font-size:0.9rem;
                    color:${trackingCorrect ? 'var(--green)' : 'var(--orange)'};">
            ${trackingCorrect ? 'Tracking correct' : 'Wrong object selected'}
          </p>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <span style="font-size:1.4rem;">${noticed ? '👁' : '🙈'}</span>
          <div>
            <p style="font-family:var(--font-display);font-weight:700;
                      font-size:0.9rem;color:var(--text);">
              ${noticed ? 'You identified the intruder' : 'You missed the intruder'}
            </p>
            <p style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">
              It was: ${intruderEmoji}
            </p>
          </div>
        </div>

        <div style="background:rgba(0,229,255,0.05);border:1px solid var(--border);
                    border-radius:var(--r-md);padding:14px;margin-bottom:16px;">
          <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.7;">
            <strong style="color:var(--cyan);">🧠 What happened:</strong>
            ${insightMsg}
          </p>
        </div>

        <button class="btn btn-primary" id="next-round-btn">▶ Next Round</button>
      </div>`;

    document.getElementById('next-round-btn').addEventListener('click', startRound);
  }

  /* ══════════════════════════════════════════════════════════
     ANIMATION
     ══════════════════════════════════════════════════════════ */
  function animateBalls() {
    if (phase !== 'track') return;

    const cfg = CONFIGS[level];
    const W   = canvas.width;
    const H   = canvas.height;

    objects.forEach(o => {
      o.x += o.vx;
      o.y += o.vy;
      if (o.x - o.r < 0)  { o.x = o.r;     o.vx =  Math.abs(o.vx); }
      if (o.x + o.r > W)  { o.x = W - o.r; o.vx = -Math.abs(o.vx); }
      if (o.y - o.r < 0)  { o.y = o.r;     o.vy =  Math.abs(o.vy); }
      if (o.y + o.r > H)  { o.y = H - o.r; o.vy = -Math.abs(o.vy); }

      objects.forEach(other => {
        if (other === o) return;
        const d = Math.sqrt((o.x - other.x) ** 2 + (o.y - other.y) ** 2);
        if (d < o.r + other.r) {
          const angle = Math.atan2(other.y - o.y, other.x - o.x);
          o.vx = -Math.cos(angle) * cfg.speed;
          o.vy = -Math.sin(angle) * cfg.speed;
        }
      });
    });

    /* Move intruder on its own velocity vector */
    if (intruderVisible && intruder) {
      intruder.x += intruder.vx;
      intruder.y += intruder.vy;
      if (intruder.x < -120 || intruder.x > W+120 ||
          intruder.y < -120 || intruder.y > H+120) {
        intruderVisible = false;
      }
    }

    /* Move second intruder */
    if (intruder2Visible && intruder2) {
      intruder2.x += intruder2.vx;
      intruder2.y += intruder2.vy;
      if (intruder2.x < -120 || intruder2.x > W+120 ||
          intruder2.y < -120 || intruder2.y > H+120) {
        intruder2Visible = false;
      }
    }

    drawFrame();
    animId = requestAnimationFrame(animateBalls);
    NeuroPlex.addTimer(animId);
  }

  /* ══════════════════════════════════════════════════════════
     DRAWING
     ══════════════════════════════════════════════════════════ */
  function drawFrame() {
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, W, H);

    /* Intruders drawn FIRST = behind all objects */
    if (phase === 'track') {
      if (intruderVisible && intruder) {
        ctx.font         = '34px serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha  = 0.20;
        ctx.fillText(intruderEmoji, intruder.x, intruder.y);
        ctx.globalAlpha  = 1;
      }
      if (intruder2Visible && intruder2) {
        ctx.font         = '34px serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha  = 0.22;
        ctx.fillText(intruder2Emoji, intruder2.x, intruder2.y);
        ctx.globalAlpha  = 1;
      }
    }

    /* Objects */
    objects.forEach((o, i) => {
      const isTarget = targetIdx.includes(i);
      const isTapped = userTappedIndices.includes(o.idx);

      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      if (phase === 'highlight') {
        if (isTarget) {
          ctx.font        = `${o.r * 2.2}px serif`;
          ctx.shadowColor = 'rgba(0,229,255,0.8)';
          ctx.shadowBlur  = 22;
          ctx.globalAlpha = 1;
          ctx.fillText(o.emoji, o.x, o.y);
          ctx.shadowBlur  = 0;

          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r + 7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0,229,255,0.65)';
          ctx.lineWidth   = 2.5;
          ctx.stroke();

          ctx.fillStyle    = 'var(--cyan)';
          ctx.font         = '10px DM Sans, sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(
            CONFIGS[level].nTargets > 1 ? 'TRACK' : 'TARGET',
            o.x, o.y - o.r - 10
          );
          ctx.textBaseline = 'middle';
        } else {
          ctx.font        = `${o.r * 2.2}px serif`;
          ctx.globalAlpha = 0.28;
          ctx.fillText(o.emoji, o.x, o.y);
          ctx.globalAlpha = 1;
        }

      } else if (phase === 'track') {
        ctx.font        = `${o.r * 2.2}px serif`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(o.emoji, o.x, o.y);
        ctx.globalAlpha = 1;

      } else if (phase === 'recall') {
        ctx.font        = `${o.r * 2.2}px serif`;
        ctx.globalAlpha = 1;
        ctx.fillText(o.emoji, o.x, o.y);
        if (isTapped) {
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r + 7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0,229,255,0.7)';
          ctx.lineWidth   = 2.5;
          ctx.stroke();
        }

      } else if (phase === 'awareness' || phase === 'results') {
        ctx.font        = `${o.r * 2.2}px serif`;
        ctx.globalAlpha = (isTarget || isTapped) ? 1 : 0.18;
        ctx.fillText(o.emoji, o.x, o.y);
        ctx.globalAlpha = 1;

        if (isTapped) {
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r + 8, 0, Math.PI * 2);
          ctx.strokeStyle = trackingCorrect
            ? 'rgba(6,255,165,0.9)' : 'rgba(255,80,80,0.9)';
          ctx.lineWidth   = 3;
          ctx.shadowColor = trackingCorrect
            ? 'rgba(6,255,165,0.5)' : 'rgba(255,80,80,0.4)';
          ctx.shadowBlur  = 12;
          ctx.stroke();
          ctx.shadowBlur  = 0;
        }

        if (isTarget && !isTapped) {
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r + 7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(6,255,165,0.45)';
          ctx.lineWidth   = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */
  function setStatus(msg, color) {
    const el = document.getElementById('gor-status');
    if (el) { el.textContent = msg; el.style.color = color || 'var(--cyan)'; }
  }

  function clearQuestionArea() {
    const qa = document.getElementById('question-area');
    if (qa) qa.innerHTML = '';
  }

  function disableStartBtn() {
    const btn = document.getElementById('start-btn');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
  }

  function updateScoreDisplay() {
    const ts  = document.getElementById('track-score');
    const ns  = document.getElementById('notice-score');
    if (ts) ts.textContent = `${roundsCorrect}/${roundsPlayed}`;
    if (ns) ns.textContent = `${noticeCount}/${roundsPlayed}`;
    const btn = document.getElementById('start-btn');
    if (btn) { btn.disabled = false; btn.textContent = '▶ Start Round'; }
  }

  function resetAll() {
    clearTimeout(phaseTimer);
    cancelAnimationFrame(animId);
    phase             = 'idle';
    objects           = [];
    targetIdx         = [];
    userTappedIndices = [];
    roundsPlayed      = 0;
    roundsCorrect     = 0;
    noticeCount       = 0;
    updateScoreDisplay();
    clearQuestionArea();
    setStatus('Press Start Round to begin.', 'var(--text-muted)');
    const btn = document.getElementById('start-btn');
    if (btn) { btn.disabled = false; btn.textContent = '▶ Start Round'; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#04070f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  resize();
  ctx.fillStyle = '#04070f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

})();