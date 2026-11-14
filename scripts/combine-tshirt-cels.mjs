import fs from 'node:fs/promises';
import sharp from 'sharp';
const read=path=>fs.readFile(path,'utf8').then(JSON.parse).catch(()=>[]);
const groups=await read('.private-audits/gesture48-tshirt-pairs.json');groups.push(...await read('.private-audits/gesture48-special-pairs.json'));
const repairs=await read('.private-audits/gesture48-tshirt-part-repairs.json');
for(const r of await read('.private-audits/gesture48-final-matte-cleanups.json'))if(r.path&&typeof r.part==='number'){const [character,stage,...action]=r.key.split('-');repairs.push({...r,character,stage:Number(stage),action:action.join('-')});}
for(const g of groups)g.parts=g.parts.map(p=>{const r=repairs.findLast(r=>(r.character??'victoria')===(g.character??'victoria')&&(r.stage??0)===(g.stage??0)&&r.action===g.action&&r.part===p.part&&r.path);return r?{...p,...r,error:undefined}:p;});
const turn=await read('.private-audits/gesture48-tshirt-turn-parts.json');if(turn.length)groups.unshift({character:'victoria',stage:0,action:'turn',wardrobe:'tshirt',parts:turn});
const output='.private-audits/gesture48-combined';await fs.mkdir(output,{recursive:true});const sources=[],errors=[];
for(const group of groups){if(group.parts.length!==2||group.parts.some(p=>!p.path||p.error)){errors.push({character:group.character??'victoria',stage:group.stage??0,action:group.action,parts:group.parts.map(({prompt,...p})=>p)});continue;}
 const cells=[];let fw=0,fh=0;
 for(const p of group.parts){const m=await sharp(p.path).metadata();if(!m.hasAlpha)throw Error('Missing alpha');for(let i=0;i<24;i++){const left=Math.floor(i%6*m.width/6),top=Math.floor(Math.floor(i/6)*m.height/4),width=Math.floor((i%6+1)*m.width/6)-left,height=Math.floor((Math.floor(i/6)+1)*m.height/4)-top;fw=Math.max(fw,width);fh=Math.max(fh,height);cells.push({buffer:await sharp(p.path).extract({left,top,width,height}).png().toBuffer(),width,height});}}
 const frames=[];for(const c of cells)frames.push(await sharp(c.buffer).resize(fw,fh,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer());
 const character=group.character??'victoria',stage=group.stage??0;const path=`${output}/${character}-${stage}-${group.action}.png`;await sharp(frames,{join:{across:8}}).png().toFile(path);
 sources.push({character,stage,action:group.action,...(stage===0?{wardrobe:'tshirt'}:{}),path,columns:8,rows:6,frames:48,fps:24,imagegenParts:group.parts.map(p=>p.path),method:'48 complete drawings from two24-cel image-generated sheets, whole-cell assembly only'});
}
await fs.writeFile('.private-audits/gesture48-tshirt-combined.json',JSON.stringify(sources,null,2)+'\n');await fs.writeFile('.private-audits/gesture48-combine-errors.json',JSON.stringify(errors,null,2)+'\n');console.log(JSON.stringify({combined:sources.length,errors:errors.map(x=>x.action)}));
