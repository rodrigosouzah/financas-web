export interface MascotClip{path:string;columns:number;rows:number;frames:number;width:number;height:number;fps:number;facing:'left'|'right'|'front';loop:boolean;uniformScale?:number;uniqueDrawings?:number;packingVersion?:number;wardrobe?:string;sharedMotion?:string}
export const MASCOT_FPS=24,MASCOT_DRAWINGS=48,MASCOT_GESTURE_SECONDS=MASCOT_DRAWINGS/MASCOT_FPS;
/** Actual complete drawings only: no optical flow, puppet joints or synthetic image interpolation. */
export function clipFrame(clip:MascotClip,time:number,still=false){const n=Math.max(0,Math.floor((still?0:Math.max(0,time))*clip.fps+1e-7));return clip.loop?n%clip.frames:Math.min(clip.frames-1,n);}
export function clipRect(clip:MascotClip,index:number){const i=Math.max(0,Math.min(clip.frames-1,index));return{x:i%clip.columns*clip.width,y:Math.floor(i/clip.columns)*clip.height,width:clip.width,height:clip.height};}
