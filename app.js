import { projects } from './content.js?v=project-links-11';

const $ = selector => document.querySelector(selector);
// A reload always begins at the Identity scene, regardless of the previous hash or restored scroll.
history.scrollRestoration = 'manual';
history.replaceState(history.state, '', `${location.pathname}${location.search}#top`);
window.scrollTo({top:0,behavior:'instant'});
const chapters = [...document.querySelectorAll('.chapter')];
const links = [...document.querySelectorAll('.chapters a')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reduced.matches, world, currentChapter = 0, projectIndex = 0, sound = true, audio, lastTone = 0;
let logoHovered=false,whooshGain,whooshFilter,whooshSource,whooshBuffer,lastScrollWhoosh=-Infinity;

function prepareWhoosh(){
  if(whooshSource||!audio)return;
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);
  const samples=buffer.getChannelData(0);
  // Brown-leaning noise gives the crystalline sweep a soft body, without a sharp hiss.
  let previous=0;
  for(let i=0;i<samples.length;i++){previous=(previous+Math.random()*.12-.06)/1.025;samples[i]=previous*3;}
  whooshBuffer=buffer;whooshSource=audio.createBufferSource();whooshSource.buffer=buffer;whooshSource.loop=true;
  const highpass=audio.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=260;
  whooshFilter=audio.createBiquadFilter();whooshFilter.type='lowpass';whooshFilter.frequency.value=650;whooshFilter.Q.value=.55;
  whooshGain=audio.createGain();whooshGain.gain.value=0;
  whooshSource.connect(highpass).connect(whooshFilter).connect(whooshGain).connect(audio.destination);whooshSource.start();
}
function playScrollWhoosh(){
  if(!sound||!audio||audio.state!=='running'||!whooshBuffer||!motion||performance.now()-lastScrollWhoosh<220)return;
  lastScrollWhoosh=performance.now();
  const now=audio.currentTime,source=audio.createBufferSource(),highpass=audio.createBiquadFilter(),lowpass=audio.createBiquadFilter(),gain=audio.createGain();
  source.buffer=whooshBuffer;highpass.type='highpass';highpass.frequency.value=220;lowpass.type='lowpass';lowpass.frequency.setValueAtTime(420,now);lowpass.frequency.exponentialRampToValueAtTime(1500,now+.1);lowpass.frequency.exponentialRampToValueAtTime(520,now+.34);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.012,now+.035);gain.gain.exponentialRampToValueAtTime(.0001,now+.36);
  source.connect(highpass).connect(lowpass).connect(gain).connect(audio.destination);source.start(now,Math.random()*2,.38);source.stop(now+.4);
  source.onended=()=>{source.disconnect();highpass.disconnect();lowpass.disconnect();gain.disconnect();};
}
function updateWhoosh(){
  if(!whooshGain)return;
  const now=audio.currentTime,active=sound&&logoHovered&&motion&&!document.hidden&&!$('#experienceDialog').open;
  whooshGain.gain.setTargetAtTime(active?.035:0,now,active?.28:.4);
  whooshFilter.frequency.setTargetAtTime(active?1400:500,now,.4);
}
document.addEventListener('visibilitychange',updateWhoosh);

async function unlockSound(){
  if(!sound)return;
  try{audio ||= new (window.AudioContext||window.webkitAudioContext)();prepareWhoosh();if(audio.state!=='running')await audio.resume();updateWhoosh();}
  catch{/* Browser autoplay policy may wait for the first user gesture. */}
}
if(sound)void unlockSound();
document.addEventListener('pointerdown',()=>void unlockSound(),true);
document.addEventListener('keydown',()=>void unlockSound(),true);
document.addEventListener('touchstart',()=>void unlockSound(),{capture:true,passive:true});

function tone(click=false) {
  if(!sound || !audio || audio.state!=='running' || performance.now()-lastTone<95)return;
  lastTone=performance.now();
  const now=audio.currentTime;
  [1046.5,1568,2093].forEach((frequency,index)=>{
    const oscillator=audio.createOscillator(),gain=audio.createGain();
    oscillator.frequency.setValueAtTime(frequency*(click?.75:1),now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency*.96,now+.15);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.012/(index+1),now+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,now+(click?.3:.14));
    oscillator.connect(gain).connect(audio.destination);oscillator.start(now);oscillator.stop(now+.34);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  });
}
async function toggleSound(){
  sound=!sound;
  if(sound)await unlockSound();
  $('#soundToggle').setAttribute('aria-pressed',String(sound));
  $('#soundToggle').innerHTML=`<span class="sound-symbol" aria-hidden="true">♪</span> Sound: ${sound?'On':'Off'}`;
  tone(true);updateWhoosh();
}
$('#soundToggle').addEventListener('click',toggleSound);
document.addEventListener('pointerover',e=>{if(e.target.closest('button,a,[data-reactive]'))tone();});
document.addEventListener('focusin',e=>{if(e.target.closest('button,a'))tone();});
document.addEventListener('click',e=>{if(e.target.closest('button,a'))tone(true);});
function updateMotion(){document.body.classList.toggle('motion-off',!motion);$('#motionToggle').textContent=`Motion: ${motion?'On':'Off'}`;$('#motionToggle').setAttribute('aria-pressed',String(motion));document.documentElement.style.scrollBehavior=motion?'smooth':'auto';world?.setMotion(motion);}
$('#motionToggle').addEventListener('click',()=>{motion=!motion;updateMotion();});
reduced.addEventListener('change',e=>{motion=!e.matches;updateMotion();});updateMotion();

