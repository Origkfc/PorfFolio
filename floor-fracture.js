import * as THREE from './assets/vendor/three.module.min.js';

// Small world-space fissures grow across the floor after the panels have disappeared.
export function createFloorFracture(scene){
  const pieces=[];
  let seed=719;
  const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  function add(a,b,at,width){pieces.push({a,b,at,width});}
  for(let spoke=0;spoke<10;spoke++){
    const base=spoke*Math.PI*2/10+random()*.2;
    let angle=base,radius=2.65,a=[Math.cos(angle)*radius,Math.sin(angle)*radius];
    for(let step=0;step<10;step++){
      radius+=.55+random()*.35;angle=base+(random()-.5)*.16;
      const b=[Math.cos(angle)*radius,Math.sin(angle)*radius],at=step/12+spoke*.012;
      add(a,b,at,.045*(1-step/14));
      if(step===3||step===6){
        let from=b;
        for(let fork=0;fork<3;fork++){
          const turn=base+(step===3?1:-1)*(.3+fork*.1);
          const to=[from[0]+Math.cos(turn)*.65,from[1]+Math.sin(turn)*.65];
          add(from,to,at+.04+fork*.035,.025);from=to;
        }
      }
      a=b;
    }
  }
  pieces.sort((a,b)=>a.at-b.at);
  const ribbon=[],edges=[];
  for(const {a,b,width}of pieces){
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/length*width,nz=(b[0]-a[0])/length*width;
    const p=[a[0]+nx,-.154,a[1]+nz],q=[a[0]-nx,-.154,a[1]-nz],r=[b[0]+nx,-.154,b[1]+nz],s=[b[0]-nx,-.154,b[1]-nz];
    ribbon.push(...p,...q,...r,...q,...s,...r);
    edges.push(a[0]+nx,-.148,a[1]+nz,b[0]+nx,-.148,b[1]+nz);
  }
  const trenchGeometry=new THREE.BufferGeometry(),edgeGeometry=new THREE.BufferGeometry();
  trenchGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ribbon,3));
  edgeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(edges,3));
  const dark=new THREE.MeshBasicMaterial({color:'#000307',side:THREE.DoubleSide,transparent:true,opacity:.95,depthWrite:false});
  const ice=new THREE.LineBasicMaterial({color:'#8ad2ff',transparent:true,opacity:.8,depthWrite:false,toneMapped:false});
  const trench=new THREE.Mesh(trenchGeometry,dark),rim=new THREE.LineSegments(edgeGeometry,ice);
  const group=new THREE.Group();group.add(trench,rim);group.visible=false;scene.add(group);
  let progress=0;
  return {
    get progress(){return progress;},
    update(time){
      progress=Math.min(1,Math.max(0,(time-5.2)/2.6));group.visible=progress>0;
      const count=pieces.filter(piece=>piece.at<=progress).length;
      trenchGeometry.setDrawRange(0,count*6);edgeGeometry.setDrawRange(0,count*2);
      ice.opacity=.65+Math.sin(time*9)*.12;
    },
    dispose(){scene.remove(group);trenchGeometry.dispose();edgeGeometry.dispose();dark.dispose();ice.dispose();}
  };
}
