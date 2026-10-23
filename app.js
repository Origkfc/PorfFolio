import { projects } from './content.js?v=project-links-12';
import { createSpatialPanels } from './spatial.js?v=3';

const $ = selector => document.querySelector(selector);
// A reload always begins at the Identity scene, regardless of the previous hash or restored scroll.
history.scrollRestoration = 'manual';
history.replaceState(history.state, '', `${location.pathname}${location.search}#top`);
window.scrollTo({top:0,behavior:'instant'});
const chapters = [...document.querySelectorAll('.chapter')];
const links = [...document.querySelectorAll('.chapters a')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const spatial = createSpatialPanels(chapters);
let motion = !reduced.matches, world, currentChapter = 0, projectIndex = 0, sound = true, audio, lastTone = 0;
let lastPanelScrollDirection='down',panelTransitionTimer=0;
let panelLoopActive=false,identityReturnInProgress=false;
let logoHovered=false,whooshBuffer,lastScrollWhoosh=-Infinity,lastHoverWhoosh=-Infinity;
let hoverBedSource,hoverBedHighpass,hoverBedLowpass,hoverBedPanner,hoverBedGain,hoverPanLfo,hoverPanDepth,hoverCutoffLfo,hoverCutoffDepth,hoverAudioMode='off',hoverStopTimer=0,hoverIdleTimer=0;
let atmosphereBed,atmosphereBuffer,atmosphereStopTimer=0;
let panelWind;
function softenPanelWind(){
  if(!panelWind)return;
  panelWind.gain.gain.cancelScheduledValues(audio.currentTime);
  panelWind.gain.gain.setTargetAtTime(0,audio.currentTime,.08);
}
function playPanelWind(speed){
  if(!sound||!motion||document.hidden||document.querySelector('dialog[open]')||audio?.state!=='running'||!whooshBuffer)return;
  if(!panelWind){
    const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
    source.buffer=whooshBuffer;source.loop=true;
    filter.type='lowpass';filter.frequency.value=480;filter.Q.value=.3;
    gain.gain.value=0;source.connect(filter).connect(gain).connect(audio.destination);source.start();
    panelWind={source,filter,gain};
  }
  const now=audio.currentTime,level=.004*Math.min(1,Math.abs(speed)/700);
  panelWind.gain.gain.cancelScheduledValues(now);
  panelWind.gain.gain.setTargetAtTime(level,now,.09);
  panelWind.gain.gain.setTargetAtTime(0,now+.08,.16);
}

function syncAtmosphere(){
  const audible=sound&&!document.hidden&&audio?.state==='running';
  clearTimeout(atmosphereStopTimer);
  if(!audible){
    softenPanelWind();
    if(!atmosphereBed)return;
    const bed=atmosphereBed;
    bed.gain.gain.setTargetAtTime(0,audio.currentTime,.18);
    atmosphereStopTimer=setTimeout(()=>{
      if(atmosphereBed!==bed)return;
      bed.source.stop();bed.panMotion.stop();bed.filterMotion.stop();
      bed.nodes.forEach(node=>node.disconnect());atmosphereBed=undefined;
    },1200);
    return;
  }
  if(!atmosphereBed){
    if(!atmosphereBuffer){
      const length=audio.sampleRate*12,blend=Math.floor(audio.sampleRate*.5);
      atmosphereBuffer=audio.createBuffer(1,length,audio.sampleRate);
      const samples=atmosphereBuffer.getChannelData(0);
      let previous=0;
      for(let i=0;i<length;i++){previous=(previous+Math.random()*.12-.06)/1.025;samples[i]=previous*3;}
      // Crossfade the loop seam into the first half-second, then loop from its end.
      for(let i=0;i<blend;i++){const mix=i/(blend-1);samples[length-blend+i]=samples[length-blend+i]*(1-mix)+samples[i]*mix;}
    }
    const source=audio.createBufferSource(),highpass=audio.createBiquadFilter(),lowpass=audio.createBiquadFilter();
    const panner=audio.createStereoPanner(),gain=audio.createGain();
    const panMotion=audio.createOscillator(),panDepth=audio.createGain(),filterMotion=audio.createOscillator(),filterDepth=audio.createGain();
    source.buffer=atmosphereBuffer;source.loop=true;source.loopStart=.5;
    highpass.type='highpass';highpass.frequency.value=140;highpass.Q.value=.4;
    lowpass.type='lowpass';lowpass.frequency.value=540;lowpass.Q.value=.35;
    gain.gain.value=0;
    panMotion.frequency.value=.035;panDepth.gain.value=.32;
    filterMotion.frequency.value=.045;filterDepth.gain.value=100;
    source.connect(highpass).connect(lowpass).connect(panner).connect(gain).connect(audio.destination);
    panMotion.connect(panDepth).connect(panner.pan);filterMotion.connect(filterDepth).connect(lowpass.frequency);
    atmosphereBed={source,gain,panMotion,filterMotion,nodes:[source,highpass,lowpass,panner,gain,panMotion,panDepth,filterMotion,filterDepth]};
    source.start(audio.currentTime,.5);panMotion.start();filterMotion.start();
  }
  const level=logoHovered ? .0018 : document.querySelector('dialog[open]') ? .0025 : .004;
  atmosphereBed.gain.gain.setTargetAtTime(level,audio.currentTime,1.1);
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){clearTimeout(hoverIdleTimer);setHoverAudioMode('off');}
  syncAtmosphere();
});