function progressAtScroll(){
  const y=scrollY;
  for(let i=chapters.length-1;i>=0;i--){if(y>=chapters[i].offsetTop-1){const next=chapters[i+1]?.offsetTop??document.documentElement.scrollHeight-innerHeight;return Math.min(3,i+(y-chapters[i].offsetTop)/Math.max(1,next-chapters[i].offsetTop));}}
  return 0;
}
let scrollQueued=false;
function updateScroll(){
  scrollQueued=false;
  const progress=progressAtScroll();world?.setProgress(progress);
  const next=Math.max(0,Math.min(3,Math.round(progress)));
  if(next!==currentChapter)playScrollWhoosh();
  currentChapter=next;
  document.body.dataset.chapter=String(next);
  links.forEach((link,index)=>{if(index===next)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  $('#progress').style.transform=`scaleX(${Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});
addEventListener('resize',updateScroll);
document.fonts.ready.then(updateScroll);
function returnToIdentity(){
  world?.resetHeroRotation();
  const transition=$('#identityTransition');
  transition.classList.remove('is-active');
  void transition.offsetWidth;
  transition.classList.add('is-active');
  document.body.classList.add('is-returning');
  clearTimeout(identityTransitionTimer);
  identityTransitionTimer=setTimeout(()=>{transition.classList.remove('is-active');document.body.classList.remove('is-returning');},1200);
}
let identityTransitionTimer;
document.querySelectorAll('a[href="#top"]').forEach(link=>link.addEventListener('click',returnToIdentity));
let lastLoop=0;
function maybeLoop(delta,target,startScroll=scrollY){
  if(!delta||performance.now()-lastLoop<1200)return;
  if($('#experienceDialog').open||target.closest('form,dialog')||document.activeElement?.matches('input,textarea'))return;
  const cycleStart=chapters[1]?.offsetTop??0;
  const maxScroll=document.documentElement.scrollHeight-innerHeight;
  const crossesBottom=delta>0&&startScroll+innerHeight+delta>=document.documentElement.scrollHeight;
  const crossesCycleStart=delta<0&&startScroll>=cycleStart&&startScroll+delta<=cycleStart;
  if(crossesBottom){lastLoop=performance.now();history.replaceState(null,'','#about');window.scrollTo({top:cycleStart,behavior:'instant'});return true;}
  if(crossesCycleStart){lastLoop=performance.now();history.replaceState(null,'','#contact');window.scrollTo({top:maxScroll,behavior:'instant'});return true;}
  return false;
}
function handleScrollInput(delta,target,startScroll=scrollY){
  if(!delta)return;
  return maybeLoop(delta,target,startScroll);
}
addEventListener('wheel',e=>{if(handleScrollInput(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1),e.target))e.preventDefault();},{passive:false});
let touchY=0,touchStartScroll=0;addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;touchStartScroll=scrollY;},{passive:true});
addEventListener('touchend',e=>{if(handleScrollInput(touchY-e.changedTouches[0].clientY,e.target,touchStartScroll)&&e.cancelable)e.preventDefault();},{passive:false});

const cursor=$('#reticle');
addEventListener('pointermove',e=>{
  if(!motion||e.pointerType==='touch')return;
  const dialogOpen=$('#experienceDialog').open;
  const interactive=e.target.closest('a,button,input,textarea,.glass-panel,dialog');
  const panel=e.target.closest('.glass-panel');
  document.querySelectorAll('.glass-panel.is-parallax').forEach(active=>{if(active!==panel){active.classList.remove('is-parallax');active.style.removeProperty('--panel-x');active.style.removeProperty('--panel-y');}});
  if(panel){
    const r=panel.getBoundingClientRect();
    panel.style.setProperty('--panel-x',`${((e.clientX-r.left)/r.width-.5)*10}px`);
    panel.style.setProperty('--panel-y',`${((e.clientY-r.top)/r.height-.5)*8}px`);
    panel.classList.add('is-parallax');
  }
  world?.setPointer(dialogOpen?0:e.clientX/innerWidth*2-1,dialogOpen?0:1-e.clientY/innerHeight*2,!interactive&&!dialogOpen);
  cursor.style.transform=`translate(${e.clientX-13}px,${e.clientY-13}px)`;
  cursor.style.opacity=interactive||dialogOpen?'0':'.7';
},{passive:true});
document.querySelectorAll('.glass-panel').forEach(panel=>panel.addEventListener('pointerleave',()=>{
  panel.classList.remove('is-parallax');panel.style.removeProperty('--panel-x');panel.style.removeProperty('--panel-y');
}));
addEventListener('blur',()=>world?.setPointer(0,0,false));
document.addEventListener('mouseleave',()=>{world?.setPointer(0,0,false);logoHovered=false;updateWhoosh();cursor.style.opacity='0';});

function showProject(){
  const p=projects[projectIndex],card=document.createElement('div');card.className='project';
  const art=document.createElement('div');art.className='project-art';art.dataset.kind=p.kind;art.setAttribute('aria-hidden','true');
  const note=document.createElement('span');note.textContent=p.note;art.append(note);
  const status=document.createElement('div');status.className='project-status';status.textContent=p.status;
  const title=document.createElement('h3');title.textContent=p.name;
  const description=document.createElement('p');description.textContent=p.description;
  card.append(art,status,title,description);
  if(p.url){const link=document.createElement('a');link.href=p.url;link.target='_blank';link.rel='noopener noreferrer';link.className='line-link';link.textContent=p.linkLabel+' ↗';card.append(link);}
  else{const pending=document.createElement('span');pending.className='project-wait';pending.textContent='Public demo coming later';card.append(pending);}
  card.addEventListener('pointermove',e=>{if(!motion||e.pointerType==='touch')return;const r=card.getBoundingClientRect();card.style.transform=`perspective(900px) rotateX(${-(e.clientY-r.top-r.height/2)/r.height*3}deg) rotateY(${(e.clientX-r.left-r.width/2)/r.width*4}deg)`;});
  card.addEventListener('pointerleave',()=>{card.style.transform='';});
  $('#projectMount').replaceChildren(card);$('#projectCount').textContent=`${String(projectIndex+1).padStart(2,'0')} / ${String(projects.length).padStart(2,'0')}`;
}
$('#projectPrev').addEventListener('click',()=>{projectIndex=(projectIndex-1+projects.length)%projects.length;showProject();});
$('#projectNext').addEventListener('click',()=>{projectIndex=(projectIndex+1)%projects.length;showProject();});showProject();

const dialog=$('#experienceDialog');
$('#experienceOpen').addEventListener('click',()=>{world?.setPointer(0,0,false);logoHovered=false;updateWhoosh();dialog.showModal();document.body.style.overflow='hidden';});
$('#experienceClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.style.overflow='';world?.setPointer(0,0,false);logoHovered=false;updateWhoosh();$('#experienceOpen').focus({preventScroll:true});});
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
$('#contactForm').addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(e.currentTarget);
  const subject=encodeURIComponent(`Portfolio inquiry from ${data.get('name')}`),body=encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`);
  location.href=`mailto:JericGanaban0202@gmail.com?subject=${subject}&body=${body}`;
  $('#formStatus').textContent='Email draft requested. Send it from your email app. If it did not open, use the Email link below.';
});

let timedOut=false;
const loadingStarted=performance.now();let loadingFinish;
const finishLoading=()=>loadingFinish ||= (async()=>{
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,1000-(performance.now()-loadingStarted))));
  $('#loader').setAttribute('aria-busy','false');$('#loader').classList.add('is-done');
  document.body.classList.add('is-arriving');setTimeout(()=>document.body.classList.remove('is-arriving'),1500);
  updateScroll();
})();
const timeout=setTimeout(()=>{timedOut=true;finishLoading();$('#renderNotice').hidden=false;},12000);
try{
  $('#loadStatus').textContent='Forming the frozen identity';
  const {createWorld}=await import('./scene.js?v=frozen-relief-12');
  world=await createWorld($('#world'),{reducedMotion:!motion,onHoverChange(value){logoHovered=value;cursor.classList.toggle('is-over-logo',value);updateWhoosh();}});
  if(timedOut)$('#renderNotice').hidden=true;
  clearTimeout(timeout);finishLoading();
}catch(error){clearTimeout(timeout);console.warn('3D view unavailable:',error.message);$('#renderNotice').hidden=false;await finishLoading();}
