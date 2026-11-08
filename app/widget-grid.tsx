'use client';
import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,GripVertical,X} from 'lucide-react';
import {moveWidget,widgetDropTarget,type WidgetRect} from '../lib/widgets';
interface WidgetDefinition{id:string;title:string;size:string;icon:React.ComponentType<{size?:number}>}
interface Props{order:string[];definitions:readonly WidgetDefinition[];organizing:boolean;onOrder:(order:string[])=>void;render:(id:string)=>React.ReactNode;currency:(id:string)=>React.ReactNode}
interface Gesture{id:string;pointerId:number;startX:number;startY:number;x:number;y:number;active:boolean;target:string|null}
export function WidgetGrid({order,definitions,organizing,onOrder,render,currency}:Props){
 const [drag,setDrag]=useState<{id:string;x:number;y:number;target:string|null}|null>(null),[announcement,setAnnouncement]=useState('');
 const grid=useRef<HTMLDivElement>(null),gesture=useRef<Gesture|null>(null),frame=useRef<number|null>(null),cleanup=useRef<(()=>void)|null>(null);
 const latest=useRef({order,definitions,onOrder});latest.current={order,definitions,onOrder};
 const title=(id:string)=>latest.current.definitions.find(w=>w.id===id)?.title??id;
 const move=(id:string,target:string)=>{const previous=latest.current.order,next=moveWidget(previous,id,target);if(next.join('|')!==previous.join('|')){latest.current.onOrder(next);setAnnouncement(`${title(id)} movido para a posição ${next.indexOf(id)+1}.`);}};
 const stop=()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;cleanup.current?.();cleanup.current=null;gesture.current=null;setDrag(null);};
 useEffect(()=>{if(!organizing)stop();return()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);cleanup.current?.();gesture.current=null;};},[organizing]);
 const targetAt=(x:number,y:number)=>{if(!grid.current)return null;if(document.elementFromPoint(x,y)?.closest('.app-header'))return null;const bounds=grid.current.getBoundingClientRect();if(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom)return null;const boxes:WidgetRect[]=Array.from(grid.current.querySelectorAll<HTMLElement>('[data-widget-id]')).map(el=>{const r=el.getBoundingClientRect();return{id:el.dataset.widgetId!,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});return widgetDropTarget(boxes,x,y);};
 const update=()=>{const g=gesture.current;if(!g?.active)return;g.target=targetAt(g.x,g.y);setDrag({id:g.id,x:g.x,y:g.y,target:g.target});};
 const scroll=()=>{const g=gesture.current;if(!g?.active)return;const header=document.querySelector('.app-header')?.getBoundingClientRect().bottom??0;const velocity=g.y<Math.max(55,header+35)?-12:g.y>window.innerHeight-55?12:0;if(velocity){window.scrollBy(0,velocity);update();}frame.current=requestAnimationFrame(scroll);};
 const start=(e:React.PointerEvent<HTMLElement>,id:string)=>{
  if(!organizing||!e.isPrimary||e.button!==0||(e.target as Element).closest('[data-no-widget-drag]'))return;
  stop();e.preventDefault();const g:Gesture={id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false,target:null};gesture.current=g;
  const pointerMove=(event:PointerEvent)=>{if(event.pointerId!==g.pointerId)return;g.x=event.clientX;g.y=event.clientY;if(!g.active&&Math.hypot(g.x-g.startX,g.y-g.startY)>=5){g.active=true;setAnnouncement(`Movendo ${title(id)}. Solte sobre outro widget.`);frame.current=requestAnimationFrame(scroll);}if(g.active){event.preventDefault();update();}};
  const pointerUp=(event:PointerEvent)=>{if(event.pointerId!==g.pointerId)return;const target=targetAt(event.clientX,event.clientY);if(g.active&&target)move(g.id,target);stop();};
  const cancel=(event:PointerEvent)=>{if(event.pointerId===g.pointerId)stop();};const key=(event:KeyboardEvent)=>{if(event.key==='Escape')stop();};
  window.addEventListener('pointermove',pointerMove,{passive:false});window.addEventListener('pointerup',pointerUp);window.addEventListener('pointercancel',cancel);window.addEventListener('keydown',key);window.addEventListener('blur',stop);
  cleanup.current=()=>{window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',pointerUp);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',key);window.removeEventListener('blur',stop);};
 };
 return <><span className="sr-only" role="status" aria-live="polite">{announcement}</span>{organizing&&<p className="table-note arrange-help">Arraste o card ou a alça para mover. Use as setas como alternativa. Escape cancela.</p>}<div ref={grid} className={'widgets-grid '+(organizing?'organizing':'')+(drag?' is-dragging':'')}>{order.map((id,index)=>{const w=definitions.find(x=>x.id===id);if(!w)return null;return <section key={id} data-widget-id={id} draggable={false} onDragStart={e=>e.preventDefault()} onPointerDown={e=>start(e,id)} className={'widget footprint-'+w.size+(drag?.id===id?' widget-dragging':'')+(drag?.target===id&&drag.id!==id?' widget-drop-target':'')}>
 <div className="widget-title"><span className={'widget-icon icon-'+id}><w.icon size={18}/></span><h2>{w.title}</h2>{!organizing&&<span className="widget-currency">{currency(id)}</span>}</div>
 {organizing&&<div className="widget-arrange-controls"><button className="icon widget-handle" aria-label={'Arrastar '+w.title} title="Arraste este card"><GripVertical size={15}/></button><button data-no-widget-drag className="icon" aria-label={'Mover '+w.title+' para antes'} title="Mover para antes" disabled={index===0} onClick={()=>move(id,order[index-1])}><ArrowLeft size={14}/></button><button data-no-widget-drag className="icon" aria-label={'Mover '+w.title+' para depois'} title="Mover para depois" disabled={index===order.length-1} onClick={()=>move(id,order[index+1])}><ArrowRight size={14}/></button><span/><button data-no-widget-drag className="icon" aria-label={'Ocultar '+w.title} title="Ocultar widget" onClick={()=>onOrder(order.filter(x=>x!==id))}><X size={14}/></button></div>}
 <div className="widget-body" inert={organizing?true:undefined}>{render(id)}</div></section>;})}</div>{drag&&<div className="widget-drag-preview" aria-hidden="true" style={{left:drag.x+14,top:drag.y+14}}><GripVertical size={16}/>{title(drag.id)}</div>}</>;
}