function prepareWhoosh(){
  if(whooshBuffer||!audio)return;
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);
  const samples=buffer.getChannelData(0);
  // Brown-leaning noise gives the crystalline sweep a soft body, without a sharp hiss.
  let previous=0;
  for(let i=0;i<samples.length;i++){previous=(previous+Math.random()*.12-.06)/1.025;samples[i]=previous*3;}
  whooshBuffer=buffer;
}
function playHoverWhoosh(){
  if(!sound||document.hidden||!audio||audio.state!=='running'||!whooshBuffer||performance.now()-lastHoverWhoosh<140)return;
  lastHoverWhoosh=performance.now();
  const now=audio.currentTime,source=audio.createBufferSource(),highpass=audio.createBiquadFilter(),lowpass=audio.createBiquadFilter(),gain=audio.createGain();
  source.buffer=whooshBuffer;highpass.type='highpass';highpass.frequency.value=280;lowpass.type='lowpass';lowpass.frequency.setValueAtTime(500,now);lowpass.frequency.exponentialRampToValueAtTime(1150,now+.08);lowpass.frequency.exponentialRampToValueAtTime(480,now+.27);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.006,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.28);
  source.connect(highpass).connect(lowpass).connect(gain).connect(audio.destination);source.start(now,Math.random()*2,.3);source.stop(now+.3);
  source.onended=()=>{source.disconnect();highpass.disconnect();lowpass.disconnect();gain.disconnect();};
}
function startHoverBed(){
  if(hoverBedSource||!sound||document.hidden||!audio||audio.state!=='running'||!whooshBuffer)return;
  const now=audio.currentTime;
  hoverBedSource=audio.createBufferSource();hoverBedSource.buffer=whooshBuffer;hoverBedSource.loop=true;
  hoverBedHighpass=audio.createBiquadFilter();hoverBedHighpass.type='highpass';hoverBedHighpass.frequency.value=300;
  hoverBedLowpass=audio.createBiquadFilter();hoverBedLowpass.type='lowpass';hoverBedLowpass.frequency.value=900;hoverBedLowpass.Q.value=.55;
  hoverBedPanner=audio.createStereoPanner();hoverBedGain=audio.createGain();hoverBedGain.gain.value=.0001;
  hoverPanLfo=audio.createOscillator();hoverPanLfo.frequency.value=.075;hoverPanDepth=audio.createGain();hoverPanDepth.gain.value=0;
  hoverCutoffLfo=audio.createOscillator();hoverCutoffLfo.frequency.value=.11;hoverCutoffDepth=audio.createGain();hoverCutoffDepth.gain.value=0;
  hoverBedSource.connect(hoverBedHighpass).connect(hoverBedLowpass).connect(hoverBedPanner).connect(hoverBedGain).connect(audio.destination);
  hoverPanLfo.connect(hoverPanDepth).connect(hoverBedPanner.pan);hoverCutoffLfo.connect(hoverCutoffDepth).connect(hoverBedLowpass.frequency);
  hoverBedSource.onended=()=>{
    for(const node of [hoverBedSource,hoverBedHighpass,hoverBedLowpass,hoverBedPanner,hoverBedGain,hoverPanLfo,hoverPanDepth,hoverCutoffLfo,hoverCutoffDepth])node?.disconnect();
    hoverBedSource=hoverBedHighpass=hoverBedLowpass=hoverBedPanner=hoverBedGain=hoverPanLfo=hoverPanDepth=hoverCutoffLfo=hoverCutoffDepth=undefined;
  };
  hoverBedSource.start(now);hoverPanLfo.start(now);hoverCutoffLfo.start(now);
}
function setHoverAudioMode(mode){
  if(!sound||document.hidden)mode='off';
  hoverAudioMode=mode;
  if(mode==='off'){
    clearTimeout(hoverStopTimer);
    if(hoverBedGain){hoverBedGain.gain.setTargetAtTime(.0001,audio.currentTime,.045);hoverStopTimer=setTimeout(()=>{if(hoverAudioMode==='off'&&hoverBedSource){hoverPanLfo.stop();hoverCutoffLfo.stop();hoverBedSource.stop();}},260);}
    return;
  }
  clearTimeout(hoverStopTimer);startHoverBed();
  if(!hoverBedGain)return;
  const now=audio.currentTime,moving=mode==='moving';
  hoverBedGain.gain.setTargetAtTime(moving?.0045:.0015,now,moving?.055:.16);
  hoverBedLowpass.frequency.setTargetAtTime(moving?1050:510,now,.12);
  hoverPanDepth.gain.setTargetAtTime(moving?.08:.48,now,.2);
  hoverCutoffDepth.gain.setTargetAtTime(moving?0:180,now,.2);
}
function scheduleHoverIdle(){
  clearTimeout(hoverIdleTimer);
  hoverIdleTimer=setTimeout(()=>{if(logoHovered)setHoverAudioMode('idle');},190);
}
function noteLogoMovement(){
  if(!logoHovered)return;
  if(hoverAudioMode!=='moving')setHoverAudioMode('moving');
  scheduleHoverIdle();
}
function handleLogoHover(value){
  const entered=value&&!logoHovered,exited=!value&&logoHovered;
  logoHovered=value;
  if(entered||exited)syncAtmosphere();
  if(entered){playHoverWhoosh();setHoverAudioMode('moving');scheduleHoverIdle();}
  else if(exited){clearTimeout(hoverIdleTimer);setHoverAudioMode('off');playHoverWhoosh();}
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
async function unlockSound(){
  if(!sound)return;
  try{
    if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();audio.addEventListener('statechange',syncAtmosphere);}
    prepareWhoosh();if(audio.state!=='running')await audio.resume();
    syncAtmosphere();
    if(sound&&logoHovered){setHoverAudioMode('moving');scheduleHoverIdle();}
  }
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
  else{clearTimeout(hoverIdleTimer);setHoverAudioMode('off');syncAtmosphere();}
  $('#soundToggle').setAttribute('aria-pressed',String(sound));
  $('#soundToggle').innerHTML=`<span class="sound-symbol" aria-hidden="true">♪</span> Sound: ${sound?'On':'Off'}`;
  tone(true);
}
$('#soundToggle').addEventListener('click',toggleSound);
document.addEventListener('focusin',e=>{if(e.target.closest('button,a'))tone();});
document.addEventListener('click',e=>{if(e.target.closest('button,a'))tone(true);});
function setupLetterFlip(){
  for(const heading of document.querySelectorAll('[data-flip]')){
    const label=heading.innerText.replace(/\s+/g,' ').trim();
    heading.setAttribute('aria-label',label);
    const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    let order=0;
    for(const node of nodes){
      const words=node.textContent.split(/(\s+)/).filter(Boolean).map(text=>{
        if(/^\s+$/.test(text))return document.createTextNode(text);
        const word=document.createElement('span');word.className='flip-word';
        for(const character of text){
          const glyph=document.createElement('span');glyph.className='flip-glyph';glyph.setAttribute('aria-hidden','true');glyph.textContent=character;glyph.style.setProperty('--glyph-order',order++);word.append(glyph);
        }
        return word;
      });
      node.replaceWith(...words);
    }
  }
}
setupLetterFlip();
function updateMotion(){document.body.classList.toggle('motion-off',!motion);document.documentElement.style.scrollBehavior=motion?'smooth':'auto';world?.setMotion(motion);spatial.refresh(motion);}
reduced.addEventListener('change',e=>{motion=!e.matches;cancelPanelScroll();updateMotion();updateScroll();});updateMotion();

