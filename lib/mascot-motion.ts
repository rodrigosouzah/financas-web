export type MascotAction='idle'|'walk'|'run'|'look'|'wave'|'fall'|'celebrate'|'scratch'|'stretch'|'dance'|'sneeze';
export interface CompanionFrame{x:number;action:MascotAction;actionTime:number;direction:1|-1;bubble:boolean;hidden:boolean;speed:number;walkPhase:number;phaseSpeed:number}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*Math.max(0,Math.min(1,t));
/** Actor can fully leave the viewport without enlarging document scroll bounds. */
export function companionFrame(time:number,width:number,bodyWidth:number,stage:number):CompanionFrame{
 const cycle=Math.floor(Math.max(0,time)/46),t=((time%46)+46)%46,right=width+bodyWidth,left=-bodyWidth-24,stopRight=Math.max(12,width-bodyWidth-24),stopLeft=Math.min(28,Math.max(0,width-bodyWidth));
 const base={x:right,action:'idle' as MascotAction,actionTime:0,direction:-1 as 1|-1,bubble:false,hidden:false,speed:0,walkPhase:0,phaseSpeed:0};
 const travel=(a:number,b:number,start:number,duration:number,action:'walk'|'run')=>{const seconds=action==='run'?Math.min(duration,Math.max(2.4,Math.abs(b-a)/200)):duration;return{...base,...walkTravel(a,b,t-start,seconds,bodyWidth<=88?138:175),action,actionTime:t-start,direction:(b>a?1:-1) as 1|-1,hidden:action==='run'&&t-start>=seconds};};
 if(t<1)return{...base,x:left,hidden:true};
 if(t<4)return travel(left,stopLeft,1,3,'walk');
 if(t<7)return{...base,x:stopLeft,action:cycle%2?'scratch':'look',actionTime:t-4};
 if(t<10)return{...base,x:stopLeft,action:stage===0&&cycle%2===0?'fall':cycle%2?'stretch':'wave',actionTime:t-7};
 if(t<16)return{...base,x:stopLeft,bubble:true,direction:1};
 if(t<23)return travel(stopLeft,right,16,7,'run');
 if(t<26)return{...base,x:right,hidden:true};
 if(t<30)return travel(right,stopRight,26,4,'walk');
 if(t<33)return{...base,x:stopRight,action:'celebrate',actionTime:t-30,direction:1};
 if(t<37)return{...base,x:stopRight,bubble:true,direction:-1};
 if(t<44)return travel(stopRight,left,37,7,'run');
 return{...base,x:left,hidden:true};
}
/** Two-link inverse kinematics: foot orientation remains parallel to the floor. */
export function legIK(hipY:number,ankleY:number,z:number,length=.43){const down=hipY-ankleY,distance=Math.max(.001,Math.min(2*length-.00001,Math.hypot(down,z))),bend=Math.acos(distance/(2*length)),hip=Math.atan2(-z,down)-bend,knee=2*bend;return{hip,knee,ankle:-hip-knee};}
export function gaitFoot(phase:number,running=false){const p=((phase%1)+1)%1,stance=running?.44:.62,stride=running?.36:.24;if(p<stance)return{y:.13,z:lerp(stride,-stride,p/stance),stance:true};const swing=(p-stance)/(1-stance);return{y:.13+Math.sin(Math.PI*swing)*(running?.30:.17),z:lerp(-stride,stride,swing),stance:false};}

/** Hand-drawn key poses; movement across the viewport is interpolated separately at display refresh. */
export function cartoonFrame(action:MascotAction,time:number,speed=70){if(action==='fall')return Math.max(0,Math.min(7,Math.floor(time/3*8)));const fps=action==='run'?18:Math.max(9,Math.min(14,speed/60*8));return ((Math.floor(Math.max(0,time)*fps)%8)+8)%8;}

/** Integrated smooth velocity ramps around a constant-speed middle. No root-position snap at rest. */
export function walkTravel(from:number,to:number,time:number,duration:number,bodyHeight:number){
 const u=Math.max(0,Math.min(1,time/duration)),r=.14,total=1-r;let progress:number,velocity:number;
 if(u<r){const q=u/r;progress=r*(q*q*q-.5*q*q*q*q)/total;velocity=(3*q*q-2*q*q*q)/total;}
 else if(u>1-r){const q=(1-u)/r;progress=1-r*(q*q*q-.5*q*q*q*q)/total;velocity=(3*q*q-2*q*q*q)/total;}
 else{progress=(u-.5*r)/total;velocity=1/total;}
 const distance=Math.abs(to-from),halfSteps=Math.max(2,Math.round(2*distance/(bodyHeight*.42))),cycleLength=distance>0?2*distance/halfSteps:bodyHeight*.42,speed=distance*velocity/duration;
 return{x:from+(to-from)*progress,speed,walkPhase:halfSteps*progress/2,phaseSpeed:speed/cycleLength};
}
/** Same distance always selects the same drawing, regardless of refresh rate or elapsed time. */
export function walkPose(phase:number){return Math.floor((((phase%1)+1)%1)*8+1e-8)%8;}

export type WalkPlayback=Pick<CompanionFrame,'walkPhase'|'direction'|'actionTime'|'speed'>;
