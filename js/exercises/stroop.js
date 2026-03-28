/**
 * NeuroPlex — Stroop Challenge (v3)
 *
 * TWO MODES:
 *
 * INTERACTIVE — tap buttons, get feedback, adaptive timing.
 *   Fix: reaction time moves to stats bar, not next to buttons.
 *
 * VERBAL — the real neuroplastic exercise. Three variations:
 *
 *   1. Single Word  — words appear one at a time at timed intervals.
 *      You say the ink color aloud. No interaction needed.
 *      After 20 words, one question: "Was it easy or hard?"
 *      That answer adjusts speed for the next session.
 *      Based on original 1935 Stroop serial protocol.
 *
 *   2. Sentence     — a full sentence appears, each word in a random
 *      ink color. You read it aloud naming each ink color, not the word.
 *      Sentence meaning adds extra interference — higher cognitive load.
 *
 *   3. Paragraph    — a paragraph is displayed with all words visible.
 *      One word gets highlighted at a time. You name its ink color.
 *      Sustained inhibition training — the hardest variation.
 *
 * TIMING (from research):
 *   Beginner:      3000ms per word
 *   Intermediate:  2000ms per word (validated research standard)
 *   Advanced:      1200ms per word
 *
 * The exercise IS the conflict. No engagement tricks.
 * No scoring in verbal mode. No reveal buttons.
 * The feedback is hearing yourself say the correct color.
 */

