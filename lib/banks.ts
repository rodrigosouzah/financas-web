export interface BankBrand{id:string;name:string;aliases:string[];color:string;logo?:string}
const clean=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)??[];
export function findBank(banks:BankBrand[],name:string):BankBrand|null{
 const words=clean(name),compact=words.join(''),withoutDigits=compact.replace(/\d{4}$/,'');let found:BankBrand|null=null,length=0;
 for(const bank of banks)for(const alias of [bank.name,...bank.aliases]){const tokens=clean(alias),a=tokens.join('');if(a.length<3)continue;const exact=a===compact||a===withoutDigits;const span=words.some((_,i)=>words.slice(i,i+tokens.length).join('')===a);if((exact||span)&&a.length>length){found=bank;length=a.length;}}
 return found;
}
