/**
 * NeuroPlex — Reverse Recall
 * Working memory exercise: remember and reverse a digit sequence.
 */

(function ReverseRecallExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'reverse-recall');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML = act.chips.map(c=>`<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML = act.benefits.map(b=>`<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML = act.instructions.map(i=>`<li>${i}</li>`).join('');
  }

  const LENGTHS = { easy:4, medium:6, hard:9 };
  let level='easy', seqLen=4, seq=[], reversed=[], userInput=[], phase='idle';

  const ctrlRow = document.getElementById('ctrl-row');
  const exBody  = document.getElementById('exercise-body');

  ctrlRow.innerHTML = `<button class="btn btn-primary btn-sm" id="go-btn">▶ Start Round</button>`;
  document.getElementById('go-btn').addEventListener('click', newRound);

  document.querySelectorAll('.diff-btn[data-level]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.diff-btn[data-level]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level=btn.dataset.level; seqLen=LENGTHS[level]; renderIdle();
    });
  });

  /* ── Phases ──────────────────────────────────────────────── */
  function newRound(){
    seq = Array.from({length:seqLen},()=>Math.floor(Math.random()*10));
    reversed = [...seq].reverse();
    userInput = [];
    phase = 'show';
    renderShow();

    let i = 0;
    const id = setInterval(()=>{
      i++;
      const boxes = exBody.querySelectorAll('.recall-box');
      if(boxes[i-1]) boxes[i-1].classList.add('revealed'), boxes[i-1].textContent=seq[i-1];
      if(i >= seq.length){ clearInterval(id); setTimeout(()=>{ phase='input'; renderInput(); }, 700); }
    }, 650);
    NeuroPlex.addTimer(id);
  }

  function renderIdle(){
    phase='idle';
    exBody.innerHTML=`
      <div style="text-align:center;padding:28px 0;">
        <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:18px;">Select difficulty, then press Start Round.</p>
        <button class="btn btn-primary" id="idle-start">▶ Start Round</button>
      </div>`;
    document.getElementById('idle-start').addEventListener('click',newRound);
  }

  function renderShow(){
    exBody.innerHTML=`
      <div>
        <p style="text-align:center;font-size:0.82rem;color:var(--text-dim);margin-bottom:12px;">Memorize this sequence:</p>
        <div class="recall-sequence-row">
          ${seq.map((_,i)=>`<div class="recall-box" id="rb-${i}">?</div>`).join('')}
        </div>
        <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:10px;">Revealing one by one…</p>
      </div>`;
  }

  function renderInput(){
    exBody.innerHTML=`
      <div>
        <p style="text-align:center;font-size:0.82rem;color:var(--text-dim);margin-bottom:8px;">Original sequence (for reference):</p>
        <div class="recall-sequence-row" style="opacity:0.35;margin-bottom:4px;">
          ${seq.map(n=>`<div class="recall-box revealed">${n}</div>`).join('')}
        </div>
        <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-bottom:14px;">
          Reversed: ${reversed.join(' → ')}
        </p>
        <p style="text-align:center;font-size:0.82rem;color:var(--cyan);margin-bottom:10px;">Enter the sequence in REVERSE order:</p>
        <div class="recall-input-row" id="input-row">
          ${reversed.map((_,i)=>`<div class="recall-input-box" id="ib-${i}">_</div>`).join('')}
        </div>
        <div class="numpad">
          ${[0,1,2,3,4,5,6,7,8,9].map(d=>`<button class="numpad-btn" data-d="${d}">${d}</button>`).join('')}
          <button class="numpad-btn del-btn" id="del-btn">⌫</button>
        </div>
        <p class="recall-feedback" id="feedback" aria-live="polite"></p>
        <div style="text-align:center;margin-top:12px;">
          <button class="btn btn-ghost btn-sm" id="try-again">↺ New Round</button>
        </div>
      </div>`;

    exBody.querySelectorAll('.numpad-btn[data-d]').forEach(btn=>{
      btn.addEventListener('click',()=>inputDigit(parseInt(btn.dataset.d)));
    });
    document.getElementById('del-btn').addEventListener('click',deleteDigit);
    document.getElementById('try-again').addEventListener('click',newRound);
  }

  function inputDigit(d){
    if(phase!=='input'||userInput.length>=reversed.length) return;
    userInput.push(d);
    const box = document.getElementById(`ib-${userInput.length-1}`);
    if(box) box.textContent=d;

    if(userInput.length===reversed.length){
      const ok = reversed.every((v,i)=>v==userInput[i]);
      const fb = document.getElementById('feedback');
      if(ok){
        fb.innerHTML='<span style="color:var(--green)">✓ Correct! Well done.</span>';
        document.querySelectorAll('.recall-input-box').forEach(b=>b.style.borderColor='var(--green)');
      } else {
        fb.innerHTML=`<span style="color:var(--orange)">Not quite. Try again ↺</span>`;
        document.querySelectorAll('.recall-input-box').forEach(b=>b.style.borderColor='rgba(255,107,53,0.5)');
      }
    }
  }

  function deleteDigit(){
    if(!userInput.length) return;
    const i = userInput.length - 1;
    userInput.pop();
    const box = document.getElementById(`ib-${i}`);
    if(box){ box.textContent='_'; box.style.borderColor=''; }
    const fb=document.getElementById('feedback');
    if(fb) fb.textContent='';
  }

  /* ── Boot ─────────────────────────────────────────────────── */
  renderIdle();
})();
