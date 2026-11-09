import {type Profile,type Column,CURRENCIES,normalize} from './finance.ts';
import {typeChoices} from './expense-types.ts';
export const ENTRY_MODES=['Avulsa','Fixa','Parcelada'] as const;
export type EntryChoiceColumn=Extract<Column,'type'|'mode'|'currency'|'category'|'cardId'|'accountId'>;
export interface EntryOption{value:string;label:string;missing?:boolean}
/** Shared active-profile catalog for the expense grid, new-entry form and chat. */
export function entryOptions(p:Profile,key:EntryChoiceColumn,current?:string):EntryOption[]{
 let options:EntryOption[];
 if(key==='type')options=[{value:'',label:'Selecione'},...typeChoices(p).map(value=>({value,label:value}))];
 else if(key==='mode')options=ENTRY_MODES.map(value=>({value,label:value}));
 else if(key==='currency')options=CURRENCIES.map(value=>({value,label:value}));
 else if(key==='category')options=[...new Set(['Individual','Casal',...p.people.map(x=>x.name)])].map(value=>({value,label:value}));
 else if(key==='cardId')options=[{value:'',label:'Selecione'},...p.cards.map(c=>({value:c.id,label:`${c.name} • ${c.lastFour} • ${c.currency}`}))];
 else options=[{value:'',label:'Selecione'},...p.accounts.map(a=>({value:a.id,label:`${a.name}${a.lastFour?' • '+a.lastFour:''} • ${a.currency}`}))];
 if(current===''&&!options.some(o=>o.value===''))options.unshift({value:'',label:'Selecione'});
 if(current&&!options.some(o=>o.value===current))options.push({value:current,label:current.startsWith('unlinked:')?current.slice(9):key==='cardId'?'Cartão excluído / não cadastrado':key==='accountId'?'Conta excluída / não cadastrada':current,missing:true});
 return options;
}
export function canonicalOption(p:Profile,key:EntryChoiceColumn,value:string){return entryOptions(p,key).find(o=>o.value===value||normalize(o.value)===normalize(value))?.value??null;}
