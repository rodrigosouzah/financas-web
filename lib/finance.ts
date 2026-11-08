export type Currency = 'EUR'|'BRL'|'USD';
export type Mode = 'Avulsa'|'Fixa'|'Parcelada';
export const CURRENCIES: Currency[] = ['EUR','BRL','USD'];
export const TYPES = ['Mercado','Restaurantes','Ócio','Shows','Transporte','Moradia','Saúde','Compras','Viagens','Educação','Assinaturas','Impostos','Financiamentos','Pets','Outros'];
export const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const COLS = ['description','type','mode','amount','currency','category','share','date','finalDate','cardId','accountId'] as const;
export type Column = typeof COLS[number];
export const HEADERS = ['Descrição','Tipo','Modalidade','Valor','Moeda','Categoria','% Receber','Data','Data P.F.','Cartão','Conta'];
export type Values = Record<Column,string>;
export interface LegacyPlan { start:number; final?:number|null; count:number; paid:number; remaining:number; monthly:number; debt:number; reference:number; schedule?:{month:number;number:number;amount:number}[]; creditCardId?:string }
export interface Entry { id:string; kind:'expense'|'income'; values:Values; posted:boolean; ignored?:boolean; timing?:'date'|'endMinus2'; personId?:string; importId?:string; raw?:string[]; legacy?:LegacyPlan }
export interface BankCard { id:string; name:string; lastFour:string; kind:'Crédito'|'Débito'; currency:Currency; limit:number; day:number }
export interface BankAccount { id:string; name:string; lastFour?:string; currency:Currency; balance:number; balanceDate:string }
export interface Person { id:string; name:string; active:boolean }
export interface Goal { id:string; name:string; currency:Currency; target:number; deadline:string; createdAt:string }
export interface Saving { id:string; amount:number; currency:Currency; date:string; goalId:string }
export interface Password { salt:string; digest:string; iterations:number }
export interface ImportInfo { id:string; name:string; fingerprint:string; headers:string[] }
export interface Profile { id:string; name:string; password?:Password; cards:BankCard[]; accounts:BankAccount[]; people:Person[]; entries:Entry[]; goals:Goal[]; savings:Saving[]; imports:ImportInfo[]; types:string[]; colors:Record<string,string>; widgets:string[]; month:string; widgetSizes?:Record<string,string> }
export interface Workspace { schemaVersion:1; profiles:Profile[]; activeId:string|null }
export interface Rates { date:string; fetchedAt:string; perEuro:Partial<Record<Currency,number>>; source:'ECB' }
export const VERSION = '0.3.0-web.6';
export const normalize = (s:string) => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const currentMonth = () => today().slice(0,7);
export const uid = () => crypto.randomUUID();
export const emptyValues = ():Values => ({description:'',type:'',mode:'Avulsa',amount:'',currency:'EUR',category:'Individual',share:'0',date:'',finalDate:'',cardId:'',accountId:''});
export const DEFAULT_WIDGETS = ['balance','income','payments','refunds','cards','debt','savings','installments','brazil','types','exchange','calendar'];
export function newProfile(name:string):Profile { return {id:uid(),name:name.trim(),cards:[],accounts:[],people:[],entries:[],goals:[],savings:[],imports:[],types:[...TYPES],colors:{},widgets:[...DEFAULT_WIDGETS],month:currentMonth()}; }
export function dateParts(value:string):{year:number;month:number;day:number}|null {
 let m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim()),year:number,month:number,day:number;
 if(m){ year=+m[1];month=+m[2];day=+m[3]; } else { m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());if(!m)return null;day=+m[1];month=+m[2];year=+m[3]; }
 const d=new Date(Date.UTC(year,month-1,day));return year>=1900&&year<=2200&&d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?{year,month,day}:null;
}
export function monthIndex(value:string):number|null { const m=/^(\d{4})-(\d{2})$/.exec(value);if(m&&+m[2]>=1&&+m[2]<=12)return +m[1]*12 + +m[2]-1; const d=dateParts(value);return d?d.year*12+d.month-1:null; }
export function monthString(index:number){return `${Math.floor(index/12)}-${String(index%12+1).padStart(2,'0')}`;}
export function isoDate(value:string){const d=dateParts(value);return d?`${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`:'';}
export function displayDate(value:string){const d=dateParts(value);return d?`${String(d.day).padStart(2,'0')}/${String(d.month).padStart(2,'0')}/${d.year}`:value;}
export function typeDate(value:string){if(!/^[\d/]*$/.test(value))return value;const digits=value.replaceAll('/','');if(digits.length>8)return value;return digits.slice(0,2)+(digits.length>2?'/'+digits.slice(2,4):value.endsWith('/')&&digits.length===2?'/':'')+(digits.length>4?'/'+digits.slice(4):value.endsWith('/')&&digits.length===4?'/':'');}
export function parseMoney(input:string,format:'comma'|'dot'='comma'):number|null {
 let s=input.trim().replace(/(?:EUR|BRL|USD|R\$|US\$|[€$\s\u00a0])/gi,'').replaceAll('−','-');let negative=false;
 if(/^\(.*\)$/.test(s)){negative=true;s=s.slice(1,-1);}if(s.startsWith('-')){negative=!negative;s=s.slice(1);}else if(s.startsWith('+'))s=s.slice(1);
 const decimal=format==='comma'?',':'.', group=format==='comma'?'.':',';
 const parts=s.split(decimal);if(parts.length>2)return null;const groups=parts[0].split(group);
 if(!groups.every(x=>/^\d+$/.test(x))||(groups.length>1&&(groups[0].length>3||groups.slice(1).some(x=>x.length!==3)))||(parts.length===2&&!/^\d{1,2}$/.test(parts[1])))return null;
 const whole=Number(groups.join(''));const cents=whole*100+Number((parts[1]??'').padEnd(2,'0'));return Number.isSafeInteger(cents)&&cents<=99999999999?(negative?-cents:cents):null;
}
export function inputMoney(cents:number){return (cents/100).toFixed(2).replace('.',',');}
export function money(cents:number,currency:Currency='EUR',role:'neutral'|'expense'|'income'='neutral'){const sign=cents===0?'':role==='expense'?'−':role==='income'?'+':cents<0?'−':'';return sign+(CURRENCIES.includes(currency)?new Intl.NumberFormat('pt-PT',{style:'currency',currency}).format(Math.abs(cents)/100):new Intl.NumberFormat('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(cents)/100)+' '+currency);}
export function parseShare(value:string):number|null { const n=parseMoney(value.replace(/%/g,''));return n!==null&&n>=0&&n<=10000?n:null; }
export function beneficiary(p:Profile,e:Entry){if(e.personId&&normalize(e.values.category)!=='individual')return p.people.find(x=>x.id===e.personId)?.name??e.values.category;return normalize(e.values.category)==='casal'?p.people.find(x=>x.active)?.name??'':normalize(e.values.category)==='individual'?'':e.values.category;}
export function validateEntry(p:Profile,e:Entry):string[]{
 if(e.ignored)return[];const v=e.values,errors:string[]=[];const amount=parseMoney(v.amount);const first=monthIndex(v.date),end=monthIndex(v.finalDate);
 if(!v.description.trim())errors.push('Informe a descrição.');if(amount===null||amount<=0)errors.push('Informe um valor válido maior que zero.');
 if(!CURRENCIES.includes(v.currency as Currency))errors.push('Moeda inválida. Use EUR, BRL ou USD.');
 if(!['Avulsa','Fixa','Parcelada'].includes(v.mode))errors.push('Escolha Avulsa, Fixa ou Parcelada.');
 if(!dateParts(v.date))errors.push('Informe Data em dd/mm/aaaa.');
 if(v.finalDate&&!dateParts(v.finalDate))errors.push('Data P.F. inválida.');
 if(v.mode==='Parcelada'&&(!e.legacy)&&(first===null||end===null||end-first<1||end-first>359))errors.push('Informe Data P.F. para definir de 2 a 360 parcelas.');
 if(first!==null&&end!==null&&end<first)errors.push('Data P.F. deve ser posterior à primeira data.');
 if(parseShare(v.share)===null)errors.push('Use % Receber entre 0 e 100%.');
 if(!['individual','casal',...p.people.map(x=>normalize(x.name))].includes(normalize(v.category)))errors.push('Escolha uma categoria cadastrada.');
 if(normalize(v.category)==='casal'&&!e.personId&&!p.people.some(x=>x.active))errors.push('Cadastre uma pessoa em Compartilhadas para a categoria Casal.');
 if(v.cardId){const card=p.cards.find(x=>x.id===v.cardId);if(!card)errors.push('O cartão vinculado foi excluído. Escolha outro cartão.');else if(card.currency!==v.currency)errors.push('A moeda é diferente da moeda do cartão.');}
 if(v.accountId){const a=p.accounts.find(x=>x.id===v.accountId);if(!a)errors.push('A conta vinculada foi excluída. Escolha outra conta.');else if(a.currency!==v.currency)errors.push('A moeda é diferente da moeda da conta.');}
 if(e.kind==='expense'&&!v.cardId&&!v.accountId)errors.push('Selecione o cartão ou a conta de pagamento.');
 return errors;
}
export function financiallyValid(e:Entry){const v=e.values,amount=parseMoney(v.amount),start=monthIndex(v.date),end=monthIndex(v.finalDate);return amount!==null&&amount>0&&CURRENCIES.includes(v.currency as Currency)&&dateParts(v.date)!==null&&['Avulsa','Fixa','Parcelada'].includes(v.mode)&&(!v.finalDate||dateParts(v.finalDate)!==null)&&(v.mode!=='Parcelada'||!!e.legacy||start!==null&&end!==null&&end-start>=1&&end-start<=359);}
/** Import drafts are durable but require explicit review before affecting totals. */
export function pendingSummary(p:Profile){const pending=p.entries.filter(e=>!e.posted&&!e.ignored);const ready=pending.filter(e=>validateEntry(p,e).length===0);return{total:pending.length,ready:ready.length,invalid:pending.length-ready.length};}
export function postPending(p:Profile):Profile{return{...p,entries:p.entries.map(e=>!e.posted&&!e.ignored&&validateEntry(p,e).length===0?{...e,posted:true}:e)};}
export interface Charge { entry:Entry; amount:number; currency:Currency; day:number; remaining:number; debt:number; share:number; person:string }
export function entrySchedule(e:Entry,index:number){
 const first=monthIndex(e.values.date),total=parseMoney(e.values.amount);if(first===null||total===null||total<=0)return{amount:0,remaining:0,debt:0,count:0};
 const end=monthIndex(e.values.finalDate);const mode=e.values.mode;
 if(mode==='Fixa')return{amount:index>=first&&(end===null||index<=end)?total:0,remaining:0,debt:0,count:1};
 if(mode!=='Parcelada')return{amount:index===first?total:0,remaining:index<=first?1:0,debt:index<=first?total:0,count:1};
 const legacy=e.legacy;
 if(legacy){
  let amount=0;
  if(legacy.final==null||index<=legacy.final){
   if(legacy.schedule?.length)amount=legacy.schedule.filter(x=>x.month===index&&x.number>legacy.paid).reduce((s,x)=>s+x.amount,0);
   else if(index>=legacy.start&&index<= (legacy.final??legacy.start+legacy.remaining-1)&&legacy.remaining>0)amount=legacy.monthly;
  }
  const before=Math.max(0,index-legacy.start),remaining=Math.max(0,legacy.remaining-before);
  const scheduled=legacy.schedule?.filter(x=>x.month>=index&&x.number>legacy.paid).reduce((s,x)=>s+x.amount,0);
  // Reported bank principal can differ from payments with interest; keep it distinct.
  const debt=legacy.debt;
  return{amount,remaining,debt,count:legacy.count,paymentCommitment:scheduled??remaining*legacy.monthly};
 }
 const count=end!==null?end-first+1:0;if(count<2||count>360)return{amount:0,remaining:0,debt:0,count:0};
 let regular=Math.round(total/count);if(regular*(count-1)>total)regular=Math.floor(total/count);
 const nth=index-first;const amount=nth>=0&&nth<count?(nth===count-1?total-regular*(count-1):regular):0;
 const remaining=Math.max(0,Math.min(count,first+count-index));const elapsed=Math.max(0,Math.min(count,nth));const debt=total;
 return{amount,remaining,debt,count};
}
export function dueDay(p:Profile,e:Entry,index:number){const card=p.cards.find(x=>x.id===e.values.cardId);const days=new Date(Date.UTC(Math.floor(index/12),index%12+1,0)).getUTCDate();if(e.timing==='endMinus2')return days-2;return Math.min(days,card?.kind==='Crédito'?card.day:dateParts(e.values.date)?.day??1);}
export function charges(p:Profile,month=p.month):Charge[]{const index=monthIndex(month);if(index===null)return[];return p.entries.filter(e=>e.posted&&!e.ignored&&financiallyValid(e)).map(e=>{const s=entrySchedule(e,index);return{entry:e,amount:s.amount,currency:e.values.currency as Currency,day:dueDay(p,e,index),remaining:s.remaining,debt:s.debt,share:parseShare(e.values.share)??0,person:beneficiary(p,e)};}).filter(x=>x.amount!==0);}
export const sumCurrency=(items:{amount:number;currency:Currency}[])=>Object.fromEntries(CURRENCIES.map(c=>[c,items.filter(x=>x.currency===c).reduce((a,x)=>a+x.amount,0)])) as Record<Currency,number>;
export function convert(cents:number,from:Currency,to:Currency,rates:Rates|null){if(from===to)return cents;const a=from==='EUR'?1:rates?.perEuro[from],b=to==='EUR'?1:rates?.perEuro[to];return a&&b?Math.round(cents/a*b):null;}
export function eurTotal(totals:Record<Currency,number>,rates:Rates|null){const missing=CURRENCIES.filter(c=>totals[c]!==0&&convert(totals[c],c,'EUR',rates)===null);return{amount:CURRENCIES.reduce((s,c)=>s+(convert(totals[c],c,'EUR',rates)??0),0),missing};}
export function cardSummary(p:Profile,card:BankCard,month=p.month){const idx=monthIndex(month)!;const rows=charges(p,month).filter(x=>x.entry.kind==='expense'&&x.entry.values.cardId===card.id);const due=rows.reduce((s,x)=>s+x.amount,0);let used=0;for(const e of p.entries){if(!e.posted||e.ignored||e.kind!=='expense'||!financiallyValid(e)||(e.values.cardId!==card.id&&e.legacy?.creditCardId!==card.id)||e.values.currency!==card.currency)continue;const schedule=entrySchedule(e,idx);used+=e.values.mode==='Parcelada'?schedule.debt:parseMoney(e.values.amount)??0;}return{due,used,available:card.kind==='Crédito'?card.limit-used:null,rows};}
export function accountForecast(p:Profile,account:BankAccount,month=p.month){const target=monthIndex(month)!,start=monthIndex(account.balanceDate);if(start===null||target<start)return null;const date=isoDate(account.balanceDate);let balance=account.balance,income=0,expense=0;for(let m=start;m<=target;m++){for(const c of charges(p,monthString(m))){if(c.entry.values.accountId!==account.id||c.currency!==account.currency)continue;const at=`${monthString(m)}-${String(c.day).padStart(2,'0')}`;if(at<=date)continue;balance+=c.entry.kind==='income'?c.amount:-c.amount;if(m===target){if(c.entry.kind==='income')income+=c.amount;else expense+=c.amount;}}}return{balance,income,expense};}
export function goalProgress(p:Profile,g:Goal,month=p.month){const saved=p.savings.filter(x=>x.goalId===g.id&&x.currency===g.currency).reduce((s,x)=>s+x.amount,0),left=Math.max(0,g.target-saved);const due=monthIndex(g.deadline),start=monthIndex(month)!;const months=due===null?1:Math.max(1,due-start+1);return{saved,left,monthly:Math.ceil(left/months),progress:g.target>0?Math.min(1,saved/g.target):0,overdue:due!==null&&due<start&&left>0};}
export function editValue(p:Profile,e:Entry,column:Column,value:string):Entry {
 const values={...e.values,[column]:column==='date'||column==='finalDate'?typeDate(value):value};
 if(column==='category'&&normalize(value)!==normalize(e.values.category))values.share=normalize(value)==='individual'?'0':normalize(value)==='casal'?'50':'100';
 let legacy=e.legacy;if(legacy&&value!==e.values[column]&&['date','finalDate','mode'].includes(column)){if(column==='date'){const from=monthIndex(e.values.date),to=monthIndex(value);if(from!==null&&to!==null){const shift=to-from;legacy={...legacy,start:legacy.start+shift,final:legacy.final==null?legacy.final:legacy.final+shift,schedule:legacy.schedule?.map(q=>({...q,month:q.month+shift}))};}}else if(column==='finalDate'){const end=monthIndex(value);if(end!==null)legacy={...legacy,final:end};}else legacy=undefined;}
 if(e.legacy&&['amount','currency'].includes(column)&&value!==e.values[column])throw new Error('Este financiamento tem histórico confirmado. Preserve o valor original e a moeda.');
 const personId=column==='category'&&normalize(value)!==normalize(e.values.category)?(normalize(value)==='casal'?p.people.find(x=>x.active)?.id:p.people.find(x=>normalize(x.name)===normalize(value))?.id):e.personId;return{...e,values,legacy,personId};
}
const PALETTE=['32936F','E58B36','A875CC','D86491','4689C8','A48B6A','D87979','BA9C37','44A5A5','6D8BCE','8E83B8','71859A','68987A','BE8E66','8D9199'];
export function typeColor(p:Profile,type:string){const key=normalize(type);if(!key)return'';if(key in p.colors)return p.colors[key];const index=TYPES.findIndex(t=>normalize(t)===key);let hash=0;for(const c of key)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return PALETTE[index>=0?index:hash%PALETTE.length];}
export function rowBackground(p:Profile,type:string){const hex=typeColor(p,type);if(!/^[\dA-F]{6}$/i.test(hex))return'#FFFFFF';const n=parseInt(hex,16);return`rgb(${[16,8,0].map(s=>Math.round(214.2+0.16*((n>>s)&255))).join(',')})`;}
export function renameType(p:Profile,old:string,name:string,color:string){const next=name.trim();if(!next||next.length>60||/[\u0000-\u001F]/.test(next)||!normalize(next))throw new Error('Use um nome de 1 a 60 caracteres.');if(p.types.some(t=>normalize(t)!==normalize(old)&&normalize(t)===normalize(next)))throw new Error('Já existe um tipo com este nome.');const colors={...p.colors};delete colors[normalize(old)];colors[normalize(next)]=color;return{...p,types:p.types.map(t=>normalize(t)===normalize(old)?next:t),colors,entries:p.entries.map(e=>normalize(e.values.type)===normalize(old)?{...e,values:{...e.values,type:next}}:e)};}
export function validLegacy(x:LegacyPlan):boolean {
 const integer=(n:unknown,min:number,max:number)=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
 return !!x&&integer(x.start,22800,26411)&&(x.final==null||integer(x.final,x.start,26411))&&integer(x.count,1,360)&&integer(x.paid,0,x.count)&&integer(x.remaining,0,x.count)&&integer(x.monthly,0,99999999999)&&integer(x.debt,0,99999999999)&&integer(x.reference,22800,26411)&&(x.creditCardId===undefined||typeof x.creditCardId==='string'&&x.creditCardId.length<=500)&&(!x.schedule||Array.isArray(x.schedule)&&x.schedule.length<=360&&x.schedule.every(q=>integer(q.month,22800,26411)&&integer(q.number,1,x.count)&&integer(q.amount,0,99999999999)));
}
export function validateWorkspace(input:unknown):Workspace {
 const fail=(s:string):never=>{throw new Error(s);};
 const text=(x:unknown,max=500,required=false)=>typeof x==='string'&&x.length<=max&&(!required||!!x.trim());
 const amount=(x:unknown,negative=false)=>Number.isSafeInteger(x)&&Math.abs(Number(x))<=99999999999&&(negative||Number(x)>=0);
 const unique=(items:{id:string}[])=>{const ids=new Set<string>();for(const x of items){if(!x||!text(x.id,100,true)||ids.has(x.id))fail('Identificadores inválidos ou repetidos.');ids.add(x.id);}};
 if(!input||typeof input!=='object')fail('Backup inválido.');const state=input as Workspace;
 if(state.schemaVersion!==1||!Array.isArray(state.profiles)||state.profiles.length>30)fail('Formato de dados incompatível.');unique(state.profiles);
 for(const p of state.profiles){if(!text(p.name,80,true))fail('Perfil inválido.');
 for(const key of ['cards','accounts','people','entries','goals','savings','imports','types','widgets'] as const)if(!Array.isArray(p[key]))fail('Dados incompletos no perfil.');
 if(p.entries.length>10000||p.cards.length>100||p.accounts.length>100||p.people.length>100||p.goals.length>100||p.savings.length>10000||p.imports.length>1000||p.types.length>100||p.widgets.length>DEFAULT_WIDGETS.length)fail('O backup excede os limites do aplicativo.');
 for(const key of ['cards','accounts','people','entries','goals','savings','imports'] as const)unique(p[key]);
 if(!p.colors||Array.isArray(p.colors)||typeof p.colors!=='object'||Object.keys(p.colors).length>100||Object.entries(p.colors).some(([k,x])=>!text(k,100)||typeof x!=='string'||(x!==''&&!/^[\dA-F]{6}$/i.test(x))))fail('Cores inválidas.');
 for(const e of p.entries){if(!['expense','income'].includes(e.kind)||typeof e.posted!=='boolean'||!e.values||COLS.some(k=>!text(e.values[k]))||e.ignored!==undefined&&typeof e.ignored!=='boolean'||e.timing!==undefined&&!['date','endMinus2'].includes(e.timing)||e.personId!==undefined&&!text(e.personId,100)||e.importId!==undefined&&!text(e.importId,100)||e.raw!==undefined&&(!Array.isArray(e.raw)||e.raw.length>64||e.raw.some(v=>!text(v,10000)))||e.legacy!==undefined&&!validLegacy(e.legacy))fail('Lançamento ou histórico de parcelas inválido.');}
 for(const c of p.cards)if(!text(c.name,80,true)||!['Crédito','Débito'].includes(c.kind)||!CURRENCIES.includes(c.currency)||!amount(c.limit)||!Number.isInteger(c.day)||c.day<1||c.day>31||!/^\d{4}$/.test(c.lastFour))fail('Cartão inválido.');
 for(const a of p.accounts)if(!text(a.name,80,true)||!CURRENCIES.includes(a.currency)||!amount(a.balance,true)||!text(a.balanceDate)||!dateParts(a.balanceDate)||a.lastFour!==undefined&&a.lastFour!==''&&!/^\d{4}$/.test(a.lastFour))fail('Conta inválida.');
 for(const person of p.people)if(!text(person.name,80,true)||typeof person.active!=='boolean')fail('Pessoa inválida.');
 for(const g of p.goals)if(!text(g.name,100,true)||!CURRENCIES.includes(g.currency)||!amount(g.target)||g.target<=0||!text(g.deadline)||!dateParts(g.deadline)||!text(g.createdAt)||!dateParts(g.createdAt))fail('Objetivo inválido.');
 for(const saving of p.savings)if(!amount(saving.amount)||saving.amount<=0||!CURRENCIES.includes(saving.currency)||!text(saving.date)||!dateParts(saving.date)||!text(saving.goalId,100)||saving.goalId&&!p.goals.some(g=>g.id===saving.goalId&&g.currency===saving.currency))fail('Depósito ou objetivo vinculado inválido.');
 for(const i of p.imports)if(!text(i.name,500,true)||!text(i.fingerprint,64)||!/^([a-f0-9]{64})$/.test(i.fingerprint)||!Array.isArray(i.headers)||i.headers.length>64||i.headers.some(h=>!text(h,500)))fail('Importação inválida.');
 if(p.types.some(t=>!text(t,60,true))||new Set(p.types.map(normalize)).size!==p.types.length||p.widgets.some(w=>!DEFAULT_WIDGETS.includes(w))||new Set(p.widgets).size!==p.widgets.length)fail('Tipos ou widgets inválidos.');
 if(p.widgetSizes&&(typeof p.widgetSizes!=='object'||Object.entries(p.widgetSizes).some(([k,v])=>!DEFAULT_WIDGETS.includes(k)||!['single','wide','large','1x1','2x1','2x2','1','2','big'].includes(v))))fail('Dimensão de widget inválida.');
 if(p.password&&(!Number.isInteger(p.password.iterations)||p.password.iterations<100000||p.password.iterations>2000000||!text(p.password.salt,24)||!text(p.password.digest,44)||!/^[A-Za-z0-9+/]{22}==$/.test(p.password.salt)||!/^[A-Za-z0-9+/]{43}=$/.test(p.password.digest)))fail('Proteção de perfil inválida.');
 if(!text(p.month,7)||!/^\d{4}-\d{2}$/.test(p.month)||monthIndex(p.month)===null||Number(p.month.slice(0,4))<1900||Number(p.month.slice(0,4))>2200)fail('Mês inválido.');
 }
 if(state.activeId!==null&&!state.profiles.some(p=>p.id===state.activeId))fail('Perfil ativo inválido.');return structuredClone(state);
}
