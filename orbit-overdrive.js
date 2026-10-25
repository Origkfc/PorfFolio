// Five complete, uninterrupted desktop orbits; a pause or reversal starts a fresh count.
export function createOrbitOverdrive(onShutdown,tornadoSound){
  let travel=0,lastPhase=null,startedAt=null,startPhase=0,direction=1,finished=false,finalPhase=0;
  let lastMovementAt=null,lastDirection=0;
  const main=document.querySelector('main');
  let debris=[];
  function gatherWords(){
    debris=[...document.querySelectorAll('.masthead > *, .top-right > span, .hud button, .hud a, .world-readout')].flatMap((element,index)=>{
      const rect=element.getBoundingClientRect();
      const style=getComputedStyle(element);
      if(!rect.width||!rect.height||style.visibility==='hidden'||Number(style.opacity)<.01)return [];
      return [{element,index,x:rect.x+rect.width/2,y:rect.y+rect.height/2,alpha:Number(style.opacity),transform:element.style.transform,opacity:element.style.opacity}];
    });
  }
  function moveWords(elapsed){
    const strength=elapsed<1.5?.08*elapsed/1.5:elapsed<3.5?.08+.52*((elapsed-1.5)/2)**2:.6+.4*Math.min(1,(elapsed-3.5)/1.5);
    document.body.style.setProperty('--quake-x',`${Math.sin(elapsed*83)*strength*12}px`);
    document.body.style.setProperty('--quake-y',`${Math.cos(elapsed*107)*strength*8}px`);
    const targetX=Number(document.body.style.getPropertyValue('--tornado-center-x'))||innerWidth*.25;
    const targetY=Number(document.body.style.getPropertyValue('--tornado-center-y'))||innerHeight*.43;
    for(const word of debris){
      const p=Math.min(1,Math.max(0,(elapsed-1.8-word.index*.055)/2.25)),pull=p*p;
      const angle=direction*pull*8,dx=word.x-targetX,dy=word.y-targetY;
      const x=targetX+(dx*Math.cos(angle)-dy*Math.sin(angle))*(1-pull)-word.x;
      const y=targetY+(dx*Math.sin(angle)+dy*Math.cos(angle))*(1-pull)-word.y;
      word.element.style.transform=`translate3d(${x}px,${y}px,0) rotate(${direction*pull*420}deg) scale(${1-pull*.995})`;
      word.element.style.opacity=String(word.alpha*(1-pull));
    }
  }
  function cancel(){
    startedAt=null;travel=0;lastPhase=null;lastMovementAt=null;lastDirection=0;
    tornadoSound?.stop();
    document.body.classList.remove('orbit-overdrive');if(main)main.inert=false;
    document.body.style.removeProperty('--quake-x');document.body.style.removeProperty('--quake-y');
    for(const word of debris){word.element.style.transform=word.transform;word.element.style.opacity=word.opacity;}debris=[];
  }
  return {
    observe(state){
      if(startedAt!==null||finished)return;
      if(!state.enabled||state.reveal<.98){lastPhase=null;travel=0;lastMovementAt=null;lastDirection=0;return;}
      if(lastPhase===null){lastPhase=state.phase;return;}
      const delta=((state.phase-lastPhase+1.5)%3+3)%3-1.5;
      lastPhase=state.phase;
      if(Math.abs(delta)<.001)return;
      const now=performance.now(),nextDirection=Math.sign(delta);
      if(lastMovementAt!==null&&now-lastMovementAt>=1000||lastDirection&&nextDirection!==lastDirection)travel=0;
      lastMovementAt=now;lastDirection=nextDirection;travel+=Math.abs(delta);
      if(travel+1e-6<15)return;
      startedAt=performance.now();startPhase=state.phase;direction=delta<0?-1:1;
      document.body.classList.add('orbit-overdrive');if(main)main.inert=true;
      gatherWords();
      tornadoSound?.start();
    },
    sample(state){
      if(startedAt===null){
        if(!finished&&lastMovementAt!==null&&performance.now()-lastMovementAt>=1000){travel=0;lastPhase=null;lastDirection=0;lastMovementAt=null;}
        return finished?{...state,phase:finalPhase,reveal:1,overdrive:1,overdriveTime:8,ingest:1}:state;
      }
      if(!state.enabled){cancel();return state;}
      const elapsed=Math.min(8,Math.max(0,(performance.now()-startedAt)/1000));
      const phase=startPhase+direction*(.8*elapsed+1.1*elapsed*elapsed);
      moveWords(elapsed);
      tornadoSound?.update(elapsed);
      if(elapsed>=8){finalPhase=phase;finished=true;startedAt=null;tornadoSound?.stop();onShutdown();}
      const pull=Math.min(1,Math.max(0,(elapsed-.15)/4.85));
      return {...state,phase,reveal:1,overdrive:Math.min(1,elapsed/3.5),overdriveTime:elapsed,ingest:pull*pull*(3-2*pull)};
    },
  };
}
