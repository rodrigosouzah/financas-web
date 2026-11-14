import {MASCOT_CLIPS} from '../lib/mascot-clip-data.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {clipFrame,clipRect,MASCOT_FPS,MASCOT_DRAWINGS,MASCOT_GESTURE_SECONDS} from '../lib/mascot-clip.ts';
import {companionFrame,visitAction} from '../lib/mascot-motion.ts';
import {MOTION_TESTS,testMotionFrame} from '../lib/mascot-test.ts';
test('each new gesture exposes48 whole drawings at24fps, with every drawing visited before a two-second loop/clamp',()=>{
 assert.equal(MASCOT_FPS,24);assert.equal(MASCOT_DRAWINGS,48);assert.equal(MASCOT_GESTURE_SECONDS,2);
 const clip={path:'synthetic',columns:8,rows:6,frames:48,width:384,height:384,fps:24,facing:'right' as const,loop:true};
 for(let i=0;i<48;i++){assert.equal(clipFrame(clip,i/24),i);assert.deepEqual(clipRect(clip,i),{x:i%8*384,y:Math.floor(i/8)*384,width:384,height:384});}
 assert.equal(clipFrame(clip,2),0);assert.equal(clipFrame({...clip,loop:false},20),47);assert.equal(clipFrame(clip,10,true),0);
});
test('normal visits walk looking ahead, then stop and turn, complete one gesture before leaving beyond the viewport',()=>{
 for(const width of [320,390,1440])for(const character of ['rodrigo','victoria'] as const){
  const body=width<=600?88:112;
  assert.equal(companionFrame(2,width,body,0,character).action,'walk');
  const stop=companionFrame(4,width,body,0,character),turn=companionFrame(5.9,width,body,0,character);
  assert.equal(stop.action,'turn');assert.equal(stop.speed,0);assert.equal(stop.x,turn.x);
  assert.equal(companionFrame(6.1,width,body,0,character).action,visitAction(0,character,0));
  assert.equal(companionFrame(23.1,width,body,0,character).hidden,true);
  assert.equal(companionFrame(31,width,body,0,character).action,'turn');
  assert.equal(companionFrame(44.1,width,body,0,character).hidden,true);
 }
});
test('all gesture controls use two seconds and a filtered automatic playlist cannot play another outfit\'s scenes',()=>{
 for(const [action,,duration] of MOTION_TESTS){assert.equal(duration,2);assert.equal(testMotionFrame(action,2.01,390,88).action,'idle');}
 const allowed=['walk','wave'] as const;for(let t=0;t<60;t+=.05)assert.ok(['idle',...allowed].includes(testMotionFrame('auto',t,390,88,allowed).action as any));
});
test('published artwork covers every requested scene for the first two outfits with complete48-frame alpha atlases',async()=>{
 const manifest=JSON.parse(await readFile('public/mascots/gesture48-manifest.json','utf8'));
 assert.equal(Object.keys(manifest).length,99);
 for(const character of ['rodrigo','victoria'])for(let stage=0;stage<2;stage++){
  for(const action of ['walk','run','turn','no','angry','wave','look','scratch','stretch','dance','sneeze','celebrate','fall','food','bag','beg','statue','pockets','surprise','water'])assert.ok(manifest[`${character}-${stage}-${action}`],`${character}-${stage}-${action}`);
  for(const action of character==='rodrigo'?['costume','beer','pagode']:['skincare','sushi'])assert.ok(manifest[`${character}-${stage}-${action}`]);
 }
 for(const action of ['row','sled','carry'])assert.ok(manifest[`victoria-1-${action}`]);
 for(const [key,item] of Object.entries(manifest) as [string,any][]){
  if(key.startsWith('victoria-0-'))assert.equal(item.wardrobe,'tshirt',key);assert.equal(item.frames,48,key);assert.equal(item.uniqueDrawings,48,key);assert.equal(item.fps,24,key);assert.equal(item.columns*item.rows,48,key);
  const m=await sharp('public'+item.path).metadata();assert.equal(m.width,item.width*8,key);assert.equal(m.height,item.height*6,key);assert.equal(m.hasAlpha,true,key);
 }
});

test('HYROX sled and farmer carry travel gently along the floor and settle without a position snap',()=>{
 for(const width of [320,390,1440]){const body=width<=600?88:112;
 const start=companionFrame(32,width,body,1,'victoria'),middle=companionFrame(33,width,body,1,'victoria'),end=companionFrame(34,width,body,1,'victoria');
 assert.equal(start.action,'sled');assert.ok(middle.x<=start.x);assert.ok(end.x<=middle.x);if(width>340)assert.ok(end.x<start.x);
 assert.ok(Math.abs(companionFrame(34-.00001,width,body,1,'victoria').x-end.x)<.01);
 const carryStart=companionFrame(52,width,body,1,'victoria'),carryEnd=companionFrame(54,width,body,1,'victoria');assert.equal(carryStart.action,'carry');assert.ok(carryEnd.x<carryStart.x);assert.ok(carryEnd.x+body<=width);
 }
});

test('Victoria locomotion has whole-cel horizontal registration for all 48 drawings',()=>{for(const stage of [0,1])for(const action of ['walk','run','turn']){const c=MASCOT_CLIPS[`victoria-${stage}-${action}`];assert.equal(c.horizontalOffsets?.length,48);assert.ok(c.horizontalOffsets?.every(Number.isInteger));assert.ok(Math.max(...c.horizontalOffsets!.map(Math.abs))<c.width/2);}});
