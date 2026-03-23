/**
 * NeuroPlex — Stroop Challenge Exercise
 * Cognitive control training via color-word interference.
 */

(function StroopExercise() {
  'use strict';

  /* ── Color sets by difficulty ───────────────────────────── */
  const COLOR_SETS = {
    easy:   ['RED', 'BLUE', 'GREEN', 'YELLOW'],
    medium: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE'],
    hard:   ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'TEAL']
  };

  const HEX = {
    RED:    '#ff4444',
    BLUE:   '#4488ff',
    GREEN:  '#44dd88',
    YELLOW: '#ffdd44',
    ORANGE: '#ff8844',
    PURPLE: '#aa44ff',
    PINK:   '#ff44aa',
    TEAL:   '#44dddd'
  };

  /* ── State ──────────────────────────────────────────────── */
  let level       = 'easy';
  let score       = 0;
  let total       = 0;
  let curWord     = '';
  let curColor    = '';   // the ink color (correct answer)
  let answered    = false;

  /* ── DOM ────────────────────────────────────────────────── */
  const wordEl    = document.getElementById('stroop-word');
  const choicesEl = document.getElementById('stroop-choices');
  const scoreEl   = document.getElementById('score-display');
  const resetBtn  = document.getElementById('reset-btn');

  /* ── Difficulty ─────────────────────────────────────────── */
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

  /* ── Round logic ─────────────────────────────────────────── */
  function newRound() {
    answered = false;
    const colors = COLOR_SETS[level];

    // Word and ink color must differ
    curWord  = colors[Math.floor(Math.random() * colors.length)];
    do {
      curColor = colors[Math.floor(Math.random() * colors.length)];
    } while (curColor === curWord);

    // Build answer choices (4 options always, always includes correct)
    const pool = [...colors].filter(c => c !== curColor);
    NeuroPlex.shuffle(pool);
    const distractors = pool.slice(0, 3);
    const choices = NeuroPlex.shuffle([curColor, ...distractors]);

    renderRound(choices);
  }

  function renderRound(choices) {
    wordEl.textContent  = curWord;
    wordEl.style.color  = HEX[curColor];
    choicesEl.innerHTML = '';

    choices.forEach(color => {
      const btn = document.createElement('button');
      btn.className   = 'stroop-opt';
      btn.textContent = color;
      btn.style.color = HEX[color];
      btn.setAttribute('aria-label', `Select ${color}`);
      btn.addEventListener('click', () => handleAnswer(color, btn));
      choicesEl.appendChild(btn);
    });
  }

  function handleAnswer(selected, btn) {
    if (answered) return;
    answered = true;
    total++;

    if (selected === curColor) {
      score++;
      btn.classList.add('correct');
    } else {
      btn.classList.add('wrong');
      /* Highlight correct answer */
      choicesEl.querySelectorAll('.stroop-opt').forEach(b => {
        if (b.textContent === curColor) b.classList.add('correct');
      });
    }

    updateScore();
    setTimeout(newRound, 680);
  }

  function updateScore() {
    scoreEl.textContent = `Score: ${score} / ${total}`;
  }

  function reset() {
    score = 0;
    total = 0;
    updateScore();
    newRound();
  }

  /* ── Boot ────────────────────────────────────────────────── */
  newRound();

})();
