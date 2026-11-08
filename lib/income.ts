import {emptyValues,isoDate,uid,validateEntry,type Currency,type Entry,type Profile} from './finance.ts';
export interface IncomeInput{description:string;amount:string;currency:Currency;accountId:string;date:string;recurring:boolean;endMinus2:boolean;finalDate:string}
/** Explicit form submission creates or edits a canonical income; never a second copy. */
export function buildIncome(p:Profile,input:IncomeInput,previous?:Entry):Entry{
 if(previous&&(previous.kind!=='income'||previous.legacy||previous.values.mode==='Parcelada'))throw new Error('Edite este histórico na lista de lançamentos para preservar o parcelamento.');
 const values={...(previous?.values??emptyValues()),description:input.description.trim(),amount:input.amount.trim(),currency:input.currency,accountId:input.accountId,date:input.date,mode:input.recurring?'Fixa':'Avulsa',finalDate:input.recurring?input.finalDate:'',cardId:''};
 const entry:Entry={...previous,id:previous?.id??uid(),kind:'income',posted:true,values,timing:input.recurring&&input.endMinus2?'endMinus2':'date'};
 const errors=validateEntry(p,entry);if(!input.accountId)errors.push('Escolha a conta de destino do recebimento.');if(input.recurring&&input.finalDate&&isoDate(input.finalDate)&&isoDate(input.date)&&isoDate(input.finalDate)<isoDate(input.date))errors.push('A data final deve ser igual ou posterior ao primeiro recebimento.');if(errors.length)throw new Error(errors.join(' '));return entry;
}
