import fs from 'node:fs/promises';
import sharp from 'sharp';
const sources=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
async function cells(path,cols,rows){const meta=await sharp(path).metadata();if(!meta.hasAlpha)throw Error('Transparency required');const out=[];for(let i=0;i<cols*rows;i++){const left=Math.floor(i%cols*meta.width/cols),top=Math.floor(Math.floor(i/cols)*meta.height/rows),width=Math.floor((i%cols+1)*meta.width/cols)-left,height=Math.floor((Math.floor(i/cols)+1)*meta.height/rows)-top;const raw=await sharp(path).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minX=width,minY=height,maxX=-1,maxY=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(raw.data[(y*width+x)*4+3]>210){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}if(maxX<minX||maxY<minY)throw Error('Empty animation frame');out.push({buffer:await sharp(raw.data,{raw:raw.info}).extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1}).png().toBuffer(),width:maxX-minX+1,height:maxY-minY+1});}return out;}
async function headAnchor(frame){const {data,info}=await sharp(frame.buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});let sum=0,weight=0;for(let y=0;y<Math.floor(info.height*.36);y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a>210){sum+=x*a;weight+=a;}}return weight?sum/weight:frame.width/2;}
async function pack(path,cols,rows,dest,fall=false,walk=false){
 const frames=await cells(path,cols,rows),fw=fall?512:walk?384:256,fh=320,output=[],registration=[];
 // One scale for the complete walk, preserving the down/up height change and head proportions.
 const scale=fall||walk?Math.min(fh/Math.max(...frames.map(f=>f.height)),fw/Math.max(...frames.map(f=>f.width))):null;
 for(const f of frames){
  const input=await sharp(f.buffer).resize(scale?{width:Math.max(1,Math.round(f.width*scale)),height:Math.max(1,Math.round(f.height*scale))}:{width:fw,height:fh,fit:'inside'}).png().toBuffer(),m=await sharp(input).metadata();
  const anchor=walk?(await headAnchor(f))*m.width/f.width:m.width/2;
  const left=walk?Math.max(0,Math.min(fw-m.width,Math.round(fw/2-anchor))):Math.floor((fw-m.width)/2),top=fh-m.height;
  registration.push({left,top,width:m.width,height:m.height,headX:walk?left+anchor:undefined});
  output.push(await sharp({create:{width:fw,height:fh,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input,left,top}]).png().toBuffer());
 }
 await sharp(output,{join:{across:frames.length}}).webp({quality:90,alphaQuality:100}).toFile(dest);
 return{path:dest,frames:frames.length,width:fw,height:fh,...(walk?{registration:{uniformScale:scale,frames:registration}}:{})};
}

const manifest=[];
for(const source of sources){manifest.push(await pack(source.path,4,2,`public/mascots/${source.kind??'walk'}-${source.character}-${source.stage}.webp`,source.kind==='fall',source.kind!=='fall'));}
for(const character of ['rodrigo','victoria'])for(const [kind,suffix] of [['idle','v1'],['reaction','reaction']])manifest.push(await pack(`public/mascots/${character}-${suffix}.webp`,4,1,`public/mascots/${kind}-${character}.webp`));
await fs.writeFile('public/mascots/cartoon-manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log('Prepared '+manifest.length+' illustrated animation atlases');
