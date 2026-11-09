import {entryOptions,canonicalOption} from './entry-options.ts';
import {type Profile,type Values,type Entry,emptyValues,parseMoney,inputMoney,dateParts,displayDate,monthIndex,normalize,validateEntry} from './finance.ts';
export interface ChatMessage{role:'user'|'assistant';content:string}
export interface ExpenseProposal{description:string|null;type:string|null;mode:'Avulsa'|'Fixa'|'Parcelada'|null;amount:string|null;amountBasis:'total'|'monthly'|null;currency:'EUR'|'BRL'|'USD'|null;category:string|null;share:string|null;date:string|null;finalDate:string|null;installmentCount:number|null;cardId:string|null;accountId:string|null}
export const expenseProposalSchema={"type":"object","additionalProperties":false,"properties":{"reply":{"type":"string"},"entry":{"anyOf":[{"type":"null"},{"type":"object","additionalProperties":false,"properties":{"description":{"type":["string","null"]},"type":{"type":["string","null"]},"amount":{"type":["string","null"]},"category":{"type":["string","null"]},"share":{"type":["string","null"]},"date":{"type":["string","null"]},"finalDate":{"type":["string","null"]},"cardId":{"type":["string","null"]},"accountId":{"type":["string","null"]},"mode":{"type":["string","null"],"enum":["Avulsa","Fixa","Parcelada",null]},"amountBasis":{"type":["string","null"],"enum":["total","monthly",null]},"currency":{"type":["string","null"],"enum":["EUR","BRL","USD",null]},"installmentCount":{"type":["integer","null"]}},"required":["description","type","amount","category","share","date","finalDate","cardId","accountId","mode","amountBasis","currency","installmentCount"]}]}},"required":["reply","entry"]};
export function chatMessages(value:unknown):ChatMessage[]{
 if(!Array.isArray(value)||value.length<1||value.length>12)throw new Error('Inicie uma nova conversa.');
 let size=0;return value.map(m=>{if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>2000)throw new Error('Use mensagens de até 2.000 caracteres.');size+=m.content.length;if(size>10000)throw new Error('Conversa muito longa. Inicie outra.');return{role:m.role,content:m.content};});
}
export function chatContext(p:Profile){return{types:entryOptions(p,'type').filter(x=>x.value).map(x=>x.value),cards:p.cards.map(c=>({id:c.id,name:c.name,lastFour:c.lastFour,currency:c.currency})),accounts:p.accounts.map(a=>({id:a.id,name:a.name,lastFour:a.lastFour??'',currency:a.currency})),people:p.people.map(x=>({name:x.name,active:x.active})),categories:entryOptions(p,'category').map(x=>x.value)};}
export function prepareExpense(p:Profile,raw:unknown):{values:Values|null;issues:string[]}{
 if(!raw||typeof raw!=='object')return{values:null,issues:[]};
 const r=raw as Record<string,unknown>,v=emptyValues(),issues:string[]=[];
 for(const key of Object.keys(v) as (keyof Values)[]){if(typeof r[key]==='string'&&(r[key] as string).length<=250)v[key]=r[key] as string;}
 // Only the same harmless sharing defaults as the manual form are supplied.
 v.mode=typeof r.mode==='string'?r.mode:'';v.currency=typeof r.currency==='string'?r.currency:'';
 v.category=typeof r.category==='string'?r.category:'Individual';
 v.share=typeof r.share==='string'?r.share:normalize(v.category)==='individual'?'0':normalize(v.category)==='casal'?'50':'100';
 if(v.type){const type=canonicalOption(p,'type',v.type);if(type!==null)v.type=type;else{v.type='';issues.push('Escolha um tipo cadastrado em Despesas.');}}
 const category=canonicalOption(p,'category',v.category);if(category!==null)v.category=category;else{v.category='';issues.push('Escolha uma categoria cadastrada em Despesas.');}
 const card=p.cards.find(c=>c.id===v.cardId),account=p.accounts.find(a=>a.id===v.accountId);
 if(v.cardId&&!card){v.cardId='';issues.push('Escolha um cartão cadastrado.');}
 if(v.accountId&&!account){v.accountId='';issues.push('Escolha uma conta cadastrada.');}
 const inferred=card?.currency??account?.currency;if(!v.currency&&inferred)v.currency=inferred;
 const start=dateParts(v.date),count=r.installmentCount;
 if(v.mode==='Parcelada'){
  if(count!==null&&count!==undefined&&(!Number.isInteger(count)||Number(count)<2||Number(count)>360))issues.push('Informe de 2 a 360 parcelas.');
  else if(typeof count==='number'&&start){
   const final=new Date(Date.UTC(start.year,start.month-1+count-1,1)),day=Math.min(start.day,new Date(Date.UTC(final.getUTCFullYear(),final.getUTCMonth()+1,0)).getUTCDate());
   const computed=`${String(day).padStart(2,'0')}/${String(final.getUTCMonth()+1).padStart(2,'0')}/${final.getUTCFullYear()}`;
   if(v.finalDate&&monthIndex(v.finalDate)!==monthIndex(computed))issues.push('A data final e a quantidade de parcelas não coincidem.');else v.finalDate=computed;
  }
  const amount=parseMoney(v.amount);
  if(r.amountBasis==='monthly'){
   const months=count??(v.finalDate&&start?Number(monthIndex(v.finalDate))-Number(monthIndex(v.date))+1:null);
   if(amount!==null&&Number.isInteger(months)&&Number(months)>=2&&Number(months)<=360&&Number.isSafeInteger(amount*Number(months)))v.amount=inputMoney(amount*Number(months));else issues.push('Informe a quantidade de parcelas para calcular o valor total.');
  }else if(r.amountBasis!=='total')issues.push('Confirme se o valor informado é o total da compra ou o valor de cada parcela.');
 }
 const entry:Entry={id:'review',kind:'expense',posted:false,values:v};
 issues.push(...validateEntry(p,entry));return{values:v,issues:[...new Set(issues)]};
}
