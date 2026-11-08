import test from 'node:test';
import assert from 'node:assert/strict';
import {newProfile,emptyValues,charges,type Entry} from '../lib/finance.ts';
import {paymentCalendar} from '../lib/payment-calendar.ts';
const p=newProfile('In-memory calendar test');p.month='2026-11';
const e=(id:string,amount:string,day:number,currency='EUR',mode='Avulsa',kind:Entry['kind']='expense'):Entry=>({id,kind,posted:true,values:{...emptyValues(),description:'Calendar model test',amount,date:`${day}/11/2026`,currency,mode,finalDate:mode==='Parcelada'?'01/01/2027':''}});
test('calendar has all dates and Monday-first alignment for four, five and six weeks',()=>{
 for(const [month,offset,days,rows] of [['2021-02',0,28,4],['2026-12',1,31,5],['2026-11',6,30,6],['2028-02',1,29,5]] as const){const c=paymentCalendar([],month);assert.equal(c.offset,offset);assert.equal(c.days.length,days);assert.equal(c.rows,rows);assert.equal(c.cells.length,rows*7);assert.ok(c.cells.slice(0,offset).every(d=>d===null));assert.equal(c.cells[offset]?.day,1);assert.equal(c.cells[offset+days-1]?.day,days);assert.deepEqual(c.days.map(d=>d.day),Array.from({length:days},(_,i)=>i+1));assert.equal(c.euro,0);}
});
test('daily and monthly totals include only selected-month expenses and respect mode filters',()=>{
 p.entries=[e('a','100,00',5),e('b','20,00',5,'EUR','Fixa'),e('c','90,01',9,'EUR','Parcelada'),e('income','1000,00',5,'EUR','Avulsa','income'),{...e('pending','200,00',5),posted:false}];const due=charges(p);const all=paymentCalendar(due,p.month);assert.equal(all.days[4].euro,12000);assert.equal(all.days[4].charges.length,2);assert.equal(all.days[8].euro,3000);assert.equal(all.euro,15000);assert.equal(all.days[0].charges.length,0);assert.equal(paymentCalendar(due,p.month,'Fixa').euro,2000);assert.equal(paymentCalendar(due,p.month,'Avulsa').euro,10000);assert.equal(paymentCalendar(due,p.month,'Parcelada').euro,3000);assert.equal(paymentCalendar(charges(p,'2027-01'),'2027-01','Parcelada').euro,3001);assert.equal(paymentCalendar(charges(p,'2027-02'),'2027-02','Parcelada').euro,0);
});
test('mixed currencies are converted explicitly or kept separate when rates are missing',()=>{
 p.entries=[e('eu','10,00',5),e('br','60,00',5,'BRL'),e('us','12,00',9,'USD')];const due=charges(p),native=paymentCalendar(due,p.month);assert.equal(native.euro,null);assert.equal(native.days[4].euro,null);assert.deepEqual(native.totals,{EUR:1000,BRL:6000,USD:1200});const rates={date:'2026-11-06',fetchedAt:'2026-11-08',source:'ECB' as const,perEuro:{EUR:1,BRL:6,USD:1.2}};const converted=paymentCalendar(due,p.month,'Todas',rates);assert.equal(converted.days[4].euro,2000);assert.equal(converted.days[8].euro,1000);assert.equal(converted.euro,3000);assert.equal(converted.euro,converted.days.reduce((s,d)=>s+(d.euro??0),0));assert.equal(converted.converted,true);
});