function progressAtScroll(){
  const y=scrollY;
  for(let i=chapters.length-1;i>=0;i--){if(y>=chapters[i].offsetTop-1){const next=chapters[i+1]?.offsetTop??document.documentElement.scrollHeight-innerHeight;return Math.min(3,i+(y-chapters[i].offsetTop)/Math.max(1,next-chapters[i].offsetTop));}}
  return 0;
}
function triggerPanelTransition(direction){
  if(!motion)return;
  const transition=$('#panelTransition');
  if(!transition)return;
  transition.dataset.direction=direction;
  transition.classList.remove('is-active');
  void transition.offsetWidth;
  transition.classList.add('is-active');
  clearTimeout(panelTransitionTimer);
  panelTransitionTimer=setTimeout(()=>transition.classList.remove('is-active'),950);
}
let scrollQueued=false;
function updateScroll(){
  scrollQueued=false;
  const {start,length}=loopScrollBounds();
  if(identityReturnInProgress){
    if(scrollY<=1)identityReturnInProgress=false;
  }else if(panelLoopActive&&scrollY<start){
    // Catch native scrolling (keyboard, touch or browser scroll restoration) too.
    const wrappedTop=start+displayedLoopOffset(scrollY-start,length);
    cancelPanelScroll();lastPanelScrollDirection='up';
    window.scrollTo({top:wrappedTop,behavior:'instant'});
  }else if(scrollY>=start){panelLoopActive=true;}
  const spatialState=spatial.update(scrollY);
  const progress=spatialState?.heroProgress??progressAtScroll();world?.setProgress(progress);
  const next=spatialState?.chapter??Math.max(0,Math.min(3,Math.round(progress)));
  currentChapter=next;
  document.body.dataset.chapter=String(next);
  links.forEach((link,index)=>{if(index===next)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  $('#progress').style.transform=`scaleX(${Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
}
addEventListener('scroll',()=>{
  if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}
},{passive:true});
addEventListener('resize',()=>{cancelPanelScroll();spatial.refresh(motion);updateScroll();});
document.fonts.ready.then(()=>{spatial.refresh(motion);updateScroll();});
function returnToIdentity(){
  panelLoopActive=false;identityReturnInProgress=true;cancelPanelScroll();
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
let loopScrollFrame=0,loopScrollPosition=null,loopScrollTarget=null,loopScrollLast=0,touchStartY=0,touchLastY=0,touchMoved=false;
function cancelPanelScroll(){
  softenPanelWind();
  if(loopScrollFrame)cancelAnimationFrame(loopScrollFrame);
  loopScrollFrame=0;loopScrollPosition=loopScrollTarget=null;loopScrollLast=0;
  document.documentElement.style.scrollBehavior=motion?'smooth':'auto';
}
function loopScrollBounds(){
  if(spatial.enabled)return spatial.bounds;
  const start=chapters[1].offsetTop,end=chapters[3].offsetTop;
  return{start,length:Math.max(1,end-start)};
}
function displayedLoopOffset(position,length){
  const offset=((position%length)+length)%length;
  return position>0&&offset<.25?length:offset;
}
function renderLoopScroll(now){
  const elapsed=(now-loopScrollLast)/1000,dt=elapsed>0?Math.min(elapsed,.12):1/60;loopScrollLast=now;
  const {start,length}=loopScrollBounds();
  const previousPosition=loopScrollPosition;
  if(motion)loopScrollPosition+=(loopScrollTarget-loopScrollPosition)*(1-Math.exp(-9*dt));
  else loopScrollPosition=loopScrollTarget;
  if(Math.abs(loopScrollTarget-loopScrollPosition)<.35)loopScrollPosition=loopScrollTarget;
  if(dt>0)playPanelWind((loopScrollPosition-previousPosition)/dt);
  const top=start+displayedLoopOffset(loopScrollPosition,length);
  window.scrollTo({top,behavior:'instant'});
  if(loopScrollPosition===loopScrollTarget){
    loopScrollFrame=0;loopScrollPosition=loopScrollTarget=null;loopScrollLast=0;
    document.documentElement.style.scrollBehavior=motion?'smooth':'auto';
    updateScroll();return;
  }
  loopScrollFrame=requestAnimationFrame(renderLoopScroll);
}
function applyLoopScrollDelta(delta,target){
  if(!delta||!canRoutePanelScroll(target,delta))return false;
  panelLoopActive=true;identityReturnInProgress=false;
  lastPanelScrollDirection=delta>0?'down':'up';
  const {start,length}=loopScrollBounds();
  if(!loopScrollFrame){
    const y=scrollY;
    loopScrollPosition=loopScrollTarget=y<start?(delta<0?length:0):Math.min(length,Math.max(0,y-start));
    loopScrollLast=performance.now();
    document.documentElement.style.scrollBehavior='auto';
  }
  loopScrollTarget+=delta;
  if(Math.abs(loopScrollTarget)>length*100){
    const cycles=Math.trunc(loopScrollTarget/length),offset=cycles*length;
    loopScrollTarget-=offset;loopScrollPosition-=offset;
  }
  if(!loopScrollFrame)loopScrollFrame=requestAnimationFrame(renderLoopScroll);
  return true;
}
function canRoutePanelScroll(target,delta){
  if(document.querySelector('dialog[open]'))return false;
  const scrollables=target instanceof Element?[target.closest('textarea'),spatial.enabled?target.closest('.glass-panel'):null]:[];
  for(const element of scrollables){
    if(!element||element.scrollHeight<=element.clientHeight+1)continue;
    if(delta<0&&element.scrollTop>0)return false;
    if(delta>0&&element.scrollTop+element.clientHeight<element.scrollHeight-1)return false;
  }
  return true;
}
addEventListener('wheel',e=>{
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  if(!delta||!canRoutePanelScroll(e.target,delta))return;
  e.preventDefault();
  applyLoopScrollDelta(delta,e.target);
},{passive:false});
addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]'))return;
  if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(e.code==='Space'&&e.target instanceof Element&&e.target.closest('button'))return;
  if(panelLoopActive&&(e.key==='Home'||e.key==='End')){
    e.preventDefault();cancelPanelScroll();
    lastPanelScrollDirection=e.key==='Home'?'up':'down';
    chapters[e.key==='Home'?1:3].scrollIntoView({behavior:motion?'smooth':'instant'});return;
  }
  const delta=e.key==='ArrowDown'?60:e.key==='ArrowUp'?-60:e.key==='PageDown'?innerHeight*.8:e.key==='PageUp'?-innerHeight*.8:e.code==='Space'?innerHeight*.8*(e.shiftKey?-1:1):0;
  if(delta){e.preventDefault();applyLoopScrollDelta(delta,e.target);}
});
addEventListener('touchstart',e=>{touchStartY=touchLastY=e.touches[0].clientY;touchMoved=false;},{passive:true});
addEventListener('touchmove',e=>{
  const y=e.touches[0].clientY,distance=touchLastY-y;touchLastY=y;
  if(!touchMoved&&Math.abs(touchStartY-y)>4&&canRoutePanelScroll(e.target,distance))touchMoved=true;
  if(touchMoved&&canRoutePanelScroll(e.target,distance)){if(e.cancelable)e.preventDefault();applyLoopScrollDelta(distance,e.target);}
},{passive:false});
addEventListener('touchend',()=>{touchMoved=false;},{passive:true});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{
  const targetChapter=chapters.findIndex(chapter=>`#${chapter.id}`===link.hash);
  if(targetChapter>0){identityReturnInProgress=false;lastPanelScrollDirection=targetChapter>=currentChapter?'down':'up';}
  cancelPanelScroll();
}));

