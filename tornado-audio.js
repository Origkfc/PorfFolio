// Reuse the portfolio's unlocked audio context and 50% effects output.
export function createTornadoSound({getContext,getOutput,isEnabled}){
  let wind;
  function stop(){
    if(!wind)return;
    const old=wind;wind=null;const now=old.audio.currentTime;
    old.gain.gain.cancelScheduledValues(now);old.gain.gain.setTargetAtTime(0,now,.018);
    setTimeout(()=>{for(const node of old.sources)try{node.stop();}catch{}old.nodes.forEach(node=>node.disconnect());},100);
  }
  function start(){
    const audio=getContext(),output=getOutput();
    if(wind||!isEnabled()||audio?.state!=='running'||!output)return;
    const source=audio.createBufferSource(),high=audio.createBiquadFilter(),low=audio.createBiquadFilter();
    const gain=audio.createGain(),panner=audio.createStereoPanner(),bass=audio.createOscillator(),bassGain=audio.createGain();
    const pan=audio.createOscillator(),panDepth=audio.createGain();
    const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),samples=buffer.getChannelData(0);
    let previous=0;
    for(let i=0;i<samples.length;i++){previous=(previous+(Math.random()*2-1)*.15)/1.06;samples[i]=previous*2;}
    source.buffer=buffer;source.loop=true;
    high.type='highpass';high.frequency.value=65;low.type='lowpass';low.frequency.value=420;low.Q.value=.45;
    gain.gain.value=.0001;bass.type='triangle';bass.frequency.value=48;bassGain.gain.value=.08;
    pan.frequency.value=.25;panDepth.gain.value=.7;
    source.connect(high).connect(low).connect(panner).connect(gain).connect(output);
    bass.connect(bassGain).connect(gain);pan.connect(panDepth).connect(panner.pan);
    const sources=[source,bass,pan],nodes=[...sources,high,low,gain,panner,bassGain,panDepth];
    wind={audio,gain,low,pan,bass,sources,nodes};
    for(const node of sources){node.start();node.stop(audio.currentTime+9);}
  }
  function update(elapsed){
    if(!isEnabled()){stop();return;}
    start();if(!wind)return;
    const now=wind.audio.currentTime,rise=Math.min(1,elapsed/8);
    wind.gain.gain.setTargetAtTime(.012+.63*rise**2.4,now,.07);
    wind.low.frequency.setTargetAtTime(420+2200*rise*rise,now,.1);
    wind.pan.frequency.setTargetAtTime(.25+2.8*rise*rise,now,.1);
    wind.bass.frequency.setTargetAtTime(48+38*rise,now,.1);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('blur',stop);
  return {start,update,stop};
}
