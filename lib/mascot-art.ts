import {MASCOT_CLIPS} from './mascot-clip-data.ts';
import type {MascotAction} from './mascot-motion.ts';
export function mascotArt(character:'rodrigo'|'victoria',stage:number,action:MascotAction,costume=false){
 const pose=action==='idle'?'turn':action,override=costume&&['walk','run','turn','idle'].includes(action)?'costume-':'';
 const clip=MASCOT_CLIPS[`${character}-${stage}-${override}${pose}`]??MASCOT_CLIPS[`${character}-${stage}-${pose}`];
 const legacy=action==='walk'||action==='run'?'walk':action==='fall'&&stage===0?'fall':['no','angry'].includes(action)?'reaction':'idle';
 return{clip,legacy,path:clip?.path??(character==='victoria'&&stage===0?'/mascots/victoria-tshirt-fallback.webp':`/mascots/${legacy}-${character}${legacy==='walk'||legacy==='fall'?'-'+stage:''}.webp`)};
}
