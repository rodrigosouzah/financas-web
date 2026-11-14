'use client';
import {useEffect,useRef,useState} from 'react';
import {cartoonFrame,walkPose,type MascotAction,type WalkPlayback} from '../lib/mascot-motion';
export default function MascotCartoon(props:{character:'rodrigo'|'victoria';stage:number;action?:MascotAction;actionTime?:number;direction?:1|-1;speed?:number;walkPhase?:number;phaseSpeed?:number;playback?:{current:WalkPlayback|null};animated:boolean;annoyed?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef({...props,stamp:0}),[reduced,setReduced]=useState(true);
 latest.current={...props,stamp:typeof performance==='undefined'?0:performance.now()};
 const action=props.action??'idle',kind=props.annoyed?'reaction':action==='walk'||action==='run'?'walk':action==='fall'&&props.stage===0?'fall':'idle';
 const source=`/mascots/${kind}-${props.character}${kind==='walk'||kind==='fall'?'-'+props.stage:''}.webp`+(kind==='walk'?'?registration=2':'');
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{const target=canvas.current,ctx=target?.getContext('2d');if(!ctx||!target)return;let raf=0,cancelled=false,atlasKind=kind;const image=new Image();const start=performance.now();
 const paint=(now:number)=>{if(cancelled)return;const p=latest.current,live=p.playback?.current,moving=p.animated&&!reduced;if(moving)raf=requestAnimationFrame(paint);if(!image.complete||!image.naturalWidth)return;const frames=atlasKind==='walk'||atlasKind==='fall'?8:4,frameWidth=image.naturalWidth/frames,frameHeight=image.naturalHeight;if(target.width!==frameWidth||target.height!==frameHeight){target.width=frameWidth;target.height=frameHeight;}ctx.clearRect(0,0,frameWidth,frameHeight);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const t=live?.actionTime??((p.actionTime??(now-start)/1000)+(p.actionTime!==undefined&&moving?(now-p.stamp)/1000:0)),phase=live?.walkPhase??p.walkPhase??0,index=atlasKind==='walk'&&(live!==null&&live!==undefined||p.walkPhase!==undefined)?walkPose(phase):atlasKind==='walk'||atlasKind==='fall'?cartoonFrame(p.action??'idle',moving?t:0,p.speed??70):p.stage;
 ctx.save();if(atlasKind==='walk'||atlasKind==='fall'){if((live?.direction??p.direction??-1)>0){ctx.translate(frameWidth,0);ctx.scale(-1,1);}}if(atlasKind==='idle'&&moving){const drift=Math.sin((now-start)/900)*(p.action==='look'?3:1);for(let y=0;y<frameHeight;y+=4){const h=Math.min(4,frameHeight-y),x=drift*Math.pow(1-y/frameHeight,3);ctx.drawImage(image,index*frameWidth,y,frameWidth,h,x,y,frameWidth,h);}}else ctx.drawImage(image,index*frameWidth,0,frameWidth,frameHeight,0,0,frameWidth,frameHeight);ctx.restore();};
 image.onload=()=>{if(!cancelled)raf=requestAnimationFrame(paint);};image.onerror=()=>{if(cancelled)return;image.onerror=null;atlasKind='idle';image.src=`/mascots/idle-${props.character}.webp`;};image.src=source;
 return()=>{cancelled=true;cancelAnimationFrame(raf);image.onload=null;image.onerror=null;};
 },[source,kind,props.character,props.stage,props.animated,reduced]);
 return <span className={'mascot-cartoon-host '+(kind==='fall'?'cartoon-fall':'')} aria-hidden="true"><canvas ref={canvas}/></span>;
}
