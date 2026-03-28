/**
 * NeuroPlex — Stroop Challenge (v4)
 *
 * INTERACTIVE MODE — tap buttons, white text only, adaptive timing.
 *   Reaction time displays in stats bar, never next to buttons.
 *
 * VERBAL MODE — three variations, all optimized for neuroplastic change.
 *   Core principle: color is HIDDEN until highlighted.
 *   Brain cannot predict → interference is maximized → training effect peaks.
 *
 *   Single Word  — one color word at a time, timed intervals, you say the color.
 *   Sentence     — random color words (not prose), each word shown in gray,
 *                  one highlighted at a time with its ink color revealed.
 *   Paragraph    — real paragraph text (no color words), each word grayed,
 *                  highlighted one at a time with its color. Context creates
 *                  interference without semantic prediction.
 *
 * SPEED (from Stroop 1935 practice data):
 *   Beginner:      2500ms — ~1 word/sec, matches naive participants
 *   Intermediate:  1500ms — moderate practice level
 *   Advanced:       900ms — trained participant range
 *
 * Difficulty self-report adjusts speed after each session.
 *
 * Science basis:
 *   - Unpredictable color = maximum dimensional uncertainty = strongest interference
 *   - Verbal response activates full prefrontal-cerebellar conflict loop
 *   - 70-80% accuracy zone = optimal cortical adaptation
 *   - Practice reduces interference over days (Stroop 1935 Exp. 3)
 */

