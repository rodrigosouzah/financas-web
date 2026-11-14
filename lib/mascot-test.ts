import {walkTravel,type MascotAction,type CompanionFrame} from './mascot-motion.ts';
export const MOTION_TESTS=[['walk','Caminhar',2],['run','Correr',2],['turn','Parar e olhar',2],['fall','Cair e levantar',2],['dance','Dançar',2],['sneeze','Espirrar',2],['wave','Acenar',2],['stretch','Espreguiçar',2],['look','Olhar em volta',2],['scratch','Pensar',2],['celebrate','Comemorar',2],['food','Lanchinho',2],['bag','Sacola',2],['beg','Moedinhas',2],['statue','Estátua viva',2],['no','Não, não, não',2],['angry','Cara de bravo',2],['pockets','Bolsos vazios',2],['surprise','Surpresa',2],['water','Banho de balde',2],['costume','Fantasia',2],['row','Remo',2],['sled','Sled push',2],['carry','Farmer carry',2],['beer','Dia de folga',2],['pagode','Pagodinho',2],['skincare','Skincare',2],['sushi','Sushi',2]] as const;
export type MotionTestAction=typeof MOTION_TESTS[number][0];
export function testMotionFrame(action:MotionTestAction|'auto',time:number,width:number,bodyWidth:number,available:readonly MotionTestAction[]=MOTION_TESTS.map(x=>x[0])):CompanionFrame{
 const center=Math.max(0,(width-bodyWidth)/2),base={x:center,action:'idle' as MascotAction,actionTime:0,direction:1 as 1|-1,bubble:false,hidden:false,speed:0,walkPhase:0,phaseSpeed:0};
 if(action==='auto'){const list=available.length?available:['walk' as const],t=Math.max(0,time)%(list.length*3),index=Math.floor(t/3),local=t%3;return local<2?testMotionFrame(list[index],local,width,bodyWidth):base;}
 const t=Math.max(0,time),moving=action==='walk'||action==='run'||action==='sled'||action==='carry',height=bodyWidth<=88?138:175;
 if(moving){const from=Math.max(12,center-height*.4),to=Math.min(width-bodyWidth-12,from+height*(action==='run'?1.2:.8)),travel=walkTravel(from,to,Math.min(t,2),2,height);return{...base,...travel,action:t<2?action:'idle',actionTime:t<2?t:0};}
 return{...base,action:t<2?action:'idle',actionTime:t<2?t:0};
}
