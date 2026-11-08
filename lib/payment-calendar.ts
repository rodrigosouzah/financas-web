import {CURRENCIES,MONTHS,convert,monthIndex,sumCurrency,type Charge,type Currency,type Mode,type Rates} from './finance.ts';
export type CalendarMode='Todas'|Mode;
export interface CalendarDay{day:number;charges:Charge[];totals:Record<Currency,number>;euro:number|null}
export function paymentCalendar(charges:Charge[],month:string,mode:CalendarMode='Todas',rates:Rates|null=null){
 const index=monthIndex(month);if(index===null||!/^\d{4}-\d{2}$/.test(month))throw new Error('Mês inválido.');
 const year=Math.floor(index/12),m=index%12,first=new Date(Date.UTC(year,m,1)),length=new Date(Date.UTC(year,m+1,0)).getUTCDate();
 const offset=(first.getUTCDay()+6)%7,rows=Math.ceil((offset+length)/7);
 const payments=charges.filter(c=>c.entry.kind==='expense'&&(mode==='Todas'||c.entry.values.mode===mode));
 const euro=(totals:Record<Currency,number>)=>{let amount=0;for(const c of CURRENCIES){if(totals[c]===0)continue;const value=convert(totals[c],c,'EUR',rates);if(value===null)return null;amount+=value;}return amount;};
 const days:CalendarDay[]=Array.from({length},(_,i)=>{const day=i+1,due=payments.filter(c=>c.day===day),totals=sumCurrency(due);return{day,charges:due,totals,euro:euro(totals)};});
 const cells:(CalendarDay|null)[]=[...Array.from({length:offset},()=>null),...days];while(cells.length<rows*7)cells.push(null);
 // Sum daily converted amounts so the month total agrees with its displayed days.
 const totalEuro=days.some(d=>d.euro===null)?null:days.reduce((sum,d)=>sum+(d.euro??0),0);
 return{label:`${MONTHS[m]} de ${year}`,offset,rows,days,cells,totals:sumCurrency(payments),euro:totalEuro,converted:payments.some(c=>c.currency!=='EUR')};
}