(function StroopExercise() {
  'use strict';

  /* ── Color sets by difficulty ────────────────────────────── */
  const COLOR_SETS = {
    easy:   ['RED', 'BLUE', 'GREEN', 'YELLOW'],
    medium: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE'],
    hard:   ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'TEAL']
  };

  const HEX = {
    RED: '#ff4444', BLUE: '#5599ff', GREEN: '#44dd88', YELLOW: '#ffdd44',
    ORANGE: '#ff8844', PURPLE: '#bb44ff', PINK: '#ff44aa', TEAL: '#44dddd'
  };

  /* ── Timing per difficulty (ms) — from Stroop 1935 data ──── */
  const TIMING = { easy: 2500, medium: 1500, hard: 900 };

  /* ── Sentence mode — random color words, NOT prose ───────── */
  /* These are just color words arranged randomly.
   * No grammatical meaning — brain cannot use context to predict. */
  const SENTENCE_POOLS = {
    easy:   [
      'RED BLUE GREEN YELLOW RED GREEN BLUE YELLOW GREEN RED',
      'BLUE RED YELLOW GREEN YELLOW BLUE RED GREEN BLUE RED',
      'GREEN YELLOW RED BLUE GREEN RED YELLOW BLUE GREEN YELLOW',
      'YELLOW GREEN BLUE RED YELLOW RED GREEN BLUE YELLOW RED'
    ],
    medium: [
      'RED BLUE GREEN ORANGE YELLOW PURPLE RED BLUE GREEN ORANGE YELLOW',
      'PURPLE ORANGE RED GREEN BLUE YELLOW ORANGE PURPLE GREEN RED BLUE',
      'BLUE YELLOW ORANGE PURPLE RED GREEN YELLOW BLUE ORANGE RED PURPLE',
      'GREEN RED PURPLE BLUE ORANGE YELLOW GREEN PURPLE RED BLUE ORANGE'
    ],
    hard: [
      'RED BLUE GREEN YELLOW ORANGE PURPLE PINK TEAL RED BLUE GREEN YELLOW',
      'TEAL PINK PURPLE ORANGE GREEN YELLOW BLUE RED TEAL PURPLE GREEN PINK',
      'ORANGE TEAL RED PINK PURPLE BLUE GREEN YELLOW ORANGE PINK TEAL RED',
      'PURPLE GREEN PINK TEAL YELLOW ORANGE RED BLUE PURPLE TEAL GREEN ORANGE'
    ]
  };

  /* ── Paragraph mode — real prose, no color words ─────────── */
  /* Real sentences so reading pathway is strongly activated,
   * but no color words so semantic prediction is impossible. */
  const PARAGRAPHS = [
    'The mind grows stronger through deliberate effort every single day. Focus on the process and results will follow naturally over time. Every challenge you face reshapes your neural pathways in measurable ways.',
    'Deliberate practice is the engine of all expert performance. It requires focused attention a specific goal and immediate honest feedback. Growth happens at the edge of competence not inside the comfort zone.',
    'Your brain adapts to whatever you repeatedly demand of it over time. Discomfort during training is the signal that growth is actively happening. Sustained attention is a skill that can be trained and systematically built.'
  ];

  /* ── State ───────────────────────────────────────────────── */
  let level         = 'easy';
  let mode          = 'interactive';
  let verbalVariant = 'single';

  /* Interactive */
  let score = 0, total = 0, streak = 0;
  let answered = false, wordStartTime = 0;
  let reactionTimes = [], adaptiveDelayMs = 0, pressureTimer = null;

  /* Verbal */
  let verbalRunning = false, verbalWordCount = 0, verbalTimerId = null;
  const VERBAL_TOTAL = 20;

  /* Sentence / Paragraph shared */
  let seqWords = [], seqColors = [], seqIdx = 0, seqTimerId = null;

  /* ── DOM ─────────────────────────────────────────────────── */
  const wordEl    = document.getElementById('stroop-word');
  const choicesEl = document.getElementById('stroop-choices');
  const scoreEl   = document.getElementById('score-display');
  const resetBtn  = document.getElementById('reset-btn');

  /* ── Difficulty buttons ──────────────────────────────────── */
  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level = btn.dataset.level;
      reset();
    });
  });

  resetBtn.addEventListener('click', reset);

  /* ══════════════════════════════════════════════════════════
     MODE + VARIANT SWITCHER
     ══════════════════════════════════════════════════════════ */
  const exerciseFrame = document.querySelector('.exercise-frame');
  if (exerciseFrame) {
    const switcher = document.createElement('div');
    switcher.style.cssText = 'margin-bottom:20px;';
    switcher.innerHTML = `
      <p class="info-block-label">Training Mode</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <button class="diff-btn active" id="mode-interactive">👆 Interactive</button>
        <button class="diff-btn" id="mode-verbal">🗣 Verbal</button>
      </div>
      <div id="verbal-variants" style="display:none;margin-bottom:12px;">
        <p class="info-block-label" style="margin-bottom:8px;">Verbal Variation</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="diff-btn active" data-variant="single">Single Word</button>
          <button class="diff-btn" data-variant="sentence">Sentence</button>
          <button class="diff-btn" data-variant="paragraph">Paragraph</button>
        </div>
      </div>
      <div id="mode-desc"
           style="padding:12px 16px;background:rgba(0,229,255,0.04);
                  border:1px solid var(--border);border-radius:var(--r-md);
                  font-size:0.8rem;color:var(--text-dim);line-height:1.7;"></div>`;

    exerciseFrame.insertAdjacentElement('beforebegin', switcher);

    document.getElementById('mode-interactive').addEventListener('click', () => {
      mode = 'interactive';
      document.getElementById('mode-interactive').classList.add('active');
      document.getElementById('mode-verbal').classList.remove('active');
      document.getElementById('verbal-variants').style.display = 'none';
      updateDesc(); reset();
    });

    document.getElementById('mode-verbal').addEventListener('click', () => {
      mode = 'verbal';
      document.getElementById('mode-verbal').classList.add('active');
      document.getElementById('mode-interactive').classList.remove('active');
      document.getElementById('verbal-variants').style.display = 'block';
      updateDesc(); reset();
    });

    switcher.querySelectorAll('[data-variant]').forEach(btn => {
      btn.addEventListener('click', () => {
        switcher.querySelectorAll('[data-variant]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        verbalVariant = btn.dataset.variant;
        updateDesc(); reset();
      });
    });

    updateDesc();
  }

  function updateDesc() {
    const el = document.getElementById('mode-desc');
    if (!el) return;
    const t = (TIMING[level] / 1000).toFixed(1);
    if (mode === 'interactive') {
      el.innerHTML = `<strong style="color:var(--cyan);">Interactive:</strong>
        Tap the INK COLOR of each word. Buttons are white — no color shortcut.
        Reaction time and streak tracked. Speed pressure increases as you improve.`;
    } else if (verbalVariant === 'single') {
      el.innerHTML = `<strong style="color:var(--green);">Single Word — Verbal:</strong>
        One word appears every <strong>${t}s</strong> in a random ink color.
        Say the ink color aloud before it disappears.
        Do not touch the screen. After ${VERBAL_TOTAL} words, self-report difficulty.`;
    } else if (verbalVariant === 'sentence') {
      el.innerHTML = `<strong style="color:var(--green);">Sentence — Verbal:</strong>
        A row of color words appears. All are gray — no color shown yet.
        One highlights at a time every <strong>${t}s</strong>, revealing its ink color.
        Say that ink color aloud. Brain cannot predict — maximum interference.`;
    } else {
      el.innerHTML = `<strong style="color:var(--green);">Paragraph — Verbal:</strong>
        A real paragraph appears — no color words, so no semantic prediction.
        All words are gray. One highlights at a time every <strong>${t}s</strong>.
        Say that word's ink color aloud. Surrounding text activates reading — resisting it is the training.`;
    }
  }

  /* ══════════════════════════════════════════════════════════
     RESET
     ══════════════════════════════════════════════════════════ */
  function reset() {
    clearTimeout(pressureTimer);
    clearTimeout(verbalTimerId);
    clearTimeout(seqTimerId);
    verbalRunning = false; verbalWordCount = 0;
    seqWords = []; seqColors = []; seqIdx = 0;
    score = 0; total = 0; streak = 0;
    answered = false; adaptiveDelayMs = 0; reactionTimes = [];
    scoreEl.textContent = '';
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';

    if (mode === 'interactive')         newInteractiveRound();
    else if (verbalVariant === 'single')   renderSingleIdle();
    else if (verbalVariant === 'sentence') renderSentenceIdle();
    else                                   renderParagraphIdle();
  }

  /* ══════════════════════════════════════════════════════════
     INTERACTIVE MODE
     ══════════════════════════════════════════════════════════ */
  function newInteractiveRound() {
    answered = false; wordStartTime = performance.now();
    clearTimeout(pressureTimer);

    const colors = COLOR_SETS[level];
    let w, c;
    w = colors[Math.floor(Math.random() * colors.length)];
    do { c = colors[Math.floor(Math.random() * colors.length)]; } while (c === w);

    wordEl.textContent = w;
    wordEl.style.color = HEX[c];
    choicesEl.innerHTML = '';

    const pool    = [...colors].filter(x => x !== c);
    NeuroPlex.shuffle(pool);
    const choices = NeuroPlex.shuffle([c, ...pool.slice(0, 3)]);

    choices.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'stroop-opt';
      btn.textContent = color;
      btn.style.color = '#e8f4f8';  /* White — no color shortcut */
      btn.style.fontWeight = '600';
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        clearTimeout(pressureTimer);
        total++;
        const rt      = Math.round(performance.now() - wordStartTime);
        const correct = color === c;

        if (correct) {
          score++; streak++;
          reactionTimes.push(rt);
          btn.classList.add('correct');
          if (streak >= 3) {
            adaptiveDelayMs = adaptiveDelayMs === 0
              ? 4000 : Math.max(1200, adaptiveDelayMs - 200);
          }
        } else {
          streak = 0;
          if (adaptiveDelayMs > 0)
            adaptiveDelayMs = Math.min(adaptiveDelayMs + 400, 6000);
          btn.classList.add('wrong');
          choicesEl.querySelectorAll('.stroop-opt').forEach(b => {
            if (b.textContent === c) b.classList.add('correct');
          });
        }

        /* Reaction time goes to stats bar — NOT next to buttons */
        updateInteractiveStats(rt, correct);
        setTimeout(newInteractiveRound, 700);
      });
      choicesEl.appendChild(btn);
    });

    /* Adaptive time pressure */
    if (adaptiveDelayMs > 0) {
      pressureTimer = setTimeout(() => {
        if (!answered) {
          answered = true; total++; streak = 0;
          adaptiveDelayMs = Math.min(adaptiveDelayMs + 400, 6000);
          updateInteractiveStats(null, false);
          setTimeout(newInteractiveRound, 400);
        }
      }, adaptiveDelayMs);
    }
  }

  function updateInteractiveStats(rt, correct) {
    const acc   = total > 0 ? Math.round((score / total) * 100) : 0;
    const avgRt = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a,b)=>a+b,0) / reactionTimes.length)
      : 0;

    let s = `${score}/${total}`;
    if (total >= 3)  s += ` · ${acc}%`;
    if (avgRt > 0)   s += ` · ${avgRt}ms avg`;
    if (adaptiveDelayMs > 0) s += ` · ${(adaptiveDelayMs/1000).toFixed(1)}s limit`;
    scoreEl.textContent = s;
  }

  /* ══════════════════════════════════════════════════════════
     VERBAL — SINGLE WORD
     ══════════════════════════════════════════════════════════ */
  function renderSingleIdle() {
    const t = (TIMING[level] / 1000).toFixed(1);
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = '';
    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-size:0.85rem;color:var(--text-dim);line-height:1.7;
                  margin-bottom:20px;max-width:360px;margin-left:auto;margin-right:auto;">
          A color word appears every
          <strong style="color:var(--cyan);">${t} seconds</strong>
          in a random ink color.<br>
          Say the <strong style="color:var(--text);">ink color</strong> aloud.
          Do not touch the screen.
        </p>
        <button class="btn btn-primary" id="single-start">▶ Start</button>
      </div>`;
    document.getElementById('single-start').addEventListener('click', startSingle);
  }

  function startSingle() {
    verbalRunning = true; verbalWordCount = 0;
    choicesEl.innerHTML = '';
    showNextSingleWord();
  }

  function showNextSingleWord() {
    if (!verbalRunning) return;
    if (verbalWordCount >= VERBAL_TOTAL) { endSingle(); return; }

    const colors = COLOR_SETS[level];
    let w, c;
    w = colors[Math.floor(Math.random() * colors.length)];
    do { c = colors[Math.floor(Math.random() * colors.length)]; } while (c === w);

    wordEl.textContent = w;
    wordEl.style.color = HEX[c];
    scoreEl.textContent = `${verbalWordCount + 1} / ${VERBAL_TOTAL}`;
    verbalWordCount++;

    verbalTimerId = setTimeout(showNextSingleWord, TIMING[level]);
    NeuroPlex.addTimer(verbalTimerId);
  }

  function endSingle() {
    verbalRunning = false;
    wordEl.textContent  = '';
    scoreEl.textContent = '';
    showDifficultyQuestion(renderSingleIdle);
  }

  /* ══════════════════════════════════════════════════════════
     VERBAL — SENTENCE MODE
     Random color words — no prose, no grammar, no prediction.
     All words shown in gray. One highlighted at a time.
     Color only revealed on highlight.
     ══════════════════════════════════════════════════════════ */
  function renderSentenceIdle() {
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = '';
    const t = (TIMING[level] / 1000).toFixed(1);

    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-size:0.85rem;color:var(--text-dim);line-height:1.7;
                  margin-bottom:20px;max-width:380px;margin-left:auto;margin-right:auto;">
          A row of color words appears — all gray at first.
          One highlights every <strong style="color:var(--cyan);">${t}s</strong>,
          revealing its ink color. Say that ink color aloud.
          The color is only shown when highlighted — your brain cannot predict it.
        </p>
        <button class="btn btn-primary" id="sentence-start">▶ Start</button>
      </div>`;
    document.getElementById('sentence-start').addEventListener('click', startSentence);
  }

  function startSentence() {
    const pool     = SENTENCE_POOLS[level];
    const sentence = pool[Math.floor(Math.random() * pool.length)];
    seqWords  = sentence.split(' ');
    seqColors = seqWords.map(w => {
      const colors = COLOR_SETS[level];
      let c;
      /* Ink color must differ from the word itself */
      do { c = colors[Math.floor(Math.random() * colors.length)]; } while (c === w);
      return c;
    });
    seqIdx = 0;

    wordEl.textContent = '';
    wordEl.style.color = 'var(--text)';

    renderSentenceFrame();
    highlightSeqWord();
  }

  function renderSentenceFrame() {
    /*
     * All words rendered in gray initially.
     * Color is NOT shown until the word is highlighted.
     * This is the key — brain cannot pre-activate the color response.
     */
    const wordSpans = seqWords.map((w, i) =>
      `<span id="sw-${i}"
        style="color:var(--text-muted);opacity:0.35;
               font-family:var(--font-display);font-weight:700;
               font-size:1.3rem;margin:0 4px;
               transition:color 0.1s, opacity 0.1s, font-size 0.1s;">
        ${w}
      </span>`
    ).join(' ');

    choicesEl.innerHTML = `
      <div style="width:100%;">
        <div id="sentence-display"
             style="line-height:2.4;text-align:center;
                    padding:16px;background:var(--bg);
                    border-radius:var(--r-md);border:1px solid var(--border);
                    margin-bottom:16px;flex-wrap:wrap;">
          ${wordSpans}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-secondary btn-sm" id="sentence-stop">Done</button>
        </div>
      </div>`;

    document.getElementById('sentence-stop').addEventListener('click', () => {
      clearTimeout(seqTimerId);
      showDifficultyQuestion(renderSentenceIdle);
    });
  }

  function highlightSeqWord() {
    if (seqIdx >= seqWords.length) {
      clearTimeout(seqTimerId);
      showDifficultyQuestion(renderSentenceIdle);
      return;
    }

    /* Gray out all, then reveal color only on highlighted word */
    seqWords.forEach((_, i) => {
      const span = document.getElementById(`sw-${i}`);
      if (!span) return;
      if (i === seqIdx) {
        span.style.color    = HEX[seqColors[i]];  /* Color revealed HERE only */
        span.style.opacity  = '1';
        span.style.fontSize = '1.5rem';
      } else {
        span.style.color    = 'var(--text-muted)';  /* Back to gray */
        span.style.opacity  = '0.3';
        span.style.fontSize = '1.3rem';
      }
    });

    scoreEl.textContent = `${seqIdx + 1} / ${seqWords.length}`;
    seqIdx++;

    seqTimerId = setTimeout(highlightSeqWord, TIMING[level]);
    NeuroPlex.addTimer(seqTimerId);
  }

  /* ══════════════════════════════════════════════════════════
     VERBAL — PARAGRAPH MODE
     Real prose (no color words) — reading pathway activated.
     All words gray until highlighted. Color revealed only then.
     ══════════════════════════════════════════════════════════ */
  function renderParagraphIdle() {
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = '';
    const t = (TIMING[level] / 1000).toFixed(1);

    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-size:0.85rem;color:var(--text-dim);line-height:1.7;
                  margin-bottom:20px;max-width:380px;margin-left:auto;margin-right:auto;">
          A paragraph appears — all words gray at first.
          One word highlights every <strong style="color:var(--cyan);">${t}s</strong>,
          revealing its random ink color. Say that color aloud.
          The paragraph is real prose so your reading pathway is fully active —
          suppressing it to name colors is the training.
        </p>
        <button class="btn btn-primary" id="para-start">▶ Start</button>
      </div>`;
    document.getElementById('para-start').addEventListener('click', startParagraph);
  }

  function startParagraph() {
    const text = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
    seqWords   = text.split(' ');
    seqColors  = seqWords.map(() => {
      const colors = COLOR_SETS[level];
      return colors[Math.floor(Math.random() * colors.length)];
    });
    seqIdx = 0;

    wordEl.textContent = '';
    wordEl.style.color = 'var(--text)';

    renderParagraphFrame();
    highlightParaWord();
  }

  function renderParagraphFrame() {
    const wordSpans = seqWords.map((w, i) =>
      `<span id="pw-${i}"
        style="color:var(--text-muted);opacity:0.25;
               font-family:var(--font-display);font-size:1.05rem;
               font-weight:600;margin:0 3px;
               transition:color 0.1s, opacity 0.1s, font-size 0.1s;">
        ${w}
      </span>`
    ).join(' ');

    choicesEl.innerHTML = `
      <div style="width:100%;">
        <div id="para-display"
             style="line-height:2.1;padding:16px;background:var(--bg);
                    border-radius:var(--r-md);border:1px solid var(--border);
                    margin-bottom:14px;">
          ${wordSpans}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-secondary btn-sm" id="para-stop">Done</button>
        </div>
      </div>`;

    document.getElementById('para-stop').addEventListener('click', () => {
      clearTimeout(seqTimerId);
      showDifficultyQuestion(renderParagraphIdle);
    });
  }

  function highlightParaWord() {
    if (seqIdx >= seqWords.length) {
      clearTimeout(seqTimerId);
      showDifficultyQuestion(renderParagraphIdle);
      return;
    }

    seqWords.forEach((_, i) => {
      const span = document.getElementById(`pw-${i}`);
      if (!span) return;
      if (i === seqIdx) {
        span.style.color       = HEX[seqColors[i]];  /* Color revealed only here */
        span.style.opacity     = '1';
        span.style.fontSize    = '1.2rem';
        span.style.textShadow  = `0 0 10px ${HEX[seqColors[i]]}`;
        span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        span.style.color      = 'var(--text-muted)';  /* Gray — no color */
        span.style.opacity    = '0.22';
        span.style.fontSize   = '1.05rem';
        span.style.textShadow = 'none';
      }
    });

    scoreEl.textContent = `${seqIdx + 1} / ${seqWords.length}`;
    seqIdx++;

    seqTimerId = setTimeout(highlightParaWord, TIMING[level]);
    NeuroPlex.addTimer(seqTimerId);
  }

  /* ══════════════════════════════════════════════════════════
     SHARED — DIFFICULTY SELF-REPORT
     Appears after every verbal session.
     Adjusts speed level. No fake scoring.
     ══════════════════════════════════════════════════════════ */
  function showDifficultyQuestion(idleFn) {
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = '';

    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-family:var(--font-display);font-weight:700;
                  font-size:1rem;color:var(--text);margin-bottom:6px;">
          Session complete.
        </p>
        <p style="font-size:0.85rem;color:var(--text-dim);
                  margin-bottom:20px;line-height:1.65;">
          How was the speed?
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-secondary" id="felt-easy">Too slow</button>
          <button class="btn btn-ghost"     id="felt-right">Just right</button>
          <button class="btn btn-secondary" id="felt-hard">Too fast</button>
        </div>
      </div>`;

    const levels = ['easy', 'medium', 'hard'];

    document.getElementById('felt-easy').addEventListener('click', () => {
      const i = levels.indexOf(level);
      if (i < levels.length - 1) setLevel(levels[i + 1]);
      updateDesc(); idleFn();
    });

    document.getElementById('felt-right').addEventListener('click', () => {
      idleFn();
    });

    document.getElementById('felt-hard').addEventListener('click', () => {
      const i = levels.indexOf(level);
      if (i > 0) setLevel(levels[i - 1]);
      updateDesc(); idleFn();
    });
  }

  function setLevel(newLevel) {
    level = newLevel;
    document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
      b.classList.toggle('active', b.dataset.level === level);
      b.setAttribute('aria-pressed', String(b.dataset.level === level));
    });
  }

  /* ── Boot ────────────────────────────────────────────────── */
  newInteractiveRound();

})();