/**
 * NeuroPlex — Blindfold Tasks (v2)
 *
 * Two modes:
 *
 * MODE 1 — Blind Typing (Digital, measurable)
 *   A word appears. User reads it, closes eyes, types it.
 *   Accuracy measured character by character.
 *   Trains the somatosensory-motor pathway — the same mechanism
 *   shown in Braille studies to cause cortical remapping.
 *
 * MODE 2 — Offline Instructions (Physical, self-guided)
 *   Structured progressive tasks done with pen, paper, or body.
 *   User self-reports completion. No fake digital scoring.
 *   Trains proprioception, motor memory, and spatial mapping.
 */

(function BlindfoldExercise() {
  'use strict';

  /* ── Metadata ────────────────────────────────────────────── */
  const act = ACTIVITIES.find(a => a.id === 'blindfold');
  if (!act) return;

  document.getElementById('act-icon').textContent      = act.icon;
  document.getElementById('act-desc').textContent      = act.desc;
  document.getElementById('chip-row').innerHTML        = act.chips.map(c => `<span class="chip">${c}</span>`).join('');
  document.getElementById('func-trained').textContent  = act.functionTrained;
  document.getElementById('benefits-list').innerHTML   = act.benefits.map(b => `<li>${b}</li>`).join('');

  /* ══════════════════════════════════════════════════════════
     WORD POOLS — grouped by difficulty
     Words are 3–6 letters, chosen to vary motor complexity.
     Short words with repeated letters (easy) vs words with
     uncommon letter combinations (hard) stress the motor
     program differently.
     ══════════════════════════════════════════════════════════ */
  const WORD_POOLS = {
    easy:   ['cat','dog','sun','red','map','run','cup','fly','hot','big',
             'jump','grab','fold','push','spin','drop','hold','walk','read','type'],
    medium: ['brain','focus','track','nerve','skill','learn','grasp','probe',
             'swift','crisp','blend','draft','exact','frame','pluck','grind'],
    hard:   ['rhythm','syntax','reflex','sculpt','quartz','glitch','scrimp',
             'wrench','trophy','twitch','growth','beyond','mythic','sphinx']
  };

  /* ── State ───────────────────────────────────────────────── */
  let currentMode     = 'typing';   // 'typing' | 'offline'
  let typingLevel     = 'easy';
  let currentWord     = '';
  let roundsPlayed    = 0;
  let totalAccuracy   = 0;
  let sessionComplete = false;
  const ROUNDS_PER_SESSION = 8;

  /* ── Container ───────────────────────────────────────────── */
  const container = document.getElementById('offline-content');

  /* ══════════════════════════════════════════════════════════
     MAIN LAYOUT — mode switcher + content area
     ══════════════════════════════════════════════════════════ */
  container.innerHTML = `

    <!-- Mode switcher -->
    <div style="margin-bottom:28px;">
      <p class="info-block-label">Training Mode</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="diff-btn active" id="mode-typing"
          style="display:flex;align-items:center;gap:8px;">
          📱 Blind Typing <span style="font-size:0.7rem;opacity:0.6;">(Digital)</span>
        </button>
        <button class="diff-btn" id="mode-offline"
          style="display:flex;align-items:center;gap:8px;">
          📋 Physical Tasks <span style="font-size:0.7rem;opacity:0.6;">(Offline)</span>
        </button>
      </div>
    </div>

    <!-- Dynamic content -->
    <div id="mode-content"></div>
  `;

  document.getElementById('mode-typing').addEventListener('click', () => {
    currentMode = 'typing';
    document.getElementById('mode-typing').classList.add('active');
    document.getElementById('mode-offline').classList.remove('active');
    renderTypingMode();
  });

  document.getElementById('mode-offline').addEventListener('click', () => {
    currentMode = 'offline';
    document.getElementById('mode-offline').classList.add('active');
    document.getElementById('mode-typing').classList.remove('active');
    renderOfflineMode();
  });

  /* ══════════════════════════════════════════════════════════
     MODE 1 — BLIND TYPING
     ══════════════════════════════════════════════════════════ */
  function renderTypingMode() {
    roundsPlayed    = 0;
    totalAccuracy   = 0;
    sessionComplete = false;

    const mc = document.getElementById('mode-content');
    mc.innerHTML = `

      <!-- Science note -->
      <div style="background:rgba(0,229,255,0.05);border:1px solid var(--border);
                  border-radius:var(--r-md);padding:14px 18px;margin-bottom:24px;">
        <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.7;">
          <strong style="color:var(--cyan);">🧠 Why this works:</strong>
          Typing without looking forces the brain to build somatosensory-motor pathways
          independent of vision. Research on Braille readers shows this causes measurable
          cortical remapping — the visual cortex begins processing tactile input.
          Each error you make is your brain identifying a weak motor program to strengthen.
        </p>
      </div>

      <!-- Difficulty -->
      <div style="margin-bottom:22px;">
        <p class="info-block-label">Difficulty</p>
        <div class="difficulty-selector" id="typing-difficulty">
          <button class="diff-btn active" data-level="easy"   aria-pressed="true">Easy (3–4 letters)</button>
          <button class="diff-btn"        data-level="medium" aria-pressed="false">Medium (5–6 letters)</button>
          <button class="diff-btn"        data-level="hard"   aria-pressed="false">Hard (6–7 letters)</button>
        </div>
      </div>

      <!-- Exercise frame -->
      <div style="background:var(--bg-2);border:1px solid var(--border-md);
                  border-radius:var(--r-lg);padding:28px;" id="typing-frame">
      </div>

      <!-- Session stats -->
      <div id="session-stats"
           style="display:none;margin-top:16px;
                  background:var(--surface-2);border:1px solid var(--border);
                  border-radius:var(--r-md);padding:16px;text-align:center;">
        <p style="font-family:var(--font-display);font-weight:700;
                  font-size:0.9rem;color:var(--text-dim);margin-bottom:6px;">
          Session Progress
        </p>
        <div style="display:flex;gap:24px;justify-content:center;">
          <div>
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.5rem;color:var(--cyan);" id="rounds-display">0/${ROUNDS_PER_SESSION}</p>
            <p style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;
                      letter-spacing:0.06em;">Rounds</p>
          </div>
          <div>
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.5rem;color:var(--green);" id="accuracy-display">—</p>
            <p style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;
                      letter-spacing:0.06em;">Avg Accuracy</p>
          </div>
        </div>
      </div>
    `;

    /* Difficulty buttons */
    document.querySelectorAll('#typing-difficulty .diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#typing-difficulty .diff-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        typingLevel  = btn.dataset.level;
        roundsPlayed = 0;
        totalAccuracy = 0;
        document.getElementById('session-stats').style.display = 'none';
        newTypingRound();
      });
    });

    newTypingRound();
  }

  /* ── Pick a new word and render the round ────────────────── */
  function newTypingRound() {
    const pool  = WORD_POOLS[typingLevel];
    currentWord = pool[Math.floor(Math.random() * pool.length)];

    const frame = document.getElementById('typing-frame');
    if (!frame) return;

    frame.innerHTML = `

      <!-- Phase indicator -->
      <div style="text-align:center;margin-bottom:20px;">
        <p style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0.1em;
                  text-transform:uppercase;margin-bottom:6px;">
          Round ${roundsPlayed + 1} of ${ROUNDS_PER_SESSION}
        </p>
        <p id="phase-label"
           style="font-family:var(--font-display);font-weight:700;
                  font-size:0.95rem;color:var(--cyan);">
          Read the word carefully
        </p>
      </div>

      <!-- Word display -->
      <div id="word-display"
           style="text-align:center;margin-bottom:24px;">
        <p style="font-family:var(--font-display);font-weight:800;
                  font-size:3rem;letter-spacing:0.08em;
                  color:var(--text);" id="word-text">
          ${currentWord.toUpperCase()}
        </p>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;">
          ${currentWord.length} letters
        </p>
      </div>

      <!-- Instruction -->
      <div style="background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.2);
                  border-radius:var(--r-md);padding:14px 18px;margin-bottom:20px;
                  text-align:center;">
        <p style="font-size:0.85rem;color:#a78bfa;line-height:1.65;">
          Close your eyes — then type the word below from memory.<br>
          <strong>Do not look at the keyboard or screen while typing.</strong>
        </p>
      </div>

      <!-- Input area — visible but user types with eyes closed -->
      <div style="position:relative;">
        <input type="text"
          id="blind-input"
          autocomplete="off" autocorrect="off"
          autocapitalize="off" spellcheck="false"
          placeholder="Type here with eyes closed…"
          style="width:100%;padding:14px 16px;
                 background:var(--bg);border:1.5px solid var(--border-md);
                 border-radius:var(--r-md);color:var(--text);
                 font-family:var(--font-display);font-size:1.1rem;
                 letter-spacing:0.1em;outline:none;
                 transition:border-color 0.2s;"
        />
      </div>

      <div style="text-align:center;margin-top:16px;">
        <button class="btn btn-primary" id="submit-word-btn">
          Open Eyes & Check →
        </button>
      </div>

      <div id="result-area" style="margin-top:18px;"></div>
    `;

    /* Focus the input so mobile keyboard opens */
    setTimeout(() => {
      const input = document.getElementById('blind-input');
      if (input) input.focus();
    }, 300);

    document.getElementById('submit-word-btn').addEventListener('click', checkTypingResult);

    /* Also allow Enter key */
    document.getElementById('blind-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') checkTypingResult();
    });
  }

  /* ── Check what the user typed ───────────────────────────── */
  function checkTypingResult() {
    const input    = document.getElementById('blind-input');
    const resultEl = document.getElementById('result-area');
    if (!input || !resultEl) return;

    const typed    = input.value.trim().toLowerCase();
    const target   = currentWord.toLowerCase();

    if (!typed) return;

    /* Character-by-character accuracy */
    const accuracy = calculateAccuracy(target, typed);
    const perfect  = typed === target;

    roundsPlayed++;
    totalAccuracy += accuracy;

    const avgAcc = Math.round(totalAccuracy / roundsPlayed);

    /* Update session stats */
    const statsEl = document.getElementById('session-stats');
    const rEl     = document.getElementById('rounds-display');
    const aEl     = document.getElementById('accuracy-display');
    if (statsEl) statsEl.style.display = 'block';
    if (rEl)     rEl.textContent  = `${roundsPlayed}/${ROUNDS_PER_SESSION}`;
    if (aEl)     aEl.textContent  = `${avgAcc}%`;

    /* Build character-by-character visual diff */
    const diffHtml = buildDiff(target, typed);

    resultEl.innerHTML = `
      <div style="background:${perfect ? 'rgba(6,255,165,0.07)' : 'rgba(255,107,53,0.06)'};
                  border:1px solid ${perfect ? 'rgba(6,255,165,0.25)' : 'rgba(255,107,53,0.22)'};
                  border-radius:var(--r-md);padding:16px 18px;">

        <div style="display:flex;justify-content:space-between;
                    align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <p style="font-family:var(--font-display);font-weight:700;font-size:0.9rem;
                    color:${perfect ? 'var(--green)' : 'var(--orange)'};">
            ${perfect ? '✓ Perfect' : `${accuracy}% accurate`}
          </p>
          <p style="font-size:0.78rem;color:var(--text-muted);">
            You typed: <strong style="color:var(--text);letter-spacing:0.06em;">
              ${typed.toUpperCase()}
            </strong>
          </p>
        </div>

        <!-- Character diff -->
        <div style="display:flex;gap:6px;justify-content:center;
                    flex-wrap:wrap;margin-bottom:14px;">
          ${diffHtml}
        </div>

        ${!perfect ? `
        <p style="font-size:0.78rem;color:var(--text-muted);text-align:center;
                  margin-bottom:14px;line-height:1.6;">
          The wrong characters are your weak motor programs.
          Repeat this word 3 times with eyes closed before moving on.
        </p>` : ''}

        <div style="text-align:center;">
          ${roundsPlayed < ROUNDS_PER_SESSION
            ? `<button class="btn btn-primary btn-sm" id="next-word-btn">Next Word →</button>`
            : `<button class="btn btn-primary btn-sm" id="finish-session-btn">See Final Results</button>`
          }
        </div>
      </div>`;

    const nextBtn   = document.getElementById('next-word-btn');
    const finishBtn = document.getElementById('finish-session-btn');
    if (nextBtn)   nextBtn.addEventListener('click', newTypingRound);
    if (finishBtn) finishBtn.addEventListener('click', showFinalResults);
  }

  /* ── Character accuracy calculation ─────────────────────── */
  /*
   * Levenshtein-inspired character match:
   * Compare each position — correct position = correct character.
   * Accuracy = correct characters / max(target.length, typed.length).
   * This penalises both substitutions and length errors.
   */
  function calculateAccuracy(target, typed) {
    const len     = Math.max(target.length, typed.length);
    let correct   = 0;
    for (let i = 0; i < len; i++) {
      if (typed[i] && target[i] && typed[i] === target[i]) correct++;
    }
    return Math.round((correct / len) * 100);
  }

  /* ── Visual character diff ───────────────────────────────── */
  function buildDiff(target, typed) {
    const len = Math.max(target.length, typed.length);
    let html  = '';
    for (let i = 0; i < len; i++) {
      const tc = target[i] || '';
      const uc = typed[i]  || '';
      const match = tc && uc && tc === uc;
      const color = !tc
        ? 'rgba(255,107,53,0.7)'   // extra character typed
        : !uc
        ? 'rgba(255,80,80,0.4)'    // missing character
        : match
        ? 'var(--green)'           // correct
        : 'var(--orange)';         // wrong character

      html += `
        <div style="text-align:center;min-width:28px;">
          <div style="font-family:var(--font-display);font-weight:800;
                      font-size:1.1rem;color:${color};">
            ${uc.toUpperCase() || '·'}
          </div>
          <div style="font-size:0.6rem;color:var(--text-muted);
                      margin-top:2px;">
            ${tc.toUpperCase() || ''}
          </div>
        </div>`;
    }
    return html;
  }

  /* ── Final session results ───────────────────────────────── */
  function showFinalResults() {
    const avgAcc  = Math.round(totalAccuracy / roundsPlayed);
    const frame   = document.getElementById('typing-frame');
    if (!frame) return;

    const msg = avgAcc === 100 ? 'Perfect motor memory. Advance to the next difficulty.'
              : avgAcc >= 80   ? 'Strong accuracy. Keep training at this level.'
              : avgAcc >= 60   ? 'Good progress. Identify your weak letters and target them.'
              :                  'Stay at this level. Focus on feeling each key before pressing.';

    frame.innerHTML = `
      <div style="text-align:center;padding:20px 0;">

        <p style="font-family:var(--font-display);font-weight:800;
                  font-size:1.3rem;color:var(--green);margin-bottom:6px;">
          Session Complete
        </p>
        <p style="font-size:0.88rem;color:var(--text-dim);margin-bottom:28px;">
          ${msg}
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;
                    gap:12px;max-width:280px;margin:0 auto 24px;">
          <div style="background:var(--surface-2);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:16px 8px;">
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.6rem;color:var(--cyan);">${roundsPlayed}</p>
            <p style="font-size:0.7rem;color:var(--text-muted);
                      text-transform:uppercase;letter-spacing:0.06em;
                      margin-top:3px;">Words</p>
          </div>
          <div style="background:var(--surface-2);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:16px 8px;">
            <p style="font-family:var(--font-display);font-weight:800;
                      font-size:1.6rem;color:var(--green);">${avgAcc}%</p>
            <p style="font-size:0.7rem;color:var(--text-muted);
                      text-transform:uppercase;letter-spacing:0.06em;
                      margin-top:3px;">Accuracy</p>
          </div>
        </div>

        <button class="btn btn-primary" id="restart-session-btn">↺ New Session</button>
      </div>`;

    document.getElementById('restart-session-btn').addEventListener('click', () => {
      roundsPlayed  = 0;
      totalAccuracy = 0;
      document.getElementById('session-stats').style.display = 'none';
      newTypingRound();
    });
  }

  /* ══════════════════════════════════════════════════════════
     MODE 2 — OFFLINE PHYSICAL TASKS
     ══════════════════════════════════════════════════════════ */
  function renderOfflineMode() {
    const TASKS = [
      {
        level: 'Beginner',
        icon:  '✏️',
        title: 'Eyes-Closed Writing',
        description: 'Build clean motor programs for fundamental writing strokes without visual correction.',
        science: 'The error-correction loop in motor learning requires surprise. When you cannot see your output, the brain strengthens proprioceptive feedback pathways instead of defaulting to visual correction.',
        steps: [
          'Take a sheet of lined paper and a pen.',
          'Close your eyes or put on a sleep mask.',
          'Write numbers 1–20 in a single row, left to right.',
          'Open your eyes and assess legibility, spacing, and line alignment.',
          'Circle the 3 most malformed characters — these are your weakest motor programs.',
          'Close your eyes again and repeat those 3 characters 10 times each.',
          'Repeat the full 1–20 sequence until all numbers stay on the line.'
        ],
        bonus: 'Progress: write the full alphabet A–Z. Letters with diagonal strokes (k, x, z, w) are hardest and most valuable to train.'
      },
      {
        level: 'Intermediate',
        icon:  '📐',
        title: 'Shape Reproduction from Memory',
        description: 'Reproduce geometric shapes from spatial memory using only proprioceptive feedback.',
        science: 'Spatial motor reproduction without vision activates the parietal cortex — the brain\'s spatial map — and strengthens its connection to the motor cortex. This is the same system trained in surgery simulation and sculptural training.',
        steps: [
          'Draw a reference shape on paper: a 5-pointed star, hexagon, or house outline.',
          'Study it carefully for 10 seconds — note the proportions and angles.',
          'Flip it face-down.',
          'Close your eyes. On a blank sheet, reproduce the shape from memory and feel alone.',
          'Open your eyes. Compare your reproduction to the original.',
          'Measure the gap — assess size, proportions, and whether lines close cleanly.',
          'Repeat until you can reproduce it within 80% visual similarity 5 times in a row.'
        ],
        bonus: 'Advanced: reproduce a simple floor plan or diagram. The hippocampus encodes spatial layouts — this directly trains it.'
      },
      {
        level: 'Advanced',
        icon:  '🚶',
        title: 'Guided Movement Without Vision',
        description: 'Navigate and interact with your physical environment using touch, sound, and proprioception only.',
        science: 'Short-term visual deprivation (even 10–15 minutes) accelerates cross-modal plasticity — the visual cortex begins processing tactile and auditory input within minutes. This is the same mechanism that gives blind individuals enhanced hearing and touch sensitivity.',
        steps: [
          'In a safe familiar space — your room or home — put on a sleep mask.',
          'Task 1: Navigate from one wall to another and back. Use only touch and memory.',
          'Task 2: Find 3 specific objects in the room by touch alone.',
          'Task 3: Pour a glass of water with eyes closed. Focus on sound and touch feedback.',
          'Task 4: Arrange 5 objects on a table, memorise positions, then replace them with eyes closed.',
          'After each task, open your eyes and assess accuracy without judgment.',
          'Do this in a new room or with rearranged furniture to prevent memorised routes.'
        ],
        bonus: 'Elite version: cook a simple meal (toast, pouring cereal) with eyes closed. Tactile cooking is used in neuro-rehabilitation programs.'
      }
    ];

    const mc = document.getElementById('mode-content');
    mc.innerHTML = `

      <!-- Science note -->
      <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);
                  border-radius:var(--r-md);padding:14px 18px;margin-bottom:24px;">
        <p style="font-size:0.82rem;color:#a78bfa;line-height:1.7;">
          <strong>🧠 Why physical blindfold tasks cause neuroplastic change:</strong>
          Even brief visual deprivation triggers cross-modal plasticity — the visual cortex
          begins processing tactile and spatial input within minutes. This is the same
          mechanism that gives blind individuals measurably enhanced touch sensitivity.
          These tasks are not metaphors. They are direct training stimuli.
        </p>
      </div>

      <!-- Task selector -->
      <div style="margin-bottom:20px;">
        <p class="info-block-label">Choose Level</p>
        <div class="difficulty-selector" id="offline-tabs">
          ${TASKS.map((t, i) => `
            <button class="diff-btn${i===0?' active':''}" data-task="${i}"
              aria-pressed="${i===0?'true':'false'}">
              ${t.icon} ${t.level}
            </button>`).join('')}
        </div>
      </div>

      <div id="offline-task-content"></div>
    `;

    function renderTask(idx) {
      const t = TASKS[idx];
      document.getElementById('offline-task-content').innerHTML = `
        <div class="offline-guide">

          <div style="margin-bottom:18px;">
            <span class="badge badge-offline" style="margin-bottom:12px;display:inline-flex;">
              🙈 Physical Practice — ${t.level}
            </span>
            <h3 style="font-family:var(--font-display);font-weight:700;
                       font-size:1.05rem;margin-bottom:6px;">
              ${t.icon} ${t.title}
            </h3>
            <p style="color:var(--text-dim);font-size:0.88rem;
                      line-height:1.65;">${t.description}</p>
          </div>

          <!-- Science rationale -->
          <div style="background:rgba(0,229,255,0.04);border:1px solid var(--border);
                      border-radius:var(--r-md);padding:12px 16px;margin-bottom:18px;">
            <p style="font-size:0.8rem;color:var(--text-dim);line-height:1.65;">
              <strong style="color:var(--cyan);">Why this works:</strong>
              ${t.science}
            </p>
          </div>

          <!-- Steps -->
          <ol class="styled-ol" style="margin-bottom:18px;">
            ${t.steps.map(s => `<li>${s}</li>`).join('')}
          </ol>

          <!-- Bonus -->
          <div class="pro-tip">
            <strong>💡 Progression:</strong> ${t.bonus}
          </div>

          <!-- Self-report -->
          <div style="margin-top:18px;background:rgba(255,107,53,0.05);
                      border:1px solid rgba(255,107,53,0.18);
                      border-radius:var(--r-md);padding:14px 18px;">
            <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.65;">
              <strong style="color:var(--orange);">⚠️ The right mindset:</strong>
              Errors are not failures — they are data. Every wrong character,
              misaligned line, or inaccurate movement tells you exactly which
              motor programs need more encoding. Study them. Don't correct them
              visually — correct them by repeating blind.
            </p>
          </div>

        </div>`;
    }

    document.querySelectorAll('#offline-tabs .diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#offline-tabs .diff-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        renderTask(parseInt(btn.dataset.task, 10));
      });
    });

    renderTask(0);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  renderTypingMode();

})();