import {beneficiary,normalize,charges,validateEntry,type Profile,type BankAccount} from './finance.ts';
/** A funding account on a credit-card purchase does not make it a direct debit. */
export function directAccountBills(p:Profile){const due=new Map(charges(p).filter(c=>c.entry.kind==='expense').map(c=>[c.entry.id,c]));return p.entries.filter(e=>{if(!e.posted||e.ignored||e.kind!=='expense')return false;const card=p.cards.find(c=>c.id===e.values.cardId);return e.values.cardId?card?.kind==='Débito':!!e.values.accountId;}).map(entry=>({entry,account:p.accounts.find(a=>a.id===entry.values.accountId),card:p.cards.find(c=>c.id===entry.values.cardId),charge:due.get(entry.id)??null,errors:validateEntry(p,entry)}));}

/** Full selected-month outflow; balance-date cutoffs apply only to balance forecasts. */
export function accountMonthDebits(p:Profile,account:BankAccount){const linked=charges(p).filter(c=>c.entry.kind==='expense'&&c.entry.values.accountId===account.id),rows=linked.filter(c=>c.currency===account.currency);return{amount:rows.reduce((sum,c)=>sum+c.amount,0),count:rows.length,rows,foreign:linked.filter(c=>c.currency!==account.currency)};}

/** Expected reimbursements are routed to the registered person's receiving account. */
export function accountMonthFlow(p:Profile,account:BankAccount){
 const debits=accountMonthDebits(p,account),all=charges(p),incomes=all.filter(c=>c.entry.kind==='income'&&c.entry.values.accountId===account.id),incomeRows=incomes.filter(c=>c.currency===account.currency);
 const routed=all.filter(c=>c.entry.kind==='expense'&&c.share>0).flatMap(c=>{const person=c.entry.personId?p.people.find(person=>person.id===c.entry.personId):p.people.find(person=>normalize(person.name)===normalize(beneficiary(p,c.entry)));if(!person)return[];const destination=person.reimbursementAccounts?.[c.currency]||c.entry.values.accountId;if(destination!==account.id)return[];return[{...c,amount:Math.round(c.amount*c.share/10000),person:person.name}];});
 const refundRows=routed.filter(c=>c.currency===account.currency),income=incomeRows.reduce((sum,c)=>sum+c.amount,0),refunds=refundRows.reduce((sum,c)=>sum+c.amount,0);
 return{...debits,income,incomeRows,refunds,refundRows,net:income+refunds-debits.amount,foreign:[...debits.foreign,...incomes.filter(c=>c.currency!==account.currency),...routed.filter(c=>c.currency!==account.currency)]};
}