(function StroopExercise() {
  'use strict';

  /* ── Color sets ──────────────────────────────────────────── */
  const COLOR_SETS = {
    easy:   ['RED', 'BLUE', 'GREEN', 'YELLOW'],
    medium: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE'],
    hard:   ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'TEAL']
  };

  const HEX = {
    RED:    '#ff4444', BLUE:   '#5599ff',
    GREEN:  '#44dd88', YELLOW: '#ffdd44',
    ORANGE: '#ff8844', PURPLE: '#bb44ff',
    PINK:   '#ff44aa', TEAL:   '#44dddd'
  };

  /* ── Sentence pool for sentence mode ─────────────────────── */
  const SENTENCES = [
    'The mind grows stronger through deliberate effort every day',
    'Focus on the process and results will follow naturally',
    'Every challenge you face reshapes your neural pathways',
    'Attention is the foundation of all cognitive performance',
    'Deliberate practice builds the brain you want to have',
    'Your brain adapts to whatever you repeatedly demand of it',
    'Discomfort in training is the signal that growth is happening',
    'Sustained attention is a skill that can be trained and built'
  ];

  /* ── Paragraph pool for paragraph mode ───────────────────── */
  const PARAGRAPHS = [
    'The brain is not static. It is a living dynamic organ that reshapes itself in response to experience and deliberate practice. Every challenge you undertake carves new grooves into your neural architecture. The connections you use grow stronger. The ones you neglect fade away.',
    'Deliberate practice is the engine of all expert performance. It is not the same as simply doing something repeatedly. It requires focused attention, a specific goal, and immediate feedback. Growth happens at the edge of competence, not inside the comfort zone.',
    'Neuroplasticity is the capacity of neurons and neural networks in the brain to change their connections in response to new information, sensory stimulation, and repeated practice. Every skill you build makes a physical change in your brain.'
  ];

  /* ── Verbal timing by difficulty (ms per word, from research) */
  const VERBAL_TIMING = { easy: 3000, medium: 2000, hard: 1200 };

  /* ── State ───────────────────────────────────────────────── */
  let level            = 'easy';
  let mode             = 'interactive';
  let verbalVariant    = 'single';   // 'single' | 'sentence' | 'paragraph'

  /* Interactive state */
  let score            = 0;
  let total            = 0;
  let streak           = 0;
  let answered         = false;
  let wordStartTime    = 0;
  let reactionTimes    = [];
  let adaptiveDelayMs  = 0;
  let pressureTimer    = null;

  /* Verbal single-word state */
  let verbalRunning    = false;
  let verbalWordCount  = 0;
  let verbalTimerId    = null;
  const VERBAL_TOTAL   = 20;

  /* Verbal paragraph state */
  let paraWords        = [];
  let paraColors       = [];
  let paraIdx          = 0;
  let paraTimerId      = null;

  /* ── DOM ─────────────────────────────────────────────────── */
  const wordEl    = document.getElementById('stroop-word');
  const choicesEl = document.getElementById('stroop-choices');
  const scoreEl   = document.getElementById('score-display');
  const resetBtn  = document.getElementById('reset-btn');

  /* ── Difficulty ──────────────────────────────────────────── */
  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
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
        <button class="diff-btn active" id="mode-interactive">
          👆 Interactive
        </button>
        <button class="diff-btn" id="mode-verbal">
          🗣 Verbal
        </button>
      </div>

      <div id="verbal-variants"
           style="display:none;margin-bottom:12px;">
        <p class="info-block-label" style="margin-bottom:8px;">Verbal Variation</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="diff-btn active" data-variant="single">
            Single Word
          </button>
          <button class="diff-btn" data-variant="sentence">
            Sentence
          </button>
          <button class="diff-btn" data-variant="paragraph">
            Paragraph
          </button>
        </div>
      </div>

      <div id="mode-desc"
           style="padding:12px 16px;background:rgba(0,229,255,0.04);
                  border:1px solid var(--border);border-radius:var(--r-md);
                  font-size:0.8rem;color:var(--text-dim);line-height:1.7;">
      </div>`;

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
        switcher.querySelectorAll('[data-variant]').forEach(b => {
          b.classList.remove('active');
        });
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
    const timing = (VERBAL_TIMING[level] / 1000).toFixed(1);

    if (mode === 'interactive') {
      el.innerHTML = `<strong style="color:var(--cyan);">Interactive mode:</strong>
        A word appears. Tap its INK COLOR — not the word itself.
        Buttons are white — no color-matching shortcut.
        Reaction time tracked. Speed increases as your streak grows.`;
    } else if (verbalVariant === 'single') {
      el.innerHTML = `<strong style="color:var(--green);">Single Word — Verbal:</strong>
        Words appear one at a time every <strong>${timing}s</strong>.
        Say the ink color out loud before the next word appears.
        Do not interact with the screen — just speak.
        After ${VERBAL_TOTAL} words, one question about difficulty adjusts your next speed.`;
    } else if (verbalVariant === 'sentence') {
      el.innerHTML = `<strong style="color:var(--green);">Sentence Mode — Verbal:</strong>
        A sentence appears with each word in a random ink color.
        Read it aloud naming each word's INK COLOR, not its meaning.
        The sentence meaning adds extra interference — higher cognitive load.
        Press Start then speak continuously.`;
    } else {
      el.innerHTML = `<strong style="color:var(--green);">Paragraph Mode — Verbal:</strong>
        A paragraph is displayed. One word highlights at a time every <strong>${timing}s</strong>.
        Say that word's ink color aloud. The rest of the paragraph is visible
        but dim — context creates interference.
        The hardest variation. Sustained inhibition for the full paragraph.`;
    }
  }

  /* ══════════════════════════════════════════════════════════
     RESET — clears all timers and state
     ══════════════════════════════════════════════════════════ */
  function reset() {
    clearTimeout(pressureTimer);
    clearTimeout(verbalTimerId);
    clearInterval(paraTimerId);
    verbalRunning   = false;
    verbalWordCount = 0;
    score = 0; total = 0; streak = 0;
    answered = false; adaptiveDelayMs = 0;
    reactionTimes = [];
    updateScoreDisplay();

    if (mode === 'interactive') {
      newInteractiveRound();
    } else if (verbalVariant === 'single') {
      renderVerbalSingleIdle();
    } else if (verbalVariant === 'sentence') {
      renderSentenceIdle();
    } else {
      renderParagraphIdle();
    }
  }

  /* ══════════════════════════════════════════════════════════
     INTERACTIVE MODE
     ══════════════════════════════════════════════════════════ */
  function newInteractiveRound() {
    answered      = false;
    wordStartTime = performance.now();
    clearTimeout(pressureTimer);

    const colors = COLOR_SETS[level];
    let curWord, curColor;
    curWord = colors[Math.floor(Math.random() * colors.length)];
    do { curColor = colors[Math.floor(Math.random() * colors.length)]; }
    while (curColor === curWord);

    wordEl.textContent = curWord;
    wordEl.style.color = HEX[curColor];
    choicesEl.innerHTML = '';

    const pool    = [...colors].filter(c => c !== curColor);
    NeuroPlex.shuffle(pool);
    const choices = NeuroPlex.shuffle([curColor, ...pool.slice(0, 3)]);

    choices.forEach(color => {
      const btn       = document.createElement('button');
      btn.className   = 'stroop-opt';
      btn.textContent = color;
      btn.style.color = '#e8f4f8';
      btn.style.fontWeight = '600';
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        clearTimeout(pressureTimer);
        total++;
        const rt      = performance.now() - wordStartTime;
        const correct = color === curColor;

        if (correct) {
          score++; streak++;
          reactionTimes.push(rt);
          btn.classList.add('correct');
          /* Adaptive — tighten time after 3 correct */
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
            if (b.textContent === curColor) b.classList.add('correct');
          });
        }

        updateScoreDisplay(rt, correct);
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
          updateScoreDisplay(null, false);
          setTimeout(newInteractiveRound, 400);
        }
      }, adaptiveDelayMs);
    }
  }

  /* ── Score display ───────────────────────────────────────── */
  function updateScoreDisplay(rt, correct) {
    if (mode !== 'interactive') {
      scoreEl.textContent = '';
      return;
    }
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    const avgRt    = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a,b)=>a+b,0) / reactionTimes.length)
      : 0;

    /* Build display — reaction time goes in stats bar, not near buttons */
    let display = `${score}/${total}`;
    if (total >= 3)  display += ` · ${accuracy}%`;
    if (avgRt > 0)   display += ` · ${avgRt}ms avg`;
    if (adaptiveDelayMs > 0)
      display += ` · ${(adaptiveDelayMs/1000).toFixed(1)}s limit`;

    scoreEl.textContent = display;
  }

  /* ══════════════════════════════════════════════════════════
     VERBAL — SINGLE WORD MODE
     Words appear automatically. User speaks. No interaction.
     After VERBAL_TOTAL words → one difficulty question.
     ══════════════════════════════════════════════════════════ */
  function renderVerbalSingleIdle() {
    const timing = (VERBAL_TIMING[level] / 1000).toFixed(1);
    wordEl.textContent = '';
    wordEl.style.color = 'var(--text)';
    scoreEl.textContent = '';

    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-size:0.85rem;color:var(--text-dim);
                  line-height:1.7;margin-bottom:20px;max-width:360px;margin-left:auto;margin-right:auto;">
          Words will appear every <strong style="color:var(--cyan);">${timing} seconds</strong>.
          Say the <strong style="color:var(--text);">ink color</strong> out loud
          before the next word appears.<br>
          <span style="color:var(--text-muted);font-size:0.78rem;">
            Do not touch the screen — just speak.
          </span>
        </p>
        <button class="btn btn-primary" id="verbal-start-btn">▶ Start</button>
      </div>`;

    document.getElementById('verbal-start-btn').addEventListener('click', startVerbalSingle);
  }

  function startVerbalSingle() {
    verbalRunning   = true;
    verbalWordCount = 0;
    choicesEl.innerHTML = '';
    showNextVerbalWord();
  }

  function showNextVerbalWord() {
    if (!verbalRunning) return;

    if (verbalWordCount >= VERBAL_TOTAL) {
      endVerbalSingle();
      return;
    }

    const colors  = COLOR_SETS[level];
    let w, c;
    w = colors[Math.floor(Math.random() * colors.length)];
    do { c = colors[Math.floor(Math.random() * colors.length)]; }
    while (c === w);

    wordEl.textContent = w;
    wordEl.style.color = HEX[c];

    /* Progress shown minimally — just a count, not a score */
    scoreEl.textContent = `${verbalWordCount + 1} / ${VERBAL_TOTAL}`;
    verbalWordCount++;

    verbalTimerId = setTimeout(showNextVerbalWord, VERBAL_TIMING[level]);
    NeuroPlex.addTimer(verbalTimerId);
  }

  function endVerbalSingle() {
    verbalRunning = false;
    wordEl.textContent = '';
    scoreEl.textContent = '';

    /*
     * One question only — subjective difficulty.
     * The answer adjusts speed for next session.
     * This is self-regulated difficulty, not engagement tracking.
     */
    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-family:var(--font-display);font-weight:700;
                  font-size:1rem;color:var(--text);margin-bottom:6px;">
          Session complete.
        </p>
        <p style="font-size:0.85rem;color:var(--text-dim);
                  margin-bottom:20px;line-height:1.65;">
          How did that feel?
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-secondary" id="felt-easy">Too easy</button>
          <button class="btn btn-ghost"     id="felt-right">Just right</button>
          <button class="btn btn-secondary" id="felt-hard">Too hard</button>
        </div>
      </div>`;

    document.getElementById('felt-easy').addEventListener('click', () => {
      /* Bump to next difficulty */
      const levels  = ['easy','medium','hard'];
      const current = levels.indexOf(level);
      if (current < levels.length - 1) {
        level = levels[current + 1];
        document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
          b.classList.toggle('active', b.dataset.level === level);
          b.setAttribute('aria-pressed', String(b.dataset.level === level));
        });
      }
      updateDesc();
      renderVerbalSingleIdle();
    });

    document.getElementById('felt-right').addEventListener('click', () => {
      renderVerbalSingleIdle();
    });

    document.getElementById('felt-hard').addEventListener('click', () => {
      /* Drop to easier difficulty */
      const levels  = ['easy','medium','hard'];
      const current = levels.indexOf(level);
      if (current > 0) {
        level = levels[current - 1];
        document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
          b.classList.toggle('active', b.dataset.level === level);
          b.setAttribute('aria-pressed', String(b.dataset.level === level));
        });
      }
      updateDesc();
      renderVerbalSingleIdle();
    });
  }

  /* ══════════════════════════════════════════════════════════
     VERBAL — SENTENCE MODE
     Full sentence shown, each word in a random ink color.
     User reads aloud naming ink colors, not words.
     No timing pressure — they go at their own pace.
     ══════════════════════════════════════════════════════════ */
  function renderSentenceIdle() {
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = '';

    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-size:0.85rem;color:var(--text-dim);
                  line-height:1.7;margin-bottom:20px;max-width:380px;
                  margin-left:auto;margin-right:auto;">
          A sentence will appear with each word in a different ink color.
          Read it aloud naming each word's <strong style="color:var(--text);">ink color</strong>,
          not its meaning. Go at your own pace.
        </p>
        <button class="btn btn-primary" id="sentence-start-btn">▶ Start</button>
      </div>`;

    document.getElementById('sentence-start-btn').addEventListener('click', showSentence);
  }

  function showSentence() {
    const colors   = COLOR_SETS[level];
    const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    const words    = sentence.split(' ');

    /* Build colored sentence HTML */
    const sentenceHtml = words.map(word => {
      let c;
      /* Pick a color that doesn't match the word if it's a color name */
      const upper = word.toUpperCase().replace(/[^A-Z]/g,'');
      do { c = colors[Math.floor(Math.random() * colors.length)]; }
      while (c === upper && colors.includes(upper));
      return `<span style="color:${HEX[c]};font-family:var(--font-display);
        font-weight:700;font-size:1.4rem;margin:0 4px;">${word}</span>`;
    }).join(' ');

    /* Hide word display, use choices area for full sentence */
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = '';

    choicesEl.innerHTML = `
      <div style="width:100%;">
        <p style="font-size:0.78rem;color:var(--text-muted);
                  text-align:center;margin-bottom:14px;">
          Name each ink color aloud as you read left to right.
        </p>
        <div style="line-height:2.4;text-align:center;margin-bottom:22px;
                    padding:16px;background:var(--bg);border-radius:var(--r-md);
                    border:1px solid var(--border);">
          ${sentenceHtml}
        </div>
        <div style="text-align:center;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="sentence-next">Next Sentence →</button>
          <button class="btn btn-secondary btn-sm" id="sentence-stop">Done</button>
        </div>
      </div>`;

    document.getElementById('sentence-next').addEventListener('click', showSentence);
    document.getElementById('sentence-stop').addEventListener('click', renderSentenceIdle);
  }

  /* ══════════════════════════════════════════════════════════
     VERBAL — PARAGRAPH MODE
     Full paragraph visible, dimmed.
     One word highlights at a time on a timer.
     User names that word's ink color aloud.
     ══════════════════════════════════════════════════════════ */
  function renderParagraphIdle() {
    const timing = (VERBAL_TIMING[level] / 1000).toFixed(1);
    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = '';

    choicesEl.innerHTML = `
      <div style="text-align:center;width:100%;padding:8px 0;">
        <p style="font-size:0.85rem;color:var(--text-dim);
                  line-height:1.7;margin-bottom:20px;max-width:380px;
                  margin-left:auto;margin-right:auto;">
          A paragraph appears. One word highlights every
          <strong style="color:var(--cyan);">${timing}s</strong>.
          Say that word's <strong style="color:var(--text);">ink color</strong> aloud.
          The surrounding text is visible but dim — it creates interference.
        </p>
        <button class="btn btn-primary" id="para-start-btn">▶ Start</button>
      </div>`;

    document.getElementById('para-start-btn').addEventListener('click', startParagraph);
  }

  function startParagraph() {
    const colors = COLOR_SETS[level];
    const text   = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
    paraWords    = text.split(' ');
    paraIdx      = 0;

    /* Assign a random ink color to every word upfront */
    paraColors = paraWords.map(word => {
      const upper = word.toUpperCase().replace(/[^A-Z]/g,'');
      let c;
      do { c = colors[Math.floor(Math.random() * colors.length)]; }
      while (c === upper && colors.includes(upper));
      return c;
    });

    wordEl.textContent  = '';
    wordEl.style.color  = 'var(--text)';
    scoreEl.textContent = `1 / ${paraWords.length}`;

    renderParagraphFrame();
    highlightParaWord();
  }

  function renderParagraphFrame() {
    /*
     * Render the full paragraph with all words dim.
     * Each word gets a span with its assigned ink color at low opacity.
     * The highlight function brightens one span at a time.
     */
    const paraHtml = paraWords.map((word, i) =>
      `<span id="pw-${i}"
        style="color:${HEX[paraColors[i]]};opacity:0.2;
               font-family:var(--font-display);font-size:1.1rem;
               font-weight:600;margin:0 3px;
               transition:opacity 0.15s, font-size 0.15s;">
        ${word}
      </span>`
    ).join(' ');

    choicesEl.innerHTML = `
      <div style="width:100%;">
        <p style="font-size:0.75rem;color:var(--text-muted);
                  text-align:center;margin-bottom:12px;">
          Say each highlighted word's ink color aloud.
        </p>
        <div id="para-text"
             style="line-height:2.2;padding:16px;background:var(--bg);
                    border-radius:var(--r-md);border:1px solid var(--border);
                    margin-bottom:14px;">
          ${paraHtml}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-secondary btn-sm" id="para-stop">Stop</button>
        </div>
      </div>`;

    document.getElementById('para-stop').addEventListener('click', () => {
      clearTimeout(paraTimerId);
      renderParagraphIdle();
    });
  }

  function highlightParaWord() {
    if (paraIdx >= paraWords.length) {
      /* Paragraph complete */
      clearTimeout(paraTimerId);
      scoreEl.textContent = '✓ Complete';
      const stopBtn = document.getElementById('para-stop');
      if (stopBtn) {
        stopBtn.textContent = '↺ New Paragraph';
        stopBtn.addEventListener('click', renderParagraphIdle);
      }
      return;
    }

    /* Dim all, highlight current */
    paraWords.forEach((_, i) => {
      const span = document.getElementById(`pw-${i}`);
      if (!span) return;
      if (i === paraIdx) {
        span.style.opacity  = '1';
        span.style.fontSize = '1.25rem';
        span.style.textShadow = `0 0 12px ${HEX[paraColors[i]]}`;
        /* Scroll into view on mobile */
        span.scrollIntoView({ behavior:'smooth', block:'nearest' });
      } else {
        span.style.opacity    = '0.18';
        span.style.fontSize   = '1.1rem';
        span.style.textShadow = 'none';
      }
    });

    scoreEl.textContent = `${paraIdx + 1} / ${paraWords.length}`;
    paraIdx++;

    paraTimerId = setTimeout(highlightParaWord, VERBAL_TIMING[level]);
    NeuroPlex.addTimer(paraTimerId);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  updateScoreDisplay();
  newInteractiveRound();

})();