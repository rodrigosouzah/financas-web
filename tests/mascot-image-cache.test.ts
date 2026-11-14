import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureMascotAsset} from '../lib/mascot-image-cache.ts';
import {companionFrame,visitAction} from '../lib/mascot-motion.ts';
test('artwork readiness holds the animation until loading completes, shares requests, and permits fallback after a failure',()=>{
 const original=(globalThis as any).Image,instances:any[]=[];
 class FakeImage{src='';onload?:()=>void;onerror?:()=>void;constructor(){instances.push(this);}}
 (globalThis as any).Image=FakeImage;
 try{
  assert.equal(ensureMascotAsset('/mascots/synthetic-ready.webp'),false);
  assert.equal(ensureMascotAsset('/mascots/synthetic-ready.webp'),false);assert.equal(instances.length,1);
  instances[0].onload();assert.equal(ensureMascotAsset('/mascots/synthetic-ready.webp'),true);
  assert.equal(ensureMascotAsset('/mascots/synthetic-fail.webp'),false);instances[1].onerror();assert.equal(ensureMascotAsset('/mascots/synthetic-fail.webp'),true);
  for(let i=0;i<7;i++)ensureMascotAsset(`/mascots/synthetic-evict-${i}.webp`);
  assert.equal(ensureMascotAsset('/mascots/synthetic-ready.webp'),false,'Old decoded artwork is evicted rather than retained indefinitely');
 }finally{(globalThis as any).Image=original;}
});
test('costume visits keep the outfit throughout entry/turn/action/exit; spontaneous wardrobe changes happen only while hidden',()=>{
 const index=Array.from({length:30},(_,i)=>i).find(i=>visitAction(i,'rodrigo',0)==='costume')!;assert.ok(Number.isInteger(index));
 const cycle=Math.floor(index/2),entry=index%2?26:1,turn=index%2?30:4,action=index%2?32:6,exit=index%2?38:17;
 for(const phase of [entry,turn,action,exit])assert.equal(companionFrame(cycle*46+phase,390,88,0,'rodrigo').costume,true);
 let previous=companionFrame(0,390,88,0,'rodrigo');for(let t=.05;t<46*12;t+=.05){const f=companionFrame(t,390,88,0,'rodrigo');if(f.costume!==previous.costume)assert.ok(f.hidden||previous.hidden,'Visible outfit pop at '+t);previous=f;}
});
