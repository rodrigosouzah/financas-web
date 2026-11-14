export type MascotAction='idle'|'walk'|'run'|'look'|'wave'|'fall'|'celebrate'|'scratch'|'stretch'|'dance'|'sneeze'|'food'|'bag'|'beg'|'statue'|'no'|'angry'|'pockets'|'surprise'|'water'|'costume'|'row'|'sled'|'carry'|'beer'|'pagode'|'skincare'|'sushi'|'turn';
export interface CompanionFrame{x:number;action:MascotAction;actionTime:number;direction:1|-1;bubble:boolean;hidden:boolean;speed:number;walkPhase:number;phaseSpeed:number;costume?:boolean}
/** Actor can fully leave the viewport without enlarging document scroll bounds. */
export function companionFrame(time:number,width:number,bodyWidth:number,stage:number,character:'rodrigo'|'victoria'='rodrigo'):CompanionFrame{
 const cycle=Math.floor(Math.max(0,time)/46),t=((time%46)+46)%46,right=width+bodyWidth,left=-bodyWidth-24,stopRight=character==='victoria'&&stage===1?(width-bodyWidth)/2:Math.max(12,width-bodyWidth-24),stopLeft=character==='victoria'&&stage===1?(width-bodyWidth)/2:Math.min(28,Math.max(0,width-bodyWidth));
 const leftScene=visitAction(cycle*2,character,stage),rightScene=visitAction(cycle*2+1,character,stage);
 const displacement=(action:MascotAction)=>['sled','carry'].includes(action)?Math.min((bodyWidth<=88?138:175)*.8,Math.max(0,(width-(action==='sled'?340:180))/2)):0;
 const endLeft=stopLeft+displacement(leftScene),endRight=stopRight-displacement(rightScene);
 const costume=stage<2&&character==='rodrigo'&&(t>=23?rightScene:leftScene)==='costume';
 const base={costume,x:right,action:'idle' as MascotAction,actionTime:0,direction:-1 as 1|-1,bubble:false,hidden:false,speed:0,walkPhase:0,phaseSpeed:0};
 const travel=(a:number,b:number,start:number,duration:number,action:'walk'|'run')=>{const seconds=action==='run'?Math.min(duration,Math.max(2.4,Math.abs(b-a)/200)):duration;return{...base,...walkTravel(a,b,t-start,seconds,bodyWidth<=88?138:175),action,actionTime:t-start,direction:(b>a?1:-1) as 1|-1,hidden:action==='run'&&t-start>=seconds};};
 if(t<1)return{...base,x:left,hidden:true};
 if(t<4)return travel(left,stopLeft,1,3,'walk');
 if(t<6)return{...base,x:stopLeft,action:'turn',actionTime:t-4,direction:1};
 if(t<8)return{...base,...walkTravel(stopLeft,endLeft,t-6,2,bodyWidth<=88?138:175),action:stage<2?leftScene:cycle%2?'stretch':'wave',actionTime:t-6,direction:1};
 if(t<16)return{...base,x:endLeft,bubble:true,direction:1};
 if(t<23)return travel(endLeft,right,16,7,'run');
 if(t<26)return{...base,x:right,hidden:true};
 if(t<30)return travel(right,stopRight,26,4,'walk');
 if(t<32)return{...base,x:stopRight,action:'turn',actionTime:t-30,direction:-1};
 if(t<34)return{...base,...walkTravel(stopRight,endRight,t-32,2,bodyWidth<=88?138:175),action:stage<2?rightScene:'celebrate',actionTime:t-32,direction:-1};
 if(t<37)return{...base,x:endRight,bubble:true,direction:-1};
 if(t<44)return travel(endRight,left,37,7,'run');
 return{...base,x:left,hidden:true};
}
export function visitAction(visit:number,character:'rodrigo'|'victoria'='rodrigo',stage=0):MascotAction{
 const common:MascotAction[]=['beg','wave','water','statue','pockets','dance','fall','look','scratch','stretch','sneeze','celebrate','no','angry','surprise'];
 const actions=character==='victoria'?[...(stage===1?['row','sled','carry'] as const:[]),'food','skincare','bag','sushi',...common]:['food','beer','bag','pagode',...common,'costume'];
 return actions[Math.max(0,visit)%actions.length] as MascotAction;
}
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

export type WalkPlayback=Pick<CompanionFrame,'walkPhase'|'direction'|'actionTime'|'speed'|'costume'>;
