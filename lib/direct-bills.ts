import {charges,validateEntry,type Profile,type BankAccount} from './finance.ts';
/** A funding account on a credit-card purchase does not make it a direct debit. */
export function directAccountBills(p:Profile){const due=new Map(charges(p).filter(c=>c.entry.kind==='expense').map(c=>[c.entry.id,c]));return p.entries.filter(e=>{if(!e.posted||e.ignored||e.kind!=='expense')return false;const card=p.cards.find(c=>c.id===e.values.cardId);return e.values.cardId?card?.kind==='Débito':!!e.values.accountId;}).map(entry=>({entry,account:p.accounts.find(a=>a.id===entry.values.accountId),card:p.cards.find(c=>c.id===entry.values.cardId),charge:due.get(entry.id)??null,errors:validateEntry(p,entry)}));}

/** Full selected-month outflow; balance-date cutoffs apply only to balance forecasts. */
export function accountMonthDebits(p:Profile,account:BankAccount){const linked=charges(p).filter(c=>c.entry.kind==='expense'&&c.entry.values.accountId===account.id),rows=linked.filter(c=>c.currency===account.currency);return{amount:rows.reduce((sum,c)=>sum+c.amount,0),count:rows.length,rows,foreign:linked.filter(c=>c.currency!==account.currency)};}
