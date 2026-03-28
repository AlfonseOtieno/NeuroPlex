/**
 * NeuroPlex — Reverse Recall (v2)
 *
 * Based on the validated Backward Digit Span (BDS) paradigm.
 *
 * Protocol (evidence-based):
 *  1. REVEAL    — items appear one at a time at 1000ms intervals
 *  2. HOLD      — all items visible briefly (retention window)
 *  3. HIDE      — items return to question marks — no cheat code
 *  4. INPUT     — user enters sequence in REVERSE order
 *  5. FEEDBACK  — correct/wrong shown per slot after full input
 *  6. ADAPTIVE  — correct = reduce exposure time next round
 *                 wrong   = increase exposure time next round
 *
 * Item types: Numbers → Letters → Words (increasing difficulty)
 * Difficulty = sequence length + exposure window duration
 *
 * Science:
 *  - Backward span training improves interference control more
 *    than forward span (Li et al., 2022, RCT)
 *  - 1000ms per item = validated clinical presentation rate
 *  - Hiding after reveal forces genuine WM encoding (not reading)
 *  - Adaptive exposure targets the 70-80% accuracy zone
 */

(function ReverseRecallExercise() {
  'use strict';

  /* ── Populate metadata ───────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'reverse-recall');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML =
      act.chips.map(c => `<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML =
      act.benefits.map(b => `<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML =
      act.instructions.map(i => `<li>${i}</li>`).join('');
  }

  /* ── Item pools ──────────────────────────────────────────── */
  const POOLS = {
    numbers: ['0','1','2','3','4','5','6','7','8','9'],
    letters: ['A','B','C','D','E','F','G','H','J','K',
              'L','M','N','P','R','S','T','U','V','W'],
    words:   ['CAT','RUN','SKY','MAP','FIRE','JUMP','COLD',
              'DEEP','FAST','SOFT','GLOW','BOLD','PUSH','GRIP']
  };

  /* ── Difficulty configs ──────────────────────────────────── */
  /*
   * seqLen      — number of items in sequence
   * holdMs      — how long full sequence stays visible before hiding
   * revealMs    — ms between each item reveal (1000 = clinical standard)
   * itemType    — what kind of items to use
   */
  const CONFIGS = {
    easy:   { seqLen: 4, holdMs: 2000, revealMs: 1000, itemType: 'numbers' },
    medium: { seqLen: 6, holdMs: 1500, revealMs: 1000, itemType: 'letters' },
    hard:   { seqLen: 8, holdMs: 1000, revealMs: 1000, itemType: 'words'   }
  };

  /* ── Adaptive hold window bounds ─────────────────────────── */
  const HOLD_MIN = 600;    // ms — minimum exposure after reveal
  const HOLD_MAX = 5000;   // ms — maximum exposure
  const HOLD_STEP = 300;   // ms — adjustment per round

  /* ── State ───────────────────────────────────────────────── */
  let level       = 'easy';
  let cfg         = CONFIGS[level];
  let holdMs      = cfg.holdMs;  // adaptive — changes each round
  let seq         = [];          // the sequence shown
  let reversed    = [];          // correct answer
  let userInput   = [];          // what user typed
  let phase       = 'idle';
  let roundsPlayed  = 0;
  let roundsCorrect = 0;

  /* ── DOM ─────────────────────────────────────────────────── */
  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `
    <button class="btn btn-primary btn-sm" id="go-btn">▶ Start Round</button>`;
  document.getElementById('go-btn').addEventListener('click', newRound);

  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level  = btn.dataset.level;
      cfg    = CONFIGS[level];
      holdMs = cfg.holdMs;
      roundsPlayed = 0; roundsCorrect = 0;
      renderIdle();
    });
  });

  /* ══════════════════════════════════════════════════════════
     ROUND FLOW
     ══════════════════════════════════════════════════════════ */
  function newRound() {
    cfg      = CONFIGS[level];
    userInput = [];
    phase    = 'reveal';

    /* Build sequence — no repeated consecutive items */
    const pool = POOLS[cfg.itemType];
    seq = [];
    for (let i = 0; i < cfg.seqLen; i++) {
      let item;
      do { item = pool[Math.floor(Math.random() * pool.length)]; }
      while (item === seq[seq.length - 1]);
      seq.push(item);
    }
    reversed = [...seq].reverse();

    renderReveal();
  }

  /* ── Phase 1: REVEAL — items appear one by one ───────────── */
  function renderReveal() {
    exBody.innerHTML = `
      <div style="text-align:center;">
        <p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:14px;">
          Memorize this sequence:
        </p>
        <div class="recall-sequence-row" id="seq-row">
          ${seq.map((_, i) =>
            `<div class="recall-box" id="rb-${i}">?</div>`
          ).join('')}
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:10px;"
           id="reveal-status">
          Revealing…
        </p>
      </div>`;

    let i = 0;
    const revealId = setInterval(() => {
      const box = document.getElementById(`rb-${i}`);
      if (box) {
        box.textContent = seq[i];
        box.classList.add('revealed');
      }
      i++;

      if (i >= seq.length) {
        clearInterval(revealId);
        /* All revealed — start hold window */
        const statusEl = document.getElementById('reveal-status');
        if (statusEl) statusEl.textContent = 'Memorize — hiding soon…';
        phase = 'hold';

        const holdId = setTimeout(() => {
          hideSequence();
        }, holdMs);
        NeuroPlex.addTimer(holdId);
      }
    }, cfg.revealMs);
    NeuroPlex.addTimer(revealId);
  }

  /* ── Phase 2: HIDE — sequence goes back to question marks ── */
  function hideSequence() {
    phase = 'input';

    /* Hide all items — return to ? */
    seq.forEach((_, i) => {
      const box = document.getElementById(`rb-${i}`);
      if (box) {
        box.textContent = '?';
        box.classList.remove('revealed');
        box.style.opacity = '0.35';
      }
    });

    const statusEl = document.getElementById('reveal-status');
    if (statusEl) {
      statusEl.textContent = `Now enter in REVERSE order`;
      statusEl.style.color = 'var(--cyan)';
    }

    renderInputArea();
  }

  /* ── Phase 3: INPUT ─────────────────────────────────────── */
  function renderInputArea() {
    /*
     * Input area appended below the hidden sequence.
     * User types the reversed sequence using the numpad/letterpad.
     * Slots fill one by one. No feedback shown until complete.
     */
    const inputSection = document.createElement('div');
    inputSection.id = 'input-section';
    inputSection.innerHTML = `
      <div style="margin-top:20px;text-align:center;">

        <!-- Input slots -->
        <div class="recall-input-row" id="input-row">
          ${reversed.map((_, i) =>
            `<div class="recall-input-box" id="ib-${i}">_</div>`
          ).join('')}
        </div>

        <!-- Pad -->
        <div id="input-pad" style="margin-top:16px;"></div>

        <!-- Feedback -->
        <p class="recall-feedback" id="feedback"
           style="margin-top:12px;min-height:22px;" aria-live="polite"></p>

        <div style="text-align:center;margin-top:12px;">
          <button class="btn btn-ghost btn-sm" id="new-round-btn">↺ New Round</button>
        </div>
      </div>`;

    exBody.appendChild(inputSection);
    renderPad();

    document.getElementById('new-round-btn').addEventListener('click', newRound);
  }

  /* ── Build input pad based on item type ─────────────────── */
  /*
   * Numbers → digit buttons 0-9
   * Letters → letter buttons A-W (only letters used in pool)
   * Words   → word buttons from pool (user selects full word)
   */
  function renderPad() {
    const pad = document.getElementById('input-pad');
    if (!pad) return;

    const pool = POOLS[cfg.itemType];

    if (cfg.itemType === 'numbers') {
      pad.innerHTML = `
        <div class="numpad">
          ${[1,2,3,4,5,6,7,8,9,0].map(d =>
            `<button class="numpad-btn" data-val="${d}">${d}</button>`
          ).join('')}
          <button class="numpad-btn del-btn" id="del-btn">⌫</button>
        </div>`;
    } else {
      /* Letters or words — display as grid */
      const btnSize = cfg.itemType === 'words' ? '56px' : '44px';
      const fontSize = cfg.itemType === 'words' ? '0.7rem' : '0.95rem';
      pad.innerHTML = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;
                    justify-content:center;max-width:340px;margin:0 auto;">
          ${pool.map(val =>
            `<button class="numpad-btn" data-val="${val}"
              style="width:${btnSize};font-size:${fontSize};
                     padding:4px 2px;">${val}</button>`
          ).join('')}
          <button class="numpad-btn del-btn" id="del-btn"
            style="width:${btnSize};">⌫</button>
        </div>`;
    }

    pad.querySelectorAll('.numpad-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', () => inputItem(btn.dataset.val));
    });
    document.getElementById('del-btn').addEventListener('click', deleteItem);
  }

  /* ── Input handling ──────────────────────────────────────── */
  function inputItem(val) {
    if (phase !== 'input') return;
    if (userInput.length >= reversed.length) return;

    userInput.push(val);
    const box = document.getElementById(`ib-${userInput.length - 1}`);
    if (box) box.textContent = val;

    /* Check complete */
    if (userInput.length === reversed.length) {
      checkAnswer();
    }
  }

  function deleteItem() {
    if (phase !== 'input' || !userInput.length) return;
    const i = userInput.length - 1;
    userInput.pop();
    const box = document.getElementById(`ib-${i}`);
    if (box) { box.textContent = '_'; box.style.borderColor = ''; }
    const fb = document.getElementById('feedback');
    if (fb) fb.textContent = '';
  }

  /* ── Check and show results ──────────────────────────────── */
  function checkAnswer() {
    phase = 'result';
    roundsPlayed++;

    const allCorrect = reversed.every((v, i) => v === userInput[i]);
    if (allCorrect) roundsCorrect++;

    /* Color each input slot — green correct, red wrong */
    reversed.forEach((v, i) => {
      const box = document.getElementById(`ib-${i}`);
      if (!box) return;
      if (userInput[i] === v) {
        box.style.borderColor    = 'var(--green)';
        box.style.background     = 'rgba(6,255,165,0.1)';
        box.style.color          = 'var(--green)';
      } else {
        box.style.borderColor    = 'rgba(255,80,80,0.6)';
        box.style.background     = 'rgba(255,80,80,0.07)';
        box.style.color          = 'var(--orange)';
      }
    });

    /* Show what the correct answer was */
    const fb = document.getElementById('feedback');
    if (fb) {
      if (allCorrect) {
        fb.innerHTML = `<span style="color:var(--green);">
          ✓ Correct — working memory engaged perfectly.</span>`;
      } else {
        const correctStr = reversed.join(' → ');
        fb.innerHTML = `
          <span style="color:var(--orange);">Not quite.</span>
          <span style="color:var(--text-muted);font-size:0.78rem;display:block;margin-top:4px;">
            Correct: <strong style="color:var(--text);">${correctStr}</strong>
          </span>`;
      }
    }

    /* Adaptive: adjust hold window for next round */
    if (allCorrect) {
      holdMs = Math.max(HOLD_MIN, holdMs - HOLD_STEP);
    } else {
      holdMs = Math.min(HOLD_MAX, holdMs + HOLD_STEP);
    }

    /* Update stats in ctrl row */
    updateStats();

    /* Reveal the original sequence so user can study their mistake */
    seq.forEach((item, i) => {
      const box = document.getElementById(`rb-${i}`);
      if (box) {
        box.textContent = item;
        box.style.opacity = '0.6';
        box.classList.add('revealed');
      }
    });
    const statusEl = document.getElementById('reveal-status');
    if (statusEl) statusEl.textContent = 'Original sequence:';
  }

  /* ── Update stats display ────────────────────────────────── */
  function updateStats() {
    const btn = document.getElementById('go-btn');
    if (btn) btn.textContent = '▶ Start Round';

    const acc = roundsPlayed > 0
      ? Math.round((roundsCorrect / roundsPlayed) * 100)
      : 0;

    /* Show adaptive hold time so user understands the system */
    const holdSec = (holdMs / 1000).toFixed(1);
    const statsEl = document.getElementById('round-stats');
    if (statsEl) {
      statsEl.textContent =
        `${roundsCorrect}/${roundsPlayed} correct · ${acc}% · hold: ${holdSec}s`;
    } else {
      const s = document.createElement('span');
      s.id = 'round-stats';
      s.style.cssText = 'font-size:0.78rem;color:var(--text-muted);margin-left:8px;';
      s.textContent =
        `${roundsCorrect}/${roundsPlayed} correct · ${acc}% · hold: ${holdSec}s`;
      ctrlRow.appendChild(s);
    }
  }

  /* ── Idle screen ─────────────────────────────────────────── */
  function renderIdle() {
    phase = 'idle';
    exBody.innerHTML = `
      <div style="text-align:center;padding:28px 0;">
        <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:8px;">
          Select difficulty, then press Start Round.
        </p>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:20px;line-height:1.65;">
          Sequence reveals item by item → hold window → hidden →
          enter in reverse order.
        </p>
        <button class="btn btn-primary" id="idle-start">▶ Start Round</button>
      </div>`;
    document.getElementById('idle-start').addEventListener('click', newRound);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  renderIdle();

})();