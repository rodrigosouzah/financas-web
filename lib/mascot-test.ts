import {walkTravel,type MascotAction,type CompanionFrame} from './mascot-motion.ts';
export const MOTION_TESTS=[['walk','Caminhar',6],['run','Correr',4],['fall','Cair e levantar',6],['dance','Dançar',5],['sneeze','Espirrar',3],['wave','Acenar',3],['stretch','Espreguiçar',3]] as const;
export type MotionTestAction=typeof MOTION_TESTS[number][0];
/** Isolated pose controller: never reads financial data, so every outfit can test every action. */
export function testMotionFrame(action:MotionTestAction|'auto',time:number,width:number,bodyWidth:number):CompanionFrame{
 const center=Math.max(0,(width-bodyWidth)/2),base={x:center,action:'idle' as MascotAction,actionTime:0,direction:1 as 1|-1,bubble:false,hidden:false,speed:0,walkPhase:0,phaseSpeed:0};
 if(action==='auto'){const total=MOTION_TESTS.reduce((n,t)=>n+t[2]+1,0);let t=Math.max(0,time)%total;for(const [name,,duration] of MOTION_TESTS){if(t<duration+1){const f=testMotionFrame(name,Math.min(t,duration),width,bodyWidth);return{...f,x:center,...(name==='walk'||name==='run'?{speed:t<duration?70:0,walkPhase:t<duration?t*(name==='run'?1.8:1):Math.floor(duration*(name==='run'?1.8:1)*2)/2,phaseSpeed:t<duration?(name==='run'?1.8:1):0}:{}),action:t<duration?name:'idle',actionTime:t<duration?t:t-duration};}t-=duration+1;}return base;}
 const duration=MOTION_TESTS.find(t=>t[0]===action)![2],t=Math.max(0,time),moving=action==='walk'||action==='run';
 if(moving){const from=12,to=Math.max(from,width-bodyWidth-12),travel=walkTravel(from,to,Math.min(t,duration),duration,bodyWidth<=88?138:175);return{...base,...travel,action:t<duration?action:'idle',actionTime:t<duration?t:0};}
 return{...base,action:t<duration?action:'idle',actionTime:t<duration?t:0};
}
