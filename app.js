import { projects } from './content.js';

const $ = selector => document.querySelector(selector);
const chapters = [...document.querySelectorAll('.chapter')];
const links = [...document.querySelectorAll('.chapters a')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reduced.matches, world, currentChapter = 0, projectIndex = 0, sound = false, audio, lastTone = 0;
let logoHovered=false,whooshGain,whooshFilter,whooshSource;

function prepareWhoosh(){
  if(whooshSource||!audio)return;
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);
  const samples=buffer.getChannelData(0);
  // Brown-leaning noise gives the crystalline sweep a soft body, without a sharp hiss.
  let previous=0;
  for(let i=0;i<samples.length;i++){previous=(previous+Math.random()*.12-.06)/1.025;samples[i]=previous*3;}
  whooshSource=audio.createBufferSource();whooshSource.buffer=buffer;whooshSource.loop=true;
  const highpass=audio.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=180;
  whooshFilter=audio.createBiquadFilter();whooshFilter.type='lowpass';whooshFilter.frequency.value=700;whooshFilter.Q.value=.7;
  whooshGain=audio.createGain();whooshGain.gain.value=0;
  whooshSource.connect(highpass).connect(whooshFilter).connect(whooshGain).connect(audio.destination);whooshSource.start();
}
function updateWhoosh(){
  if(!whooshGain)return;
  const now=audio.currentTime,active=sound&&logoHovered&&motion&&!document.hidden;
  whooshGain.gain.setTargetAtTime(active?.13:0,now,active?.12:.18);
  whooshFilter.frequency.setTargetAtTime(active?2300:550,now,.28);
}
document.addEventListener('visibilitychange',updateWhoosh);

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
$('#soundToggle').addEventListener('click',async()=>{
  try{audio ||= new (window.AudioContext||window.webkitAudioContext)();await audio.resume();prepareWhoosh();sound=!sound;}
  catch{sound=false;}
  $('#soundToggle').setAttribute('aria-pressed',String(sound));
  $('#soundToggle').innerHTML=`<span class="sound-symbol" aria-hidden="true">♪</span> Sound: ${sound?'On':'Off'}`;tone(true);updateWhoosh();
});
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
let bottomReached=0,scrollQueued=false;
function updateScroll(){
  scrollQueued=false;
  const progress=progressAtScroll();world?.setProgress(progress);
  const next=Math.max(0,Math.min(3,Math.round(progress)));
  currentChapter=next;
  document.body.dataset.chapter=String(next);
  links.forEach((link,index)=>{if(index===next)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  $('#chapterNumber').textContent=`0${next+1} / 04`;
  $('#scrollHint').textContent=next===3?'Keep scrolling to return ↻':'Scroll to explore ↓';
  $('#progress').style.transform=`scaleX(${Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
  const atBottom=scrollY+innerHeight>=document.documentElement.scrollHeight-5;
  if(atBottom&&!bottomReached)bottomReached=performance.now();else if(!atBottom)bottomReached=0;
}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});
addEventListener('resize',updateScroll);
document.fonts.ready.then(updateScroll);
function navigate(index){const chapter=chapters[(index+chapters.length)%chapters.length];location.hash=chapter.id;chapter.scrollIntoView({behavior:motion?'smooth':'instant'});}
$('#previousChapter').addEventListener('click',()=>navigate(currentChapter-1));
$('#nextChapter').addEventListener('click',()=>navigate(currentChapter+1));
let lastLoop=0;
function maybeLoop(delta,target){
  if(delta<=0||!bottomReached||performance.now()-bottomReached<900||performance.now()-lastLoop<2000)return;
  if($('#experienceDialog').open||target.closest('form,dialog')||document.activeElement?.matches('input,textarea'))return;
  lastLoop=performance.now();bottomReached=0;history.replaceState(null,'','#top');window.scrollTo({top:0,behavior:'instant'});world?.setProgress(0);updateScroll();
}
addEventListener('wheel',e=>maybeLoop(e.deltaY,e.target),{passive:true});
let touchY=0;addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;},{passive:true});
addEventListener('touchend',e=>maybeLoop(touchY-e.changedTouches[0].clientY,e.target),{passive:true});

const cursor=$('#reticle');
addEventListener('pointermove',e=>{
  if(!motion||e.pointerType==='touch')return;
  const interactive=e.target.closest('a,button,input,textarea,.glass-panel');
  world?.setPointer(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2,!interactive);
  cursor.style.transform=`translate(${e.clientX-13}px,${e.clientY-13}px)`;
  cursor.style.opacity=e.target.closest('a,button,input,textarea,.glass-panel')?'0':'.7';
},{passive:true});
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
$('#experienceOpen').addEventListener('click',()=>{dialog.showModal();document.body.style.overflow='hidden';});
$('#experienceClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.style.overflow='';$('#experienceOpen').focus({preventScroll:true});});
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
$('#contactForm').addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(e.currentTarget);
  const subject=encodeURIComponent(`Portfolio inquiry from ${data.get('name')}`),body=encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`);
  location.href=`mailto:JericGanaban0202@gmail.com?subject=${subject}&body=${body}`;
  $('#formStatus').textContent='Email draft requested. Send it from your email app. If it did not open, use the Email link below.';
});

let timedOut=false;
const finishLoading=()=>{$('#loader').classList.add('is-done');updateScroll();};
const timeout=setTimeout(()=>{timedOut=true;finishLoading();$('#renderNotice').hidden=false;},12000);
try{
  $('#loadStatus').textContent='Forming the frozen identity';
  const {createWorld}=await import('./scene.js?v=frozen-relief-4');
  world=await createWorld($('#world'),{reducedMotion:!motion,onHoverChange(value){logoHovered=value;cursor.classList.toggle('is-over-logo',value);updateWhoosh();}});
  if(timedOut)$('#renderNotice').hidden=true;
  clearTimeout(timeout);finishLoading();
}catch(error){clearTimeout(timeout);console.warn('3D view unavailable:',error.message);$('#renderNotice').hidden=false;finishLoading();}
