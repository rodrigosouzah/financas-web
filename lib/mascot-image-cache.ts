/** Public artwork only. A small browser cache never contains profile or financial data. */
const cache=new Map<string,{image:HTMLImageElement;status:'loading'|'ready'|'failed'}>();
export function ensureMascotAsset(path:string){
 if(typeof Image==='undefined')return true;
 const old=cache.get(path);if(old){cache.delete(path);cache.set(path,old);return old.status!=='loading';}
 const image=new Image(),entry={image,status:'loading' as 'loading'|'ready'|'failed'};
 image.onload=()=>{entry.status='ready';};image.onerror=()=>{entry.status='failed';};cache.set(path,entry);image.src=path;
 if(cache.size>6)cache.delete(cache.keys().next().value!);
 return false;
}
export function warmMascotAssets(paths:readonly string[]){for(const path of paths)ensureMascotAsset(path);}
