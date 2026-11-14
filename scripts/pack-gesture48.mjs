import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const sourceMap=new Map();
for(const file of ['gesture48-results','gesture48-nonv0-results','gesture48-victoria-repair','gesture48-v0-new','gesture48-costume','gesture48-v0-tshirt','gesture48-tshirt-combined']){for(const s of await fs.readFile(`.private-audits/${file}.json`,'utf8').then(JSON.parse).catch(()=>[])){if(s.character==='victoria'&&s.stage===0&&!['gesture48-v0-tshirt','gesture48-tshirt-combined'].includes(file))continue;const k=`${s.character}-${s.stage}-${s.action}`;if(!sourceMap.get(k)?.path||s.path)sourceMap.set(k,s);}}
const sources=[...sourceMap.values()];
const overrides=await fs.readFile('.private-audits/gesture48-overrides.json','utf8').then(JSON.parse).catch(()=>({}));
for(const r of await fs.readFile('.private-audits/gesture48-matte-cleanups.json','utf8').then(JSON.parse).catch(()=>[]))if(r.path)overrides[r.key]=r.path;
for(const r of await fs.readFile('.private-audits/gesture48-final-matte-cleanups.json','utf8').then(JSON.parse).catch(()=>[]))if(r.path&&r.part===undefined)overrides[r.key]=r.path;
const output='public/mascots/gestures-v39';await fs.mkdir(output,{recursive:true});
const old=await fs.readFile('.private-audits/gesture48-packed.json','utf8').then(JSON.parse).catch(()=>({})),clips={},errors=[];
for(const s of sources){const key=`${s.character}-${s.stage}-${s.action}`;if(s.error){errors.push({key,error:s.error});continue;}
 const path=overrides[key]??s.path,bytes=await fs.readFile(path),hash=createHash('sha256').update(bytes).digest('hex');
 const m=await sharp(bytes).metadata();if(!m.hasAlpha){errors.push({key,error:'Missing alpha'});continue;}
 const samples=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const corners=[[0,0],[m.width-1,0],[0,m.height-1],[m.width-1,m.height-1]];
 let borderHigh=0,borderTotal=0;
 for(let i=0;i<48;i++){const l=Math.floor(i%8*m.width/8),t=Math.floor(Math.floor(i/8)*m.height/6),r=Math.floor((i%8+1)*m.width/8)-1,b=Math.floor((Math.floor(i/8)+1)*m.height/6)-1;for(let j=0;j<8;j++){const x=Math.round(l+(r-l)*j/7),y=Math.round(t+(b-t)*j/7);for(const [xx,yy] of [[x,t],[x,b],[l,y],[r,y]]){borderTotal++;if(samples.data[(yy*m.width+xx)*4+3]>80)borderHigh++;}}}
 if(corners.some(([x,y])=>samples.data[(y*m.width+x)*4+3]>80)||borderHigh/borderTotal>.25){errors.push({key,error:'Background matte needs image-tool cleanup',path});continue;}
 if(old[key]?.sourceHash===hash&&old[key]?.packingVersion===2){clips[key]=old[key];continue;}
 const cels=[];let ground=0,top=m.height,leftMost=m.width,rightMost=0;
 for(let i=0;i<48;i++){
  const x=Math.floor(i%8*m.width/8),y=Math.floor(Math.floor(i/8)*m.height/6),w=Math.floor((i%8+1)*m.width/8)-x,h=Math.floor((Math.floor(i/8)+1)*m.height/6)-y;
  const raw=await sharp(bytes).extract({left:x,top:y,width:w,height:h}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let l=w,t=h,r=-1,b=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(raw.data[(yy*w+xx)*4+3]>210){l=Math.min(l,xx);t=Math.min(t,yy);r=Math.max(r,xx);b=Math.max(b,yy);}
  if(r<l||b<t)throw Error(`Empty cel ${key}:${i}`);
  const cropped=await sharp(raw.data,{raw:raw.info}).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();
  cels.push({buffer:cropped,l,t,r,b,cellWidth:w});ground=Math.max(ground,b);top=Math.min(top,t);leftMost=Math.min(leftMost,l);rightMost=Math.max(rightMost,r);
 }
 const fw=['row','sled'].includes(s.action)?384:224,fh=224,scale=Math.min(175/(ground-top+1),(fw-24)/(rightMost-leftMost+1)),frames=[];
 for(const c of cels){const w=Math.max(1,Math.round((c.r-c.l+1)*scale)),h=Math.max(1,Math.round((c.b-c.t+1)*scale));
  const input=await sharp(c.buffer).resize(w,h).png().toBuffer(),left=Math.max(0,Math.min(fw-w,Math.round(fw/2+(c.l-c.cellWidth/2)*scale))),top=Math.max(0,fh-Math.round((ground-c.t+1)*scale));
  frames.push(await sharp({create:{width:fw,height:fh,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input,left,top}]).png().toBuffer());
 }
 const unique=new Set(cels.map(c=>createHash('sha256').update(c.buffer).digest('hex'))).size;if(unique!==48)throw Error(`Expected48 distinct whole drawings for ${key}, got${unique}`);
 const name=`${key}-${hash.slice(0,8)}.webp`;await sharp(frames,{join:{across:8}}).webp({quality:80,alphaQuality:90,effort:5}).toFile(`${output}/${name}`);
 clips[key]={path:`/mascots/gestures-v39/${name}`,columns:8,rows:6,frames:48,width:fw,height:fh,fps:24,facing:['walk','run','turn','sled','carry'].some(a=>s.action===a||s.action==='costume-'+a)?'right':'front',loop:['walk','run','dance','row','sled','carry','pagode','no'].some(a=>s.action===a||s.action==='costume-'+a),uniformScale:scale,uniqueDrawings:unique,sourceHash:hash,packingVersion:2,...(s.wardrobe?{wardrobe:s.wardrobe}:{})};
}
for(const action of ['walk','run','turn']){const clip=clips[`rodrigo-0-costume-${action}`];if(clip)clips[`rodrigo-1-costume-${action}`]=clip;}
if(clips['victoria-0-celebrate'])clips['victoria-0-dance']={...clips['victoria-0-celebrate'],sharedMotion:'celebrate'};
const unresolved=errors.filter(e=>!clips[e.key]);
await fs.writeFile('.private-audits/gesture48-packed.json',JSON.stringify(clips,null,2)+'\n');
await fs.writeFile('public/mascots/gesture48-manifest.json',JSON.stringify(clips,null,2)+'\n');
await fs.writeFile('lib/mascot-clip-data.ts',"import type {MascotClip} from './mascot-clip.ts';\nexport const MASCOT_CLIPS:Record<string,MascotClip>="+JSON.stringify(Object.fromEntries(Object.entries(clips).map(([k,{sourceHash,...v}])=>[k,v])),null,2)+';\n');
await fs.writeFile('.private-audits/gesture48-pack-errors.json',JSON.stringify(unresolved,null,2)+'\n');
console.log(JSON.stringify({packed:Object.keys(clips).length,errors:unresolved}));
