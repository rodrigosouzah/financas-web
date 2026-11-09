'use client';
import {type Profile} from '../lib/finance';
import {entryOptions,type EntryChoiceColumn} from '../lib/entry-options';
const labels:Record<EntryChoiceColumn,string>={type:'Tipo do gasto',mode:'Modalidade',currency:'Moeda',category:'Categoria de compartilhamento',cardId:'Cartão',accountId:'Conta'};
export function EntrySelect({profile,column,value,onChange,onPersonalize}:{profile:Profile;column:EntryChoiceColumn;value:string;onChange:(value:string)=>void;onPersonalize?:()=>void}){return <select aria-label={labels[column]} value={value} onChange={e=>e.target.value==='__personalizar'?onPersonalize?.():onChange(e.target.value)}>{entryOptions(profile,column,value).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}{column==='type'&&onPersonalize&&<option value="__personalizar">Personalizar</option>}</select>;}
