import * as T from 'three';
import {gaitFoot,legIK,type MascotAction} from './mascot-motion.ts';
export interface MascotRig{root:T.Group;hips:T.Group;torso:T.Group;head:T.Group;leftArm:T.Group;rightArm:T.Group;leftElbow:T.Group;rightElbow:T.Group;leftLeg:T.Group;rightLeg:T.Group;leftKnee:T.Group;rightKnee:T.Group;leftFoot:T.Group;rightFoot:T.Group;eyes:T.Group[];pupils:T.Group[];brows:T.Group[];mouth:T.Group;dispose:()=>void}
/** Original geometric 3D character; articulated hierarchy, no image planes or remote models. */
export function createMascotRig(character:'rodrigo'|'victoria',stage:number):MascotRig{
 const female=character==='victoria',root=new T.Group(),materials:T.Material[]=[],geometries:T.BufferGeometry[]=[];
 const mat=(color:number,roughness=.72)=>{const m=new T.MeshStandardMaterial({color,roughness});materials.push(m);return m;};
 const skin=mat(female?0xe2a37e:0xa9643e),skinDark=mat(female?0xc48161:0x85482d),hair=mat(female?0x41271f:0x211b18),highlight=mat(0x966744),beard=mat(0x2e2825),grey=mat(0x938b7f),white=mat(0xfaf9f4),iris=mat(0x653a20),black=mat(0x191b20),blue=mat(0x23528c),navy=mat(0x202c48),tan=mat(0xbda07b),gold=mat(0xb99445,.3),brown=mat(0x684329),pink=mat(0xae6f62),dust=mat(0x82735d);
 const sphere=new T.SphereGeometry(1,24,18);geometries.push(sphere);const ball=(parent:T.Group,material:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=new T.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;};
 const joint=(parent:T.Group,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;};
 const limb=(parent:T.Group,material:T.Material,length:number,radius:number)=>{const geo=new T.CapsuleGeometry(radius,Math.max(.01,length-2*radius),6,12);geometries.push(geo);const m=new T.Mesh(geo,material);m.position.y=-length/2;parent.add(m);return m;};
 const line=(parent:T.Group,material:T.Material,points:T.Vector3[],radius=.014)=>{const geo=new T.TubeGeometry(new T.CatmullRomCurve3(points),24,radius,8,false);geometries.push(geo);const m=new T.Mesh(geo,material);parent.add(m);return m;};
 const hips=joint(root,0,.99),torso=joint(hips,0,.1),head=joint(torso,0,.84);root.name=`VR-${character}-stage-${stage}`;
 const trousers=stage>=2?tan:stage===1&&!female?blue:black;
 ball(hips,trousers,0,.02,0,.32,.19,.23);
 const shirt=stage===0?(female?mat(0xb5a997):skin):stage===1?(female?black:white):stage===2?blue:navy;
 ball(torso,shirt,0,.39,0,.36,.47,.25);
 if(stage>=2){ball(torso,stage===3?black:white,0,.46,.218,.14,.33,.06);for(const side of [-1,1]){const lapel=ball(torso,shirt,side*.15,.62,.258,.10,.25,.025);lapel.rotation.z=side*-.22;}for(let i=0;i<3;i++)ball(torso,gold,.11,.55-i*.14,.277,.018,.018,.014);}
 ball(torso,skin,0,.83,0,.16,.19,.15);
 ball(head,skin,0,.54,0,.56,.65,.46);ball(head,skin,0,.20,.08,.40,.27,.35);
 for(const side of [-1,1]){ball(head,skin,side*.55,.49,-.015,.115,.17,.10);ball(head,skinDark,side*.58,.49,.055,.045,.09,.025);}
 ball(head,skin,0,.48,.48,.115,.15,.15);ball(head,skinDark,-.07,.41,.56,.026,.018,.018);ball(head,skinDark,.07,.41,.56,.026,.018,.018);
 const eyes:T.Group[]=[],pupils:T.Group[]=[],brows:T.Group[]=[];
 for(const side of [-1,1]){const eye=joint(head,side*.235,.64,.405);eyes.push(eye);ball(eye,white,0,0,0,.18,.125,.075);const pupil=joint(eye);pupils.push(pupil);ball(pupil,iris,0,0,.063,.083,.092,.025);ball(pupil,black,0,0,.085,.039,.057,.014);ball(pupil,white,-.022,.034,.099,.020,.023,.009);const brow=joint(head,side*.23,.85,.424);brows.push(brow);const b=ball(brow,hair,0,0,0,.19,.039,.045);b.rotation.z=side*-.1;}
 const mouth=joint(head,0,.245,.438);line(mouth,pink,[new T.Vector3(-.15,.025,0),new T.Vector3(0,-.018,.025),new T.Vector3(.15,.025,0)],.023);
 if(!female){ball(head,beard,0,.11,.12,.385,.26,.35);ball(head,beard,-.31,.22,.18,.09,.28,.19);ball(head,beard,.31,.22,.18,.09,.28,.19);for(const side of [-1,1])ball(head,beard,side*.09,.31,.445,.11,.04,.035);for(let i=0;i<24;i++){const a=i*2.399;ball(head,grey,Math.cos(a)*(.1+(i%4)*.055),-.04+(i%6)*.032,.34+Math.sin(a)*.035,.012,.025,.009);}mouth.position.z=.473;}
 // Short curls or layered shoulder-length waves are real mesh volumes.
 if(!female){for(let i=0;i<95;i++){const a=i*2.399,theta=.10+(i/95)*1.31;ball(head,i%13===0?grey:hair,Math.sin(theta)*Math.cos(a)*.535,.58+Math.cos(theta)*.64,Math.sin(theta)*Math.sin(a)*.445,.068,.065,.065);}}
 else{ball(head,hair,0,.65,-.23,.59,.64,.32);for(const side of [-1,1])for(let i=0;i<10;i++){const wave=ball(head,i%3===0?highlight:hair,side*(.44+.06*Math.sin(i)),.94-i*.11,-.08+(i%3)*.08,.16,.24,.19);wave.rotation.z=side*(.16+Math.sin(i)*.12);}for(let i=0;i<6;i++){const lock=ball(head,i%2?hair:highlight,-.38+i*.14,1.05,-.02,.13,.25,.15);lock.rotation.z=-.6;}if(stage===1){ball(head,hair,0,1.19,-.23,.20,.22,.18);for(let i=0;i<5;i++)ball(head,i%2?hair:highlight,.12+Math.sin(i)*.08,1.13-i*.15,-.42,.16,.23,.15);}}
 const leftArm=joint(torso,-.37,.7),rightArm=joint(torso,.37,.7),leftElbow=joint(leftArm,0,-.33),rightElbow=joint(rightArm,0,-.33);
 for(const arm of [leftArm,rightArm])limb(arm,stage===0||female&&stage===1?skin:shirt,.33,.105);
 for(const elbow of [leftElbow,rightElbow]){limb(elbow,stage>=2?shirt:skin,.30,.086);ball(elbow,skin,0,-.34,.01,.085,.115,.07);}
 const leftLeg=joint(hips,-.17,-.03),rightLeg=joint(hips,.17,-.03),leftKnee=joint(leftLeg,0,-.43),rightKnee=joint(rightLeg,0,-.43),leftFoot=joint(leftKnee,0,-.43),rightFoot=joint(rightKnee,0,-.43);
 for(const leg of [leftLeg,rightLeg])limb(leg,trousers,.43,.14);
 for(const knee of [leftKnee,rightKnee])limb(knee,stage===0||female&&stage===1?skin:trousers,.43,.105);
 for(const foot of [leftFoot,rightFoot]){
  if(stage===0){ball(foot,white,0,-.095,.095,.13,.035,.23);line(foot,white,[new T.Vector3(-.10,-.045,.07),new T.Vector3(0,-.015,.20),new T.Vector3(.10,-.045,.07)],.025);ball(foot,mat(0x279442),-.055,-.009,.09,.035,.014,.023);ball(foot,gold,-.055,-.002,.09,.018,.006,.013);}
  else{ball(foot,stage===3?brown:stage===1&&female?black:white,0,-.055,.10,.145,.075,.24);ball(foot,white,0,-.113,.10,.15,.017,.24);for(let i=0;i<3;i++)ball(foot,stage===3?brown:white,0,.007,.12+i*.037,.075,.009,.012);}
 }
 if(stage===0){for(const p of [[-.27,.54,.22],[.2,.29,.24],[.29,.7,.22]])ball(torso,dust,...p as [number,number,number],.06,.09,.015);ball(head,dust,-.31,.48,.41,.07,.055,.018);ball(head,dust,.27,.91,.37,.08,.04,.018);}
 if(stage===1&&female){for(const knee of [leftKnee,rightKnee])ball(knee,white,0,-.34,0,.112,.09,.112);ball(leftElbow,black,0,-.23,0,.10,.06,.10);}
 if(stage>=2){ball(leftElbow,gold,0,-.23,0,.102,.055,.10);ball(leftElbow,black,0,-.23,.085,.045,.04,.018);}
 if(female&&stage===2){const bag=joint(torso,-.48,.05,.13);ball(bag,brown,0,0,0,.20,.23,.10);ball(bag,tan,0,0,.065,.17,.20,.05);ball(bag,mat(0x32523b),0,0,.115,.035,.20,.008);ball(bag,mat(0x972a36),0,0,.125,.013,.20,.006);line(torso,brown,[new T.Vector3(-.25,.79,.12),new T.Vector3(-.43,.49,.20),new T.Vector3(-.48,.09,.21)],.022);for(const side of [-1,1]){const geo=new T.TorusGeometry(.035,.009,6,16);geometries.push(geo);const ring=new T.Mesh(geo,gold);ring.position.set(side*.023,0,.14);bag.add(ring);}}
 if(female&&stage>=2){for(const side of [-1,1]){const geo=new T.TorusGeometry(.065,.012,8,18);geometries.push(geo);const ring=new T.Mesh(geo,gold);ring.position.set(side*.56,.34,.07);head.add(ring);}}
 root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;}});
 return{root,hips,torso,head,leftArm,rightArm,leftElbow,rightElbow,leftLeg,rightLeg,leftKnee,rightKnee,leftFoot,rightFoot,eyes,pupils,brows,mouth,dispose:()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
export function poseMascot(r:MascotRig,action:MascotAction,time:number,elapsed:number,direction:1|-1,gaze:{x:number;y:number},annoyed=false,speed=70,height=175){
 const travel=action==='walk'||action==='run',running=action==='run',frequency=Math.min(3,Math.max(.8,speed/(height/3.3)/(running?.9:.58))),phase=time*frequency;
 r.root.position.set(0,0,0);r.root.rotation.set(0,travel?direction*1.12:Math.sin(elapsed*.5)*.05,0);r.hips.position.y=travel?.91+Math.cos(phase*Math.PI*4)*.015:.99;r.hips.rotation.set(0,0,travel?Math.sin(phase*Math.PI*2)*.045:0);r.torso.rotation.set(running?.10:0,0,0);r.head.rotation.set(gaze.y*.1,gaze.x*.19,0);
 for(const [i,leg,knee,foot] of [[0,r.leftLeg,r.leftKnee,r.leftFoot],[1,r.rightLeg,r.rightKnee,r.rightFoot]] as const){const target=travel?gaitFoot(phase+i*.5,running):{y:.13,z:0};const angles=legIK(r.hips.position.y-.03,target.y,target.z);leg.rotation.x=angles.hip;knee.rotation.x=angles.knee;foot.rotation.x=angles.ankle;}
 const swing=travel?Math.sin(phase*Math.PI*2)*(running?.9:.5):Math.sin(elapsed*1.3)*.045;r.leftArm.rotation.set(-swing,0,-.12);r.rightArm.rotation.set(swing,0,.12);r.leftElbow.rotation.x=running?-1:-.12;r.rightElbow.rotation.x=running?-1:-.12;
 const blink=Math.pow(Math.max(0,Math.cos(elapsed*1.7)),60);for(const eye of r.eyes)eye.scale.y=1-blink*.92;for(const pupil of r.pupils)pupil.position.set(gaze.x*.035,gaze.y*.026,0);r.brows[0].rotation.z=annoyed?-.32:0;r.brows[1].rotation.z=annoyed?.28:0;r.mouth.scale.set(annoyed?.55:1,annoyed?1.8:1,1);
 if(action==='look'){r.head.rotation.y=Math.sin(time*2)*.5;r.head.rotation.z=Math.sin(time*1.7)*.12;}
 if(action==='wave'){r.rightArm.rotation.z=-2.25;r.rightArm.rotation.x=-.25;r.rightElbow.rotation.z=Math.sin(time*10)*.35;r.head.rotation.z=.10;}else r.rightElbow.rotation.z=0;
 if(action==='celebrate'){r.root.position.y=Math.max(0,Math.sin(time*5))*.17;r.leftArm.rotation.z=2.3;r.rightArm.rotation.z=-2.3;r.torso.rotation.y=Math.sin(time*3)*.15;}
 if(action==='scratch'){r.rightArm.rotation.set(-.6,0,-2.7);r.rightElbow.rotation.set(-1.4,0,Math.sin(time*12)*.12);r.head.rotation.z=-.14;r.brows[0].rotation.z=-.15;}
 if(action==='stretch'){const stretch=Math.sin(Math.min(1,time/3)*Math.PI);r.leftArm.rotation.z=2.6*stretch;r.rightArm.rotation.z=-2.6*stretch;r.torso.rotation.z=Math.sin(time*2)*.12*stretch;r.head.rotation.x=-.15*stretch;}
 if(action==='fall'){const t=Math.min(3,time);const rotation=t<.6?-(t/.6)*1.45:t<1.3?-1.45:t<2.65?-1.45*(1-(t-1.3)/1.35):0;r.root.rotation.z=rotation;r.head.rotation.z=-rotation*.15;r.leftArm.rotation.z=.9;r.rightArm.rotation.z=-.9;r.leftElbow.rotation.x=-.8;r.rightElbow.rotation.x=-.8;r.torso.rotation.x=Math.sin(t*2)*.2;if(t>1.3&&t<2.65){const crouch=Math.sin((t-1.3)/1.35*Math.PI);r.leftLeg.rotation.x=-.7*crouch;r.rightLeg.rotation.x=-.7*crouch;r.leftKnee.rotation.x=1.4*crouch;r.rightKnee.rotation.x=1.4*crouch;r.leftFoot.rotation.x=-.7*crouch;r.rightFoot.rotation.x=-.7*crouch;}r.root.updateMatrixWorld(true);const floor=new T.Box3().setFromObject(r.root).min.y;r.root.position.y=-floor;}
 if(action!=='fall'){r.root.updateMatrixWorld(true);const floor=new T.Box3().setFromObject(r.root).min.y;if(floor<0)r.root.position.y-=floor;}
}
