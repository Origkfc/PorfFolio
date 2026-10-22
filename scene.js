import * as THREE from './assets/vendor/three.module.min.js';

// Procedural environment with the supplied logo as its particle sculpture.
export async function createWorld(host, { reducedMotion = false, onHoverChange = () => {} } = {}) {
  const mobile = matchMedia('(max-width:700px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#aebcc9');
  scene.fog = new THREE.FogExp2('#aebcc9', .047);
  const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, .1, 100);
  const root = new THREE.Group();
  scene.add(root);
  const random = (() => { let n = 821; return () => { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; }; })();
  const ice = new THREE.MeshStandardMaterial({ color: '#a8c5d9', metalness: .48, roughness: .22 });
  const stone = new THREE.MeshStandardMaterial({ color: '#8193a4', roughness: .78, metalness: .18, envMapIntensity: .7 });
  const lightMaterial = new THREE.MeshBasicMaterial({ color: '#e2f6ff' });
  scene.add(new THREE.HemisphereLight('#f0f8ff', '#43586d', 1.2));
  const sun = new THREE.DirectionalLight('#edf8ff', 2.8);
  sun.position.set(-3, 8, 5);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .1, far: 25 });
  sun.shadow.bias = -.001;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#c0e6ff', 3.5);
  rim.position.set(3, 4, -4); scene.add(rim);

  // Studio softboxes reflected in the icy facets, with no external texture dependency.
  const studio = new THREE.Scene(); studio.background = new THREE.Color('#a1b2c0');
  for (const [x,y,z,sx,sy] of [[-4,4,2,3,7],[4,3,-3,2,6],[0,7,0,8,8]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(sx,sy), new THREE.MeshBasicMaterial({color:'#ffffff', side:THREE.DoubleSide}));
    panel.position.set(x,y,z); panel.lookAt(0,2,0); studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .04);
  scene.environment = environment.texture; pmrem.dispose();

  const textureCanvas = document.createElement('canvas'); textureCanvas.width = textureCanvas.height = 256;
  const tc = textureCanvas.getContext('2d'); const noise = tc.createImageData(256,256);
  for(let i=0;i<noise.data.length;i+=4){const v=130+random()*95;noise.data[i]=noise.data[i+1]=noise.data[i+2]=v;noise.data[i+3]=255;}
  tc.putImageData(noise,0,0);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(18,18);
  stone.bumpMap=texture;stone.bumpScale=.065;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(180,180), stone);
  floor.rotation.x=-Math.PI/2;floor.position.y=-.18;floor.receiveShadow=true;scene.add(floor);
  // Low glacial ridges surround the chamber and disappear into atmospheric depth.
  const terrain = new THREE.PlaneGeometry(100,100,110,110); terrain.rotateX(-Math.PI/2);
  const tv = terrain.attributes.position;
  for(let i=0;i<tv.count;i++){
    const x=tv.getX(i), z=tv.getZ(i), r=Math.hypot(x,z);
    const envelope=THREE.MathUtils.smoothstep(r,7,19);
    const hill=(Math.sin(x*.25+Math.cos(z*.24))*Math.cos(z*.19)+Math.sin(x*.5+z*.3)*.32+1.3)*2.2;
    tv.setY(i,envelope*hill-.25+random()*.09*envelope);
  }
  terrain.computeVertexNormals();
  const landscape=new THREE.Mesh(terrain,stone);landscape.receiveShadow=true;scene.add(landscape);

  function ring(radius, tube, y, material=lightMaterial){const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,160),material);mesh.rotation.x=Math.PI/2;mesh.position.y=y;root.add(mesh);return mesh;}
  function pedestal(radius,height,y){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius+.1,height,128),stone);mesh.position.y=y;mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);return mesh;}
  if(mobile)pedestal(1.8,.18,.02);
  else{
    pedestal(2.6,.32,.02);pedestal(2.27,.27,.3);pedestal(1.97,.22,.55);
    ring(2.29,.022,.44);ring(1.99,.026,.67);
  }
  if(!mobile){
    for(let i=0;i<4;i++){ring(3.6+i*1.35,.045,-.10,ice);ring(3.63+i*1.35,.014,-.04);}
    const overhead=ring(3.4,.075,7.4);overhead.rotation.z=.12;
    ring(3.54,.025,7.4,ice);
  }
  // Fine radial inlays on the plinth give the floor a real scale.
  const tickPositions=[];
  for(let i=0;i<100;i++){const a=i/100*Math.PI*2;tickPositions.push(Math.cos(a)*2.38,.19,Math.sin(a)*2.38,Math.cos(a)*2.49,.19,Math.sin(a)*2.49);}
  const ticksGeometry=new THREE.BufferGeometry();ticksGeometry.setAttribute('position',new THREE.Float32BufferAttribute(tickPositions,3));
  if(!mobile)root.add(new THREE.LineSegments(ticksGeometry,new THREE.LineBasicMaterial({color:'#526c80',transparent:true,opacity:.5})));

  const source=new Image();source.src='assets/origkfc-icon.png';
  await source.decode();
  const resolution=360;
  const sample=document.createElement('canvas');sample.width=sample.height=resolution;
  const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(source,0,0,resolution,resolution);
  const pixels=sc.getImageData(0,0,resolution,resolution).data;
  const candidates=[];let minX=resolution,minY=resolution,maxX=0,maxY=0;
  for(let y=0;y<resolution;y++){for(let x=0;x<resolution;x++){
    const i=(y*resolution+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    // The approved icon is already transparent. Preserve its white letters and fine contours.
    if(pixels[i+3]>110){
      candidates.push({x,y,r,g,b});minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
  }}
  if(candidates.length<100)throw new Error('Logo silhouette has insufficient samples.');
  const count=mobile?32000:82000;
  const position=new Float32Array(count*3),scatter=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count);
  const sculpture=new THREE.Group();sculpture.position.y=2.92;root.add(sculpture);
  const bodyHeight=4.6,scale=bodyHeight/(maxY-minY),centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
  // Invisible hit surface; the visible mark is entirely made of lit particles.
  const logoPlane=new THREE.Mesh(
    new THREE.PlaneGeometry((maxX-minX)*scale,bodyHeight),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,colorWrite:false})
  );
  logoPlane.position.z=.85;sculpture.add(logoPlane);
  const normals=new Float32Array(count*3),seeds=new Float32Array(count);
  const luminance=(x,y)=>{const i=(Math.max(0,Math.min(resolution-1,y))*resolution+Math.max(0,Math.min(resolution-1,x)))*4;return (pixels[i]*.25+pixels[i+1]*.55+pixels[i+2]*.2)/255;};
  const facetsCount=mobile?300:650;
  const facetMaterial=new THREE.MeshStandardMaterial({color:'#a8c5d9',metalness:.48,roughness:.22,vertexColors:true,transparent:true,depthWrite:false});
  const facets=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),facetMaterial,facetsCount);
  const dummy=new THREE.Object3D();const tint=new THREE.Color(),iceTint=new THREE.Color('#d5e6ef');
  for(let i=0;i<count;i++){
    const p=candidates[Math.floor(random()*candidates.length)];
    const x=(p.x-centerX+(random()-.5)*1.5)*scale,y=(centerY-p.y+(random()-.5)*1.5)*scale;
    const lum=luminance(p.x,p.y);
    const dome=Math.sqrt(Math.max(0,1-(x/3)**2-(y/2.7)**2));
    const front=.22+dome*.35+lum*.26;
    const layer=random();
    const z=layer<.78?front+(random()-.5)*.055:layer<.88?-.30:THREE.MathUtils.lerp(-.30,front,random());
    const normal=new THREE.Vector3((luminance(p.x-1,p.y)-luminance(p.x+1,p.y))*2.5+x*.12,(luminance(p.x,p.y+1)-luminance(p.x,p.y-1))*2.5+y*.10,layer<.88?1:-1).normalize();
    normals.set([normal.x,normal.y,normal.z],i*3);seeds[i]=random();
    position.set([x,y,z],i*3);
    const angle=random()*Math.PI*2,radius=.12+random()*.65;
    scatter.set([Math.cos(angle)*radius,(random()-.5)*1.4,Math.sin(angle)*radius],i*3);
    const dark=Math.max(p.r,p.g,p.b)<70;
    const warm=p.r>p.g*1.2&&p.r>p.b*1.3;
    const teal=p.g>p.r*1.15&&p.g>p.b*.95;
    const shade=.38+Math.pow(lum,.7)*.60;
    tint.setRGB(shade*.88,shade*.96,shade,THREE.SRGBColorSpace);
    if(warm&&random()>.992)tint.set('#d6a67f');
    colors.set([tint.r,tint.g,tint.b],i*3);sizes[i]=1.65+random()*1.45;
    if(i<facetsCount){
      dummy.position.set(x,y,z-.04);dummy.rotation.set(random()*3,random()*3,random()*3);
      const s=.012+random()*.022;dummy.scale.set(s,s*1.3,s*1.8);dummy.updateMatrix();facets.setMatrixAt(i,dummy.matrix);
      tint.set(dark?'#4c6176':'#c0d6e2');facets.setColorAt(i,tint);
    }
  }
  sculpture.add(facets);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(position,3));geometry.setAttribute('aScatter',new THREE.BufferAttribute(scatter,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  geometry.setAttribute('aNormal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,vertexColors:true,
    uniforms:{uTime:{value:0},uScatter:{value:.8},uHover:{value:0},uRatio:{value:renderer.getPixelRatio()},uPointer:{value:new THREE.Vector2(20,20)}},
    vertexShader:`
      attribute vec3 aScatter; attribute vec3 aNormal; attribute float aSize; attribute float aSeed;
      uniform float uTime; uniform float uScatter; uniform float uHover; uniform float uRatio; uniform vec2 uPointer;
      varying vec3 vColor; varying float vGlow;
      void main(){
        vec3 p=position+aScatter*uScatter;
        float influence=exp(-dot(position.xy-uPointer,position.xy-uPointer)*1.25)*uHover;
        float peel=smoothstep(.68,.98,aSeed)*influence;
        float flow=uTime*1.7+aSeed*25.;
        p+=vec3(cos(flow)*.55,sin(flow*.7)*.8,.8)*peel;
        p+=sin(vec3(uTime*.65)+aScatter*7.)*.009;
        vec3 n=normalize(normalMatrix*aNormal);
        float light=.48+max(0.,dot(n,normalize(vec3(-.5,.8,1.))))*.9;
        vGlow=peel+pow(max(0.,sin(uTime*1.1+aSeed*650.)),34.)*.3;
        vColor=color*light+vec3(.35,.65,.85)*vGlow;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*uRatio*(10./-mv.z)*(1.+vGlow*.55),1.,6.);
      }`,
    fragmentShader:`
      varying vec3 vColor; varying float vGlow;
      void main(){
        float d=length(gl_PointCoord-.5);if(d>.5)discard;
        float a=1.-smoothstep(.26,.5,d);
        gl_FragColor=vec4(vColor,a*.96);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  // Shader directives must begin on their own line.
  material.fragmentShader=material.fragmentShader.replace(';#include',';\n#include');
  const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;sculpture.add(cloud);

  // A luminous current follows a helix around the relief, retaining a solid readable core.
  const streamCount=mobile?1800:4200,streamData=new Float32Array(streamCount*3);
  for(let i=0;i<streamCount;i++)streamData.set([random(),random(),random()],i*3);
  const streamGeometry=new THREE.BufferGeometry();streamGeometry.setAttribute('position',new THREE.BufferAttribute(streamData,3));
  const streamMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uRatio:{value:renderer.getPixelRatio()},uHover:{value:0}},
    vertexShader:`
      uniform float uTime;uniform float uRatio;uniform float uHover;varying float vAlpha;
      void main(){
        float t=fract(position.x+uTime*.055);
        float angle=t*9.42478+uTime*.13;
        float width=(position.y-.5)*.26;
        float radius=2.35+sin(t*6.283)*.24+width;
        vec3 p=vec3(cos(angle)*radius,(t-.5)*5.3+width,sin(angle)*1.15+.4+(position.z-.5)*.22);
        p.x+=sin(uTime*.4+t*10.)*.08;
        vAlpha=sin(t*3.14159)*(.4+position.z*.6);
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp((1.4+position.y*1.8)*uRatio*11./-mv.z,1.,5.);
      }`,
    fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.72,.91,1.,(1.-smoothstep(.12,.5,d))*vAlpha*.85);}`
  });
  const stream=new THREE.Points(streamGeometry,streamMaterial);stream.frustumCulled=false;sculpture.add(stream);

  // Loose crystalline fragments float close to the emblem, never over the UI.
  const shards=[];
  for(let i=0;i<(mobile?8:22);i++){
    const a=random()*Math.PI*2,r=1.8+random()*.85;
    const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.05+random()*.08),ice);
    shard.position.set(Math.cos(a)*r,1+random()*4.1,Math.sin(a)*r*.55);
    shard.rotation.set(random()*3,random()*3,random()*3);shard.scale.y=1.4+random();
    shard.userData={y:shard.position.y,phase:random()*Math.PI*2,spinX:(random()-.5)*.08,spinY:.06+random()*.1};
    root.add(shard);shards.push(shard);
  }
  // Depth-aware snow; a single draw call, stopped when motion is disabled.
  const snowCount=mobile?300:650,snowPos=new Float32Array(snowCount*3),snowFall=new Float32Array(snowCount),snowDrift=new Float32Array(snowCount);
  for(let i=0;i<snowCount;i++){
    snowPos.set([(random()-.5)*23,random()*12,(random()-.5)*20],i*3);
    snowFall[i]=.035+random()*.075;snowDrift[i]=.004+random()*.018;
  }
  const snowGeometry=new THREE.BufferGeometry();snowGeometry.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
  const snow=new THREE.Points(snowGeometry,new THREE.PointsMaterial({color:'#f2faff',size:.022,transparent:true,opacity:.65,depthWrite:false}));scene.add(snow);
  let motion=!reducedMotion,progress=0,current=0,pointerX=0,pointerY=0,pointerTargetX=0,pointerTargetY=0,scrollRotation=0,scrollRotationTarget=0,energy=0,formation=reducedMotion?1:.25,hoverAllowed=false,hoverTarget=0,hoverScatter=0,frame=0,last=0,time=0,disposed=false;
  const look=new THREE.Vector3(),localPointer=new THREE.Vector3(20,20,0);
  const raycaster=new THREE.Raycaster(),pointerNdc=new THREE.Vector2();
  function render(now=0){
    if(disposed)return;
    const dt=Math.min((now-last)/1000||.016,.05);last=now;
    if(motion)time+=dt;
    current=motion?THREE.MathUtils.damp(current,progress,5,dt):progress;
    pointerX=motion?THREE.MathUtils.damp(pointerX,pointerTargetX,2.8,dt):0;
    pointerY=motion?THREE.MathUtils.damp(pointerY,pointerTargetY,2.8,dt):0;
    scrollRotation=motion?THREE.MathUtils.damp(scrollRotation,scrollRotationTarget,3.8,dt):0;
    if(!motion)hoverTarget=0;
    hoverScatter=motion?THREE.MathUtils.damp(hoverScatter,hoverTarget,hoverTarget?4.5:2.2,dt):0;
    formation=motion?Math.min(1,formation+dt*(.65+energy*.75)):1;energy*=Math.exp(-2.4*dt);
    const chapter=Math.min(current,3),side=THREE.MathUtils.smoothstep(chapter,0,.85);
    const angle=motion?chapter*.64+pointerX*.09:0;
    const narrow=innerWidth<701;
    const distance=narrow?18.2:Math.max(10.2,9.8/camera.aspect);
    // Shift along the camera's right axis, so the mark stays LEFT of every content panel.
    const offset=narrow?0:side*2;
    const shiftX=Math.cos(angle)*offset,shiftZ=-Math.sin(angle)*offset;
    camera.position.set(Math.sin(angle)*distance+shiftX,3.75+(motion?pointerY*.2:0)+Math.sin(chapter*.8)*.55,Math.cos(angle)*distance+shiftZ);
    look.set(shiftX,2.65,shiftZ);camera.lookAt(look);
    root.rotation.y=angle*.64;
    sculpture.rotation.y=-.12+(motion?pointerX*.16+Math.sin(time*.22)*.07+scrollRotation:0);
    sculpture.position.y=(narrow?4.05:3.05)+(motion?Math.sin(time*.75)*.045:0);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointerNdc,camera);
    const hit=hoverAllowed?raycaster.intersectObject(logoPlane,false)[0]:null;
    const newHoverTarget=motion&&hit?1:0;
    if(newHoverTarget!==hoverTarget){hoverTarget=newHoverTarget;onHoverChange(Boolean(hoverTarget));}
    if(hit){localPointer.copy(hit.point);sculpture.worldToLocal(localPointer);}
    material.uniforms.uTime.value=time;
    streamMaterial.uniforms.uTime.value=time;
    const transition=Math.sin(chapter*Math.PI)**8;
    material.uniforms.uScatter.value=(1-formation)*.6+(motion?transition*.08:0);
    material.uniforms.uHover.value=hoverScatter;
    material.uniforms.uPointer.value.set(localPointer.x,localPointer.y);
    facetMaterial.opacity=.28;
    facets.visible=formation>.68;
    if(motion){
      shards.forEach(s=>{
        s.rotation.x+=dt*s.userData.spinX;s.rotation.y+=dt*s.userData.spinY;
        s.position.y=s.userData.y+Math.sin(time*.38+s.userData.phase)*.05;
      });
      for(let i=0;i<snowCount;i++){
        const offset=i*3;
        snowPos[offset]+=Math.sin(time*.32+i)*snowDrift[i]*dt;
        snowPos[offset+1]-=snowFall[i]*dt;
        if(snowPos[offset+1]<0){snowPos[offset]=(random()-.5)*23;snowPos[offset+1]=12;snowPos[offset+2]=(random()-.5)*20;}
      }
      snowGeometry.attributes.position.needsUpdate=true;
    }
    renderer.render(scene,camera);
    if(motion&&!document.hidden)frame=requestAnimationFrame(render);else frame=0;
  }
  function invalidate(){if(!frame&&!document.hidden)frame=requestAnimationFrame(render);}
  const onResize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();invalidate();};
  const onVisibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();invalidate();}};
  window.addEventListener('resize',onResize);document.addEventListener('visibilitychange',onVisibility);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;document.querySelector('#renderNotice').hidden=false;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{document.querySelector('#renderNotice').hidden=true;invalidate();});
  render();
  return {
    setProgress(value){progress=value;invalidate();},
    addScrollRotation(radians){if(motion&&Number.isFinite(radians)){scrollRotationTarget+=radians;invalidate();}},
    setPointer(x,y,allowHover=true){pointerTargetX=x;pointerTargetY=y;pointerNdc.set(x,y);hoverAllowed=allowHover;energy=Math.min(1,energy+.1);invalidate();},
    setMotion(value){motion=value;if(!motion){hoverTarget=0;scrollRotation=0;scrollRotationTarget=0;onHoverChange(false);cancelAnimationFrame(frame);frame=0;}invalidate();},
    dispose(){disposed=true;cancelAnimationFrame(frame);window.removeEventListener('resize',onResize);document.removeEventListener('visibilitychange',onVisibility);streamGeometry.dispose();streamMaterial.dispose();geometry.dispose();material.dispose();logoPlane.geometry.dispose();logoPlane.material.dispose();facetMaterial.dispose();renderer.dispose();environment.dispose();host.replaceChildren();}
  };
}
