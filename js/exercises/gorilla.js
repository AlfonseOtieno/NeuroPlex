/**
 * NeuroPlex — Gorilla Effect Challenge
 * Sustained attention + inattentional blindness training.
 */

(function GorillaExercise() {
  'use strict';

  const act = ACTIVITIES.find(a => a.id === 'gorilla');
  if (act) {
    document.getElementById('act-icon').textContent = act.icon;
    document.getElementById('chip-row').innerHTML = act.chips.map(c=>`<span class="chip">${c}</span>`).join('');
    document.getElementById('benefits-list').innerHTML = act.benefits.map(b=>`<li>${b}</li>`).join('');
    document.getElementById('instructions-list').innerHTML = act.instructions.map(i=>`<li>${i}</li>`).join('');
  }

  const CONFIGS = { easy:{nShapes:4,speed:1.8,dur:15}, medium:{nShapes:6,speed:2.5,dur:18}, hard:{nShapes:9,speed:3.5,dur:20} };
  let level='easy', running=false, animId=null, shapes=[], gorilla=null;
  let elapsed=0, lastTs=null, gorillaShown=false, gorillaVisible=false;

  const ctrlRow=document.getElementById('ctrl-row');
  const exBody=document.getElementById('exercise-body');

  ctrlRow.innerHTML=`
    <button class="btn btn-primary btn-sm" id="toggle-btn">▶ Start</button>
    <button class="btn btn-ghost btn-sm"   id="reset-btn">↺ Reset</button>`;

  exBody.innerHTML=`
    <div style="font-size:0.8rem;color:var(--cyan);margin-bottom:10px;text-align:center;">
      Track the <strong>CYAN shape</strong>. Did you notice when the unexpected visitor appeared?
    </div>
    <canvas id="gor-canvas" class="ex-canvas" height="300" aria-label="Gorilla effect canvas"></canvas>
    <p id="gor-status" style="text-align:center;font-size:0.85rem;color:var(--text-dim);margin-top:12px;" aria-live="polite">Press Start to begin.</p>`;

  const canvas=document.getElementById('gor-canvas');
  const ctx=canvas.getContext('2d');
  function resize(){ canvas.width=canvas.offsetWidth; } resize();
  window.addEventListener('resize',resize);

  document.getElementById('toggle-btn').addEventListener('click',toggle);
  document.getElementById('reset-btn').addEventListener('click',reset);
  document.querySelectorAll('.diff-btn[data-level]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.diff-btn[data-level]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      level=btn.dataset.level; reset();
    });
  });

  function initShapes(){
    const cfg=CONFIGS[level], W=canvas.width, H=canvas.height;
    shapes=Array.from({length:cfg.nShapes},(_,i)=>({
      x:50+Math.random()*(W-100), y:40+Math.random()*(H-80),
      vx:(Math.random()-0.5)*cfg.speed*2, vy:(Math.random()-0.5)*cfg.speed*2,
      size:22+Math.random()*14,
      shape:['circle','square','triangle'][Math.floor(Math.random()*3)],
      target:i===0
    }));
    gorilla=null; gorillaShown=false; gorillaVisible=false; elapsed=0; lastTs=null;
  }

  function drawShape(ctx,s){
    ctx.fillStyle = s.target ? '#00e5ff' : 'rgba(58,85,112,0.85)';
    if(s.target){ ctx.shadowColor='#00e5ff'; ctx.shadowBlur=14; }
    else ctx.shadowBlur=0;
    ctx.beginPath();
    if(s.shape==='circle'){ ctx.arc(s.x,s.y,s.size/2,0,Math.PI*2); ctx.fill(); }
    else if(s.shape==='square'){ ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size); }
    else { ctx.moveTo(s.x,s.y-s.size/2); ctx.lineTo(s.x+s.size/2,s.y+s.size/2); ctx.lineTo(s.x-s.size/2,s.y+s.size/2); ctx.closePath(); ctx.fill(); }
    ctx.shadowBlur=0;
  }

  function animate(ts){
    if(!running) return;
    const cfg=CONFIGS[level], W=canvas.width, H=canvas.height;
    if(lastTs!==null) elapsed+=Math.min((ts-lastTs)/1000,0.1);
    lastTs=ts;

    ctx.clearRect(0,0,W,H); ctx.fillStyle='#04070f'; ctx.fillRect(0,0,W,H);

    /* Move & draw shapes */
    shapes.forEach(s=>{
      s.x+=s.vx; s.y+=s.vy;
      if(s.x<20||s.x>W-20) s.vx*=-1;
      if(s.y<20||s.y>H-20) s.vy*=-1;
      drawShape(ctx,s);
    });

    /* Spawn gorilla at midpoint */
    if(!gorillaShown && elapsed>cfg.dur/2){
      gorillaShown=true; gorillaVisible=true;
      gorilla={x:-50,y:H/2};
    }
    if(gorillaVisible && gorilla){
      gorilla.x+=3.5;
      ctx.font='44px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🦍',gorilla.x,gorilla.y);
      if(gorilla.x>W+60) gorillaVisible=false;
    }

    /* Status */
    const rem=Math.max(0,Math.ceil(cfg.dur-elapsed));
    const statusEl=document.getElementById('gor-status');
    if(statusEl) statusEl.textContent=rem>0?`${rem}s remaining`:`Round complete — Did you spot the 🦍 gorilla?`;

    if(elapsed>=cfg.dur){ running=false; document.getElementById('toggle-btn').textContent='▶ Start'; return; }
    animId=requestAnimationFrame(animate); NeuroPlex.addTimer(animId);
  }

  function toggle(){
    if(running){ running=false; cancelAnimationFrame(animId); document.getElementById('toggle-btn').textContent='▶ Resume'; }
    else { if(elapsed===0) initShapes(); running=true; document.getElementById('toggle-btn').textContent='⏸ Stop'; animate(performance.now()); }
  }

  function reset(){
    running=false; cancelAnimationFrame(animId); initShapes();
    document.getElementById('toggle-btn').textContent='▶ Start';
    const s=document.getElementById('gor-status'); if(s) s.textContent='Press Start to begin.';
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  initShapes();
})();
