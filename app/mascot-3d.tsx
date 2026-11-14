'use client';
import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {createMascotRig,poseMascot} from '../lib/mascot-rig';
import type {MascotAction} from '../lib/mascot-motion';
export default function Mascot3D(props:{character:'rodrigo'|'victoria';stage:number;action?:MascotAction;actionTime?:number;direction?:1|-1;speed?:number;animated:boolean;annoyed?:boolean}){
 const host=useRef<HTMLSpanElement>(null),latest=useRef(props);latest.current=props;const [failed,setFailed]=useState(false),[reduced,setReduced]=useState(true);latest.current={...props,animated:props.animated&&!reduced};
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const target=host.current;if(!target)return;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{setFailed(true);return;}
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1.12,1.12,1.75,-1.75,.1,30);camera.position.set(0,1.75,8);camera.lookAt(0,1.75,0);
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;target.appendChild(renderer.domElement);
  scene.add(new T.HemisphereLight(0xffffff,0x9c8d7d,2.1));const key=new T.DirectionalLight(0xfff1df,3.2);key.position.set(-3,5,7);scene.add(key);const fill=new T.DirectionalLight(0xb7d9ff,1.8);fill.position.set(3,2,-1);scene.add(fill);
  const rig=createMascotRig(props.character,props.stage);scene.add(rig.root);const gaze={x:0,y:0};const pointer=(e:PointerEvent)=>{if(!latest.current.animated)return;const rect=target.getBoundingClientRect();gaze.x=T.MathUtils.clamp((e.clientX-rect.left-rect.width/2)/250,-1,1);gaze.y=T.MathUtils.clamp((rect.top+rect.height*.25-e.clientY)/250,-1,1);};window.addEventListener('pointermove',pointer,{passive:true});
  const resize=()=>{const rect=target.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);const halfWidth=3.5*rect.width/rect.height/2;camera.left=-halfWidth;camera.right=halfWidth;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(target);resize();
  let raf=0,last=0,lost=false;const started=performance.now();const render=(now:number)=>{if(lost)return;if(latest.current.animated)raf=requestAnimationFrame(render);if(now-last<32&&latest.current.animated)return;last=now;const p=latest.current,elapsed=p.animated?(now-started)/1000:0;poseMascot(rig,p.animated?(p.action??'idle'):'idle',p.actionTime??elapsed,elapsed,p.direction??-1,gaze,p.annoyed??false,p.speed??70,target.clientHeight);renderer.render(scene,camera);};raf=requestAnimationFrame(render);
  const contextLost=(event:Event)=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return()=>{lost=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('pointermove',pointer);renderer.domElement.removeEventListener('webglcontextlost',contextLost);rig.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[props.character,props.stage,props.animated,reduced]);
 return <span className="mascot-3d-host" ref={host} aria-hidden="true">{failed&&<span className="mascot-3d-unavailable">3D indisponível neste dispositivo</span>}</span>;
}
