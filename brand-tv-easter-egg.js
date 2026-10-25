// Brand easter egg: twenty normal activations per page load.
const brand=document.querySelector('a.brand');
let clicks=0,restarting=false,reloadScheduled=false,tvAudio;

function playTvOffSound(){
  if(document.querySelector('#soundToggle')?.getAttribute('aria-pressed')==='false')return;
  try{
    const Context=window.AudioContext||window.webkitAudioContext;
    const audio=new Context(),now=audio.currentTime,master=audio.createGain();
    tvAudio=audio;
    master.gain.value=.5;master.connect(audio.destination);
    const whine=audio.createOscillator(),whineGain=audio.createGain();
    whine.type='sine';whine.frequency.setValueAtTime(1450,now);
    whine.frequency.exponentialRampToValueAtTime(55,now+.48);
    whineGain.gain.setValueAtTime(.0001,now);
    whineGain.gain.exponentialRampToValueAtTime(.055,now+.018);
    whineGain.gain.exponentialRampToValueAtTime(.0001,now+.52);
    whine.connect(whineGain).connect(master);whine.start(now);whine.stop(now+.55);
    const noise=audio.createBuffer(1,Math.ceil(audio.sampleRate*.09),audio.sampleRate),samples=noise.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length);
    const click=audio.createBufferSource(),filter=audio.createBiquadFilter(),clickGain=audio.createGain();
    click.buffer=noise;filter.type='lowpass';filter.frequency.value=1300;filter.Q.value=.4;
    clickGain.gain.setValueAtTime(.0001,now);
    clickGain.gain.exponentialRampToValueAtTime(.11,now+.004);
    clickGain.gain.exponentialRampToValueAtTime(.0001,now+.085);
    click.connect(filter).connect(clickGain).connect(master);click.start(now);click.stop(now+.09);
    audio.resume().catch(()=>{});setTimeout(()=>audio.close().catch(()=>{}),900);
  }catch{ /* Keep the shutdown visual usable when browser audio is unavailable. */ }
}

function reloadAfterBlackout(){
  if(reloadScheduled)return;
  reloadScheduled=true;
  document.dispatchEvent(new Event('portfolio:blackout'));
  if(tvAudio&&tvAudio.state!=='closed')void tvAudio.close().catch(()=>{});
  setTimeout(()=>location.reload(),2000);
}

function fallbackShutdown(){
  const overlay=document.createElement('div');
  overlay.className='crt-fallback';overlay.setAttribute('aria-hidden','true');
  document.body.append(overlay);
  document.documentElement.classList.add('tv-is-off');
  setTimeout(reloadAfterBlackout,matchMedia('(prefers-reduced-motion: reduce)').matches?180:760);
}

export function triggerTvShutdown(){
  if(restarting)return;
  restarting=true;
  playTvOffSound();
  if(!document.startViewTransition){fallbackShutdown();return;}
  try{
    let transition;
    transition=document.startViewTransition(()=>{
      document.documentElement.classList.add('tv-is-off');
      setTimeout(()=>{transition.skipTransition();reloadAfterBlackout();},matchMedia('(prefers-reduced-motion: reduce)').matches?180:760);
    });
    transition.finished.catch(()=>{});
  }catch{fallbackShutdown();}
}

brand?.addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  if(!restarting&&++clicks<20)return;
  event.preventDefault();event.stopImmediatePropagation();
  triggerTvShutdown();
},{capture:true});
