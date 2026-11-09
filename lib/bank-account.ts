import {type BankAccount,type Currency,type Profile,CURRENCIES,normalize,today,uid} from './finance.ts';
/** Registers payment destinations without inventing a known bank balance. */
export function buildPaymentAccount(p:Profile,input:{name:string;lastFour:string;currency:string},existing?:BankAccount):BankAccount{
 const name=input.name.trim(),lastFour=input.lastFour.trim(),currency=existing?.currency??input.currency as Currency;
 if(!name||name.length>80||!/^\d{4}$/.test(lastFour)||!CURRENCIES.includes(currency))throw Error('Confira o banco, a moeda e os últimos 4 dígitos do IBAN.');
 if(p.accounts.some(a=>a.id!==existing?.id&&normalize(a.name)===normalize(name)&&a.currency===currency&&a.lastFour===lastFour))throw Error('Esta conta já está cadastrada.');
 return {...existing,id:existing?.id??uid(),name,lastFour,currency,balance:existing?.balance??0,balanceDate:existing?.balanceDate??today(),balanceKnown:existing?.balanceKnown??!!existing};
}