addEventListener('pointermove',e=>{
  if(!motion||e.pointerType==='touch')return;
  const dialogOpen=document.querySelector('dialog[open]')!==null;
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
  noteLogoMovement();
},{passive:true});
document.querySelectorAll('.glass-panel').forEach(panel=>panel.addEventListener('pointerleave',()=>{
  panel.classList.remove('is-parallax');panel.style.removeProperty('--panel-x');panel.style.removeProperty('--panel-y');
}));
addEventListener('blur',()=>{world?.setPointer(0,0,false);handleLogoHover(false);});
document.addEventListener('mouseleave',()=>{world?.setPointer(0,0,false);handleLogoHover(false);});

function showProject(){
  const p=projects[projectIndex],card=document.createElement('div');card.className='project';
  const art=document.createElement('div');art.className='project-art';art.dataset.kind=p.kind;
  if(p.image){const preview=document.createElement('img');preview.className='project-preview';preview.src=p.image;preview.alt=p.imageAlt||`Screenshot of ${p.name}`;preview.loading='lazy';preview.decoding='async';art.append(preview);}
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
const projectHint=$('#projectHint'),projectControls=$('#projectControls');
let projectHintSeen=false,projectHintTimer;
function dismissProjectHint(){
  projectHintSeen=true;clearTimeout(projectHintTimer);projectHintObserver.disconnect();
  projectHint.classList.remove('is-visible');projectHint.setAttribute('aria-hidden','true');projectControls.classList.remove('has-hint');
}
function showProjectHint(){
  if(projectHintSeen)return;
  projectHintSeen=true;projectControls.classList.add('has-hint');projectHint.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>projectHint.classList.add('is-visible'));
  projectHintTimer=setTimeout(dismissProjectHint,4500);
}
const projectHintObserver=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting)){showProjectHint();projectHintObserver.disconnect();}
},{threshold:.45});
projectHintObserver.observe($('#work'));
$('#projectPrev').addEventListener('click',()=>{dismissProjectHint();projectIndex=(projectIndex-1+projects.length)%projects.length;showProject();});
$('#projectNext').addEventListener('click',()=>{dismissProjectHint();projectIndex=(projectIndex+1)%projects.length;showProject();});showProject();

