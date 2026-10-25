export function playTvStartup(audio,output){
  const now=audio.currentTime,hum=audio.createOscillator(),gain=audio.createGain();
  hum.type='sine';hum.frequency.setValueAtTime(65,now);hum.frequency.exponentialRampToValueAtTime(920,now+.36);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.04);gain.gain.exponentialRampToValueAtTime(.0001,now+.62);
  hum.connect(gain).connect(output);hum.start(now);hum.stop(now+.65);
  hum.onended=()=>{hum.disconnect();gain.disconnect();};
  const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.12),audio.sampleRate),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length);
  const relay=audio.createBufferSource(),filter=audio.createBiquadFilter(),click=audio.createGain();
  relay.buffer=buffer;filter.type='lowpass';filter.frequency.value=1400;click.gain.value=.065;
  relay.connect(filter).connect(click).connect(output);relay.start(now);relay.stop(now+.12);
  relay.onended=()=>{relay.disconnect();filter.disconnect();click.disconnect();};
}
