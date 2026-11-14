'use client';
import {useEffect,useRef,useState} from 'react';
import {cartoonFrame,walkPose,type MascotAction,type WalkPlayback} from '../lib/mascot-motion';
import {clipFrame,clipRect} from '../lib/mascot-clip';
import {mascotArt} from '../lib/mascot-art';
export default function MascotCartoon(props:{character:'rodrigo'|'victoria';stage:number;action?:MascotAction;actionTime?:number;direction?:1|-1;speed?:number;walkPhase?:number;phaseSpeed?:number;playback?:{current:WalkPlayback|null};animated:boolean;costume?:boolean;annoyed?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef({...props,stamp:0}),[reduced,setReduced]=useState(true);
 latest.current={...props,stamp:typeof performance==='undefined'?0:performance.now()};
 const action=props.annoyed?'no':props.action??'idle';
 const {clip,legacy,path:source}=mascotArt(props.character,props.stage,action,props.costume);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const target=canvas.current,ctx=target?.getContext('2d');if(!ctx||!target)return;let raf=0,cancelled=false,lastDraw='',fallback=false,loadedAt=0;
  const image=new Image(),start=performance.now();
  const paint=(now:number)=>{
   if(cancelled)return;const p=latest.current,live=p.playback?.current,moving=p.animated&&!reduced;
   if(moving)raf=requestAnimationFrame(paint);if(!image.complete||!image.naturalWidth)return;
   const active=clip&&!fallback?clip:undefined,single=!active&&props.character==='victoria'&&props.stage===0,frames=active?.frames??(single?1:(fallback?4:legacy==='walk'||legacy==='fall'?8:4)),fw=active?.width??image.naturalWidth/frames,fh=active?.height??image.naturalHeight;
   target.style.height=active?`${active.height/175*100}%`:'100%';
   if(target.width!==fw||target.height!==fh){target.width=fw;target.height=fh;}ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   const time=moving?(live?.actionTime??((p.actionTime??(now-(loadedAt||now))/1000)+(p.actionTime!==undefined?(now-p.stamp)/1000:0))):0;
   const index=single?0:active?action==='idle'?active.frames-1:clipFrame(active,time,!moving):fallback||legacy==='idle'||legacy==='reaction'?p.stage:legacy==='walk'&&live?walkPose(live.walkPhase):cartoonFrame(action,time,p.speed??70);
   const rect=active?clipRect(active,index):{x:index*fw,y:0,width:fw,height:fh};
   const drawKey=index+'-'+(live?.direction??p.direction??-1)+'-'+fallback;if(drawKey===lastDraw)return;lastDraw=drawKey;ctx.clearRect(0,0,fw,fh);
   ctx.save();const facing=active?.facing??(fallback||single?'front':legacy==='walk'||legacy==='fall'?'left':'front'),direction=live?.direction??p.direction??-1;
   if(facing==='right'&&direction<0||facing==='left'&&direction>0){ctx.translate(fw,0);ctx.scale(-1,1);}
   ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,fw,fh);ctx.restore();
  };
  image.onload=()=>{loadedAt=performance.now();if(!cancelled)raf=requestAnimationFrame(paint);};
  image.onerror=()=>{if(cancelled||fallback)return;fallback=true;image.src=props.character==='victoria'&&props.stage===0?'/mascots/victoria-tshirt-fallback.webp':`/mascots/idle-${props.character}.webp`;};image.src=source;
  return()=>{cancelled=true;cancelAnimationFrame(raf);image.onload=null;image.onerror=null;};
 },[source,clip,legacy,action,props.character,props.stage,props.animated,reduced]);
 return <span className="mascot-cartoon-host" aria-hidden="true"><canvas ref={canvas} style={clip?{height:`${clip.height/175*100}%`}:undefined}/></span>;
}
