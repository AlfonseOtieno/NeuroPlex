/**
 * NeuroPlex — Grid Memory Challenge (v2)
 * Visual position memory: memorize emoji locations, answer targeted questions.
 *
 * Phases:
 *  study  → all emojis visible with countdown
 *  recall → boxes hidden, "Where is X?" questions appear one by one
 *  done   → score + accuracy + avg reaction time shown
 */

(function MemoryGridExercise() {
  'use strict';

  /* ── Metadata ────────────────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'memory-grid');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML =
      act.chips.map(c => `<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML =
      act.benefits.map(b => `<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML =
      act.instructions.map(i => `<li>${i}</li>`).join('');
  }

  /* ── Emoji pool ──────────────────────────────────────────── */
  const EMOJIS = [
    '🍎','🐶','⭐','🌊','🔥','🌙','🦋','🎸',
    '🍕','🌈','🐸','💎','🚀','🌺','🦁','🍦',
    '🎯','🌍','🏆','🎪'
  ];

  /* ── Configs ─────────────────────────────────────────────── */
  /*
   * questionsPerRound — how many "Where is X?" questions per game
   * studyMs           — how long the study phase lasts in milliseconds
   */
  const CONFIGS = {
    easy:   { cols: 3, rows: 2, studyMs: 8000,  questionsPerRound: 3 },
    medium: { cols: 4, rows: 3, studyMs: 12000, questionsPerRound: 5 },
    hard:   { cols: 5, rows: 4, studyMs: 16000, questionsPerRound: 8 }
  };

  /* ── State ───────────────────────────────────────────────── */
  let level           = 'easy';
  let cfg             = CONFIGS[level];
  let items           = [];   // array of emojis, index = box position
  let phase           = 'idle';
  let questionQueue   = [];   // indices of emojis to ask about
  let currentQuestion = null; // index into items[] being asked right now
  let questionNum     = 0;    // how many questions answered so far
  let score           = 0;    // correct answers
  let studySecsLeft   = 0;
  let countdownId     = null;
  let questionStartMs = null; // timestamp when current question appeared
  let reactionTimes   = [];   // ms per correct answer

  /* ── DOM ─────────────────────────────────────────────────── */
  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML =
    `<button class="btn btn-primary btn-sm" id="top-start-btn">▶ Start</button>`;
  document.getElementById('top-start-btn').addEventListener('click', initGame);

  /* ── Difficulty buttons ──────────────────────────────────── */
  document.querySelectorAll('.diff-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn[data-level]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      level = btn.dataset.level;
      cfg   = CONFIGS[level];
      phase = 'idle';
      renderIdle();
    });
  });

  /* ══════════════════════════════════════════════════════════
     GAME FLOW
     ══════════════════════════════════════════════════════════ */

  function initGame() {
    NeuroPlex.clearTimers();
    clearInterval(countdownId);

    cfg             = CONFIGS[level];
    const total     = cfg.cols * cfg.rows;

    /* Shuffle emojis into positions */
    const pool = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, total);
    items = pool;   // items[i] = emoji at box position i

    /* Build question queue — random positions to ask about */
    const allIdx = Array.from({ length: total }, (_, i) => i);
    NeuroPlex.shuffle(allIdx);
    questionQueue = allIdx.slice(0, cfg.questionsPerRound);

    questionNum    = 0;
    score          = 0;
    reactionTimes  = [];
    phase          = 'study';
    studySecsLeft  = Math.ceil(cfg.studyMs / 1000);

    renderStudy();
    startStudyCountdown();
  }

  /* ── Study phase ─────────────────────────────────────────── */
  function startStudyCountdown() {
    countdownId = setInterval(() => {
      studySecsLeft--;
      /* Update just the countdown number without re-rendering grid */
      const el = document.getElementById('study-countdown');
      if (el) el.textContent = studySecsLeft + 's';

      if (studySecsLeft <= 0) {
        clearInterval(countdownId);
        phase = 'recall';
        askNextQuestion();
      }
    }, 1000);
    NeuroPlex.addTimer(countdownId);
  }

  /* ── Recall phase ────────────────────────────────────────── */
  function askNextQuestion() {
    if (questionNum >= questionQueue.length) {
      phase = 'done';
      renderDone();
      return;
    }

    currentQuestion = questionQueue[questionNum];
    questionStartMs = Date.now();
    renderRecall();
  }

  function handleBoxClick(clickedIdx) {
    if (phase !== 'recall') return;

    const correct = clickedIdx === currentQuestion;
    const cell    = document.querySelector(`[data-idx="${clickedIdx}"]`);

    if (correct) {
      score++;
      reactionTimes.push(Date.now() - questionStartMs);
      cell.style.background    = 'rgba(6,255,165,0.18)';
      cell.style.borderColor   = 'var(--green)';
      cell.textContent         = items[clickedIdx];
      cell.style.fontSize      = '1.8rem';
    } else {
      cell.style.background  = 'rgba(255,107,53,0.12)';
      cell.style.borderColor = 'rgba(255,107,53,0.5)';
      /* Show where the correct one was */
      const correctCell = document.querySelector(`[data-idx="${currentQuestion}"]`);
      if (correctCell) {
        correctCell.style.background  = 'rgba(6,255,165,0.10)';
        correctCell.style.borderColor = 'rgba(6,255,165,0.4)';
        correctCell.textContent       = items[currentQuestion];
        correctCell.style.fontSize    = '1.8rem';
      }
    }

    questionNum++;

    /* Short pause so the player sees feedback, then next question */
    const t = setTimeout(askNextQuestion, 700);
    NeuroPlex.addTimer(t);
  }

  /* ══════════════════════════════════════════════════════════
     RENDER FUNCTIONS
     ══════════════════════════════════════════════════════════ */

  function renderIdle() {
    exBody.innerHTML = `
      <div style="text-align:center;padding:28px 0;">
        <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:18px;">
          Select difficulty above, then press Start.
        </p>
        <button class="btn btn-primary" id="idle-start-btn">▶ Start</button>
      </div>`;
    document.getElementById('idle-start-btn').addEventListener('click', initGame);
  }

  function renderStudy() {
    exBody.innerHTML = `
      <div class="memory-outer">

        <!-- Phase label + countdown -->
        <div style="text-align:center;margin-bottom:14px;">
          <p style="font-family:var(--font-display);font-weight:700;
                    font-size:0.95rem;color:var(--cyan);margin-bottom:4px;">
            Memorize the positions
          </p>
          <p style="font-size:0.82rem;color:var(--text-muted);">
            Hiding in <span id="study-countdown">${studySecsLeft}s</span>
          </p>
        </div>

        <!-- Grid -->
        <div class="memory-grid" id="mem-grid"
             style="grid-template-columns:repeat(${cfg.cols},1fr);
                    margin-bottom:16px;">
        </div>

      </div>`;

    const grid = document.getElementById('mem-grid');
    items.forEach((emoji, idx) => {
      const cell        = document.createElement('div');
      cell.className    = 'mem-cell';
      cell.textContent  = emoji;
      cell.dataset.idx  = idx;
      grid.appendChild(cell);
    });
  }

  function renderRecall() {
    const targetEmoji = items[currentQuestion];
    const total       = cfg.questionsPerRound;

    exBody.innerHTML = `
      <div class="memory-outer">

        <!-- Question -->
        <div style="text-align:center;margin-bottom:18px;">
          <p style="font-size:0.78rem;color:var(--text-muted);
                    letter-spacing:0.08em;text-transform:uppercase;
                    margin-bottom:8px;">
            Question ${questionNum + 1} of ${total}
          </p>
          <p style="font-family:var(--font-display);font-weight:800;
                    font-size:1.5rem;color:var(--text);">
            Where is <span style="color:var(--cyan)">${targetEmoji}</span> ?
          </p>
        </div>

        <!-- Progress dots -->
        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:18px;">
          ${Array.from({ length: total }, (_, i) => `
            <div style="width:8px;height:8px;border-radius:50%;
                        background:${i < questionNum ? 'var(--green)' : i === questionNum ? 'var(--cyan)' : 'var(--surface-2)'};
                        border:1px solid ${i === questionNum ? 'var(--cyan)' : 'transparent'};
                        transition:background 0.3s;">
            </div>`).join('')}
        </div>

        <!-- Hidden grid — all boxes show ? -->
        <div class="memory-grid" id="mem-grid"
             style="grid-template-columns:repeat(${cfg.cols},1fr);
                    margin-bottom:16px;">
        </div>

      </div>`;

    const grid = document.getElementById('mem-grid');
    items.forEach((emoji, idx) => {
      const cell       = document.createElement('div');
      cell.className   = 'mem-cell hidden';
      cell.dataset.idx = idx;
      cell.addEventListener('click', () => handleBoxClick(idx));
      grid.appendChild(cell);
    });
  }

  function renderDone() {
    const total      = cfg.questionsPerRound;
    const accuracy   = Math.round((score / total) * 100);
    const avgReaction = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 100) / 10
      : 0;

    /*
     * Performance message — gives the user meaningful feedback
     * rather than just a number.
     */
    const msg = accuracy === 100 ? 'Perfect memory! 🧠'
              : accuracy >= 75   ? 'Strong recall. Keep training.'
              : accuracy >= 50   ? 'Good start. Repeat this level.'
              :                    'Keep practicing — memory improves fast.';

    exBody.innerHTML = `
      <div style="text-align:center;padding:24px 0;">

        <p style="font-family:var(--font-display);font-weight:800;
                  font-size:1.3rem;color:var(--green);margin-bottom:6px;">
          Round Complete
        </p>
        <p style="font-size:0.88rem;color:var(--text-dim);margin-bottom:24px;">
          ${msg}
        </p>

        <!-- Stat cards -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);
                    gap:12px;margin-bottom:24px;">

          <div style="background:var(--surface-2);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:16px 8px;">
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.6rem;color:var(--cyan);">${score}/${total}</p>
            <p style="font-size:0.72rem;color:var(--text-muted);
                      letter-spacing:0.06em;text-transform:uppercase;
                      margin-top:4px;">Correct</p>
          </div>

          <div style="background:var(--surface-2);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:16px 8px;">
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.6rem;color:var(--green);">${accuracy}%</p>
            <p style="font-size:0.72rem;color:var(--text-muted);
                      letter-spacing:0.06em;text-transform:uppercase;
                      margin-top:4px;">Accuracy</p>
          </div>

          <div style="background:var(--surface-2);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:16px 8px;">
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.6rem;color:var(--orange);">${avgReaction}s</p>
            <p style="font-size:0.72rem;color:var(--text-muted);
                      letter-spacing:0.06em;text-transform:uppercase;
                      margin-top:4px;">Avg Speed</p>
          </div>

        </div>

        <button class="btn btn-primary" id="play-again-btn">↺ Play Again</button>

      </div>`;

    document.getElementById('play-again-btn').addEventListener('click', initGame);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  renderIdle();

})();