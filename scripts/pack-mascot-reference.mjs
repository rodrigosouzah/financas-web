import sharp from 'sharp';
const path=process.argv[2],{data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let l=info.width,t=info.height,r=-1,b=-1;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>210){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
if(r<l)throw Error('Missing reference figure');
await sharp(path).extract({left:l,top:t,width:r-l+1,height:b-t+1}).resize({height:175}).webp({quality:90,alphaQuality:100}).toFile('public/mascots/victoria-tshirt-fallback.webp');
console.log('Prepared complete T-shirt reference fallback');
