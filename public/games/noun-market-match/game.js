'use strict';
(() => {
  const SIZE=7, TYPES=6, BASE_TIME=75, MAX_TIME=100;
  const names=['Noun 0','Noun 1','Noun 2','Noun 3','Noun 4','Noun 5'];
  const art=Array.from({length:TYPES},(_,i)=>`assets/noun-${String(i).padStart(4,'0')}.svg`);
  const $=id=>document.getElementById(id);
  const boardEl=$('board'), hintEl=$('hint'), overlay=$('overlay');
  let grid=[], selected=null, score=0, best=0, target=0, progress=0, goal=6, orders=0, time=BASE_TIME;
  let busy=false, running=false, timer=null, lastTick=0, session=0, highlighted=[], soundOn=false, audio=null, drag=null, suppressClick=false;
  try { best=Number(localStorage.getItem('noun-market-best'))||0; } catch (_) {}
  $('best').textContent=best.toLocaleString();
  const random=()=>Math.floor(Math.random()*TYPES);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const adjacent=(a,b)=>Math.abs(Math.floor(a/SIZE)-Math.floor(b/SIZE))+Math.abs(a%SIZE-b%SIZE)===1;
  function scan(g=grid){
    const found=new Set();
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      const i=y*SIZE+x,v=g[i]; if(v===null)continue;
      if(x<SIZE-2 && v===g[i+1] && v===g[i+2]) { let j=x; while(j<SIZE && g[y*SIZE+j]===v)found.add(y*SIZE+j++); }
      if(y<SIZE-2 && v===g[i+SIZE] && v===g[i+SIZE*2]) { let j=y; while(j<SIZE && g[j*SIZE+x]===v)found.add(j++*SIZE+x); }
    }
    return found;
  }
  function swap(a,b,g=grid){[g[a],g[b]]=[g[b],g[a]];}
  function findMove(g=grid){
    for(let i=0;i<g.length;i++)for(const j of [i%SIZE<SIZE-1?i+1:-1,i<SIZE*(SIZE-1)?i+SIZE:-1]){
      if(j<0 || g[i]===g[j])continue;swap(i,j,g);let ok=scan(g).size>0;swap(i,j,g);if(ok)return[i,j];
    }return null;
  }
  function freshBoard(){
    for(let tries=0;tries<250;tries++){
      let g=[];
      for(let i=0;i<SIZE*SIZE;i++){
        let options=Array.from({length:TYPES},(_,n)=>n).filter(v=>!(i%SIZE>=2&&g[i-1]===v&&g[i-2]===v)&&!(i>=SIZE*2&&g[i-SIZE]===v&&g[i-SIZE*2]===v));
        g.push(options[Math.floor(Math.random()*options.length)]);
      }
      if(findMove(g))return g;
    }
    throw Error('Could not generate a playable board');
  }
  function sound(freq=480){
    if(!soundOn)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();let o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=freq;v.gain.setValueAtTime(.0001,audio.currentTime);v.gain.exponentialRampToValueAtTime(.055,audio.currentTime+.02);v.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.17);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+.18)}catch(_){}
  }
  function render(matches=new Set()){
    const activeTile=document.activeElement && document.activeElement.closest('.tile');
    const focusIndex=activeTile && boardEl.contains(activeTile) ? Number(activeTile.dataset.index) : null;
    boardEl.replaceChildren();
    grid.forEach((value,i)=>{
      const button=document.createElement('button');button.type='button';button.className='tile';button.dataset.index=i;button.setAttribute('aria-label',`${names[value]}, row ${Math.floor(i/SIZE)+1}, column ${i%SIZE+1}`);button.setAttribute('aria-pressed',String(selected===i));
      if(selected===i)button.classList.add('selected');if(matches.has(i))button.classList.add('matched');if(highlighted.includes(i))button.classList.add('hinted');
      const img=document.createElement('img');img.src=art[value];img.alt='';img.draggable=false;button.appendChild(img);boardEl.appendChild(button);
    });
    if(focusIndex!==null) boardEl.children[focusIndex]?.focus({preventScroll:true});
    $('score').textContent=score.toLocaleString();$('moves').textContent=`${Math.max(0,Math.ceil(time))}s`;
    $('best').textContent=best.toLocaleString();$('level').textContent=`ORDER ${String(orders+1).padStart(2,'0')}`;$('orderNumber').textContent=String(orders+1).padStart(2,'0');$('targetImage').src=art[target];$('targetImage').alt=names[target];$('targetMini').src=art[target];$('miniText').textContent=`${names[target]} · ${Math.min(goal,progress)} / ${goal}`;$('targetName').textContent=names[target]+'?';$('progressText').textContent=`${Math.min(goal,progress)} / ${goal} collected`;$('progressBar').style.width=`${Math.min(100,progress/goal*100)}%`;
  }
  function showDialog(title,copy,label,action){$('dialog-title').textContent=title;$('dialog-copy').textContent=copy;$('overlay-action').textContent=label;$('overlay-action').onclick=action;overlay.hidden=false;$('overlay-action').focus();}
  function finish(){
    if(!running)return;running=false;clearInterval(timer);timer=null;selected=null;highlighted=[];time=0;
    if(score>best){best=score;try{localStorage.setItem('noun-market-best',best)}catch(_){}}
    render();showDialog('Market’s closed!',`You filled ${orders} ${orders===1?'order':'orders'} and scored ${score.toLocaleString()} points. The Nouns say thank you!`,'Play again',start);
  }
  function start(){
    session++;clearInterval(timer);grid=freshBoard();score=0;target=Math.floor(Math.random()*TYPES);progress=0;goal=6;orders=0;time=BASE_TIME;selected=null;highlighted=[];busy=false;running=true;overlay.hidden=true;hintEl.textContent='Tap one Noun, then a neighbor. You can swipe too.';lastTick=performance.now();
    timer=setInterval(()=>{if(!running)return;let now=performance.now();time-=Math.max(0,(now-lastTick)/1000);lastTick=now;if(time<=0){finish();return;}$('moves').textContent=`${Math.ceil(time)}s`;},250);render();
  }
  async function attempt(a,b){
    if(!running||busy||!adjacent(a,b))return;let token=session;busy=true;highlighted=[];selected=null;swap(a,b);let matched=scan();render();
    if(!matched.size){sound(190);hintEl.textContent='No match there—try a different neighbor.';await sleep(180);if(token!==session||!running)return;swap(a,b);render();busy=false;return;}
    let chain=0;
    while(matched.size && token===session && running){
      chain++;sound(420+chain*90);render(matched);let collected=0;for(const i of matched)if(grid[i]===target)collected++;
      score+=matched.size*50*chain;progress+=collected;
      if(progress>=goal){orders++;score+=500;time=Math.min(MAX_TIME,time+10);target=(target+1+Math.floor(Math.random()*(TYPES-1)))%TYPES;progress=0;goal=Math.min(12,6+Math.floor(orders/2));hintEl.textContent='Order complete! +10 seconds and 500 points. New order!';}
      else hintEl.textContent=chain>1?`${chain}× cascade! Keep the market moving.`:`Nice match! ${matched.size*50} points.`;
      await sleep(240);if(token!==session||!running)return;
      for(const i of matched)grid[i]=null;
      for(let x=0;x<SIZE;x++){let column=[];for(let y=SIZE-1;y>=0;y--){const v=grid[y*SIZE+x];if(v!==null)column.push(v);}while(column.length<SIZE)column.push(random());for(let y=SIZE-1,k=0;y>=0;y--,k++)grid[y*SIZE+x]=column[k];}
      render();await sleep(160);if(token!==session||!running)return;matched=scan();
    }
    if(!findMove()){grid=freshBoard();hintEl.textContent='The market got a fresh board—keep going!';}busy=false;render();
  }
  function choose(i){if(!running||busy||i<0)return;highlighted=[];if(selected===null){selected=i;render();return}if(selected===i){selected=null;render();return}if(adjacent(selected,i)){let a=selected;attempt(a,i);}else{selected=i;render();}}
  boardEl.addEventListener('keydown',e=>{const tile=e.target.closest('.tile');if(!tile)return;const i=Number(tile.dataset.index);let n=-1;if(e.key==='ArrowLeft'&&i%SIZE>0)n=i-1;if(e.key==='ArrowRight'&&i%SIZE<SIZE-1)n=i+1;if(e.key==='ArrowUp'&&i>=SIZE)n=i-SIZE;if(e.key==='ArrowDown'&&i<SIZE*(SIZE-1))n=i+SIZE;if(n>=0){e.preventDefault();boardEl.children[n].focus({preventScroll:true});}});
  boardEl.addEventListener('click',e=>{if(suppressClick){suppressClick=false;return}const tile=e.target.closest('.tile');if(tile)choose(Number(tile.dataset.index));});
  boardEl.addEventListener('pointerdown',e=>{const tile=e.target.closest('.tile');if(tile)drag={i:Number(tile.dataset.index),x:e.clientX,y:e.clientY,pointer:e.pointerId};});
  boardEl.addEventListener('pointerup',e=>{if(!drag||drag.pointer!==e.pointerId)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;const a=drag.i;drag=null;if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;suppressClick=true;setTimeout(()=>suppressClick=false,50);let b;if(Math.abs(dx)>Math.abs(dy))b=(dx>0&&a%SIZE<SIZE-1)?a+1:(dx<0&&a%SIZE>0)?a-1:-1;else b=(dy>0&&a<SIZE*(SIZE-1))?a+SIZE:(dy<0&&a>=SIZE)?a-SIZE:-1;if(b>=0)attempt(a,b);});
  boardEl.addEventListener('pointercancel',()=>{drag=null});
  $('restart').onclick=start;
  $('hintButton').onclick=()=>{if(!running||busy)return;const move=findMove();if(move){selected=null;highlighted=move;hintEl.textContent='Try swapping the glowing neighbors.';render();}};
  $('sound').onclick=()=>{soundOn=!soundOn;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');$('sound').querySelector('span').textContent=soundOn?'ON':'OFF';if(soundOn)sound()};
  grid=freshBoard();render();showDialog('Market is open!','Match lines of three or more. Fill changing Noun orders to earn bonus time. How many can you serve in 75 seconds?','Start playing',start);
})();