const dialog=$('#experienceDialog');
$('#experienceOpen').addEventListener('click',()=>{world?.setPointer(0,0,false);handleLogoHover(false);dialog.showModal();syncAtmosphere();document.body.style.overflow='hidden';});
$('#experienceClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.style.overflow='';world?.setPointer(0,0,false);handleLogoHover(false);syncAtmosphere();$('#experienceOpen').focus({preventScroll:true});});
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
const origkfcDialog=$('#origkfcDialog');
$('#origkfcOpen').addEventListener('click',()=>{world?.setPointer(0,0,false);handleLogoHover(false);origkfcDialog.showModal();syncAtmosphere();document.body.style.overflow='hidden';});
$('#origkfcClose').addEventListener('click',()=>origkfcDialog.close());
origkfcDialog.addEventListener('close',()=>{document.body.style.overflow='';world?.setPointer(0,0,false);handleLogoHover(false);syncAtmosphere();$('#origkfcOpen').focus({preventScroll:true});});
origkfcDialog.addEventListener('click',e=>{if(e.target!==origkfcDialog)return;const r=origkfcDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)origkfcDialog.close();});
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
  const {createWorld}=await import('./scene.js?v=frozen-relief-33');
  world=await createWorld($('#world'),{reducedMotion:!motion,onHoverChange:handleLogoHover,panelOrbit:{summaries:spatial.summaries,getState:()=>spatial.sceneState,onFrame:spatial.render}});
  spatial.setReady(true);spatial.refresh(motion);
  if(timedOut)$('#renderNotice').hidden=true;
  clearTimeout(timeout);finishLoading();
}catch(error){clearTimeout(timeout);console.warn('3D view unavailable:',error.message);$('#renderNotice').hidden=false;await finishLoading();}
