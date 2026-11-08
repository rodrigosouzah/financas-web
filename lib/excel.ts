import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { COLS, HEADERS, type Column, type Profile, type Entry, type Values, type Currency, type ImportInfo, emptyValues, normalize, parseMoney, inputMoney, dateParts, monthIndex, uid, validLegacy, type LegacyPlan } from './finance.ts';
export type TableCell=string|number;
export interface WorkbookTable { sheets:{name:string;rows:TableCell[][]}[]; missingFormulas:number }
const child=(element:Element,name:string)=>Array.from(element.children).find(x=>x.localName===name);
const descendants=(element:Document|Element,name:string)=>Array.from(element.getElementsByTagNameNS('*',name));
function xml(bytes:Uint8Array){const text=strFromU8(bytes);if(/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('Arquivo XML não permitido.');const doc=new DOMParser().parseFromString(text,'application/xml');if(descendants(doc,'parsererror').length)throw new Error('O Excel contém XML inválido.');return doc;}
function columnIndex(ref:string){let n=0;for(const c of ref.replace(/\d/g,''))n=n*26+c.charCodeAt(0)-64;return n-1;}
export async function readWorkbook(file:File):Promise<WorkbookTable>{
 if(file.size>50*1024*1024)throw new Error('Escolha um Excel de até 50 MB.');if(!/\.xls[mx]$/i.test(file.name))throw new Error('Use .xlsx ou .xlsm. Salve arquivos .xls como .xlsx no Excel.');
 let total=0;const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:info=>{const use=/^xl\/(?:workbook\.xml|_rels\/workbook\.xml.rels|sharedStrings\.xml|styles\.xml|worksheets\/[^/]+\.xml)$/.test(info.name);if(use){total+=info.originalSize;if(total>70*1024*1024)throw new Error('O conteúdo descompactado é muito grande.');}return use;}});
 if(!files['xl/workbook.xml']||!files['xl/_rels/workbook.xml.rels'])throw new Error('Pasta de trabalho Excel inválida.');
 const book=xml(files['xl/workbook.xml']),rels=xml(files['xl/_rels/workbook.xml.rels']);
 const relationships=Object.fromEntries(descendants(rels,'Relationship').filter(x=>x.getAttribute('TargetMode')!=='External').map(x=>[x.getAttribute('Id'),x.getAttribute('Target')??'']));
 const shared=files['xl/sharedStrings.xml']?descendants(xml(files['xl/sharedStrings.xml']),'si').map(x=>descendants(x,'t').map(t=>t.textContent??'').join('')):[];
 const styles=files['xl/styles.xml']?xml(files['xl/styles.xml']):null;
 const formats=styles?Object.fromEntries(descendants(styles,'numFmt').map(x=>[x.getAttribute('numFmtId'),x.getAttribute('formatCode')??''])):{};
 const xf=styles?Array.from(descendants(styles,'cellXfs')[0]?.children??[]):[];
 const isDate=(style:number)=>{const id=+(xf[style]?.getAttribute('numFmtId')??0),fmt=String(formats[id]??'').replace(/"[^"]*"|\\./g,'');return(id>=14&&id<=22)||/[dy]/i.test(fmt);};
 const isPercent=(style:number)=>{const id=+(xf[style]?.getAttribute('numFmtId')??0);return id===9||id===10||String(formats[id]??'').includes('%');};
 const offset=descendants(book,'workbookPr')[0]?.getAttribute('date1904')==='1'?1462:0;let missingFormulas=0;
 const sheets=descendants(book,'sheet').map(sheet=>{
  const rid=sheet.getAttribute('r:id')??sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')??'';
  const target=relationships[rid]??'';const path=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:'xl/'+target.replace(/^\.\//,'');
  if(path.includes('..')||!files[path])return{name:sheet.getAttribute('name')??'Aba',rows:[]};
  const rows:TableCell[][]=[];
  for(const row of descendants(xml(files[path]),'row')){
   const cells:TableCell[]=[];
   for(const c of Array.from(row.children).filter(x=>x.localName==='c')){
    const col=columnIndex(c.getAttribute('r')??'A1');if(col<0||col>=64)continue;const type=c.getAttribute('t'),style=+(c.getAttribute('s')??0);const raw=child(c,'v')?.textContent??'';let value:TableCell=raw;
    if(type==='s')value=shared[+raw]??'';
    else if(type==='inlineStr')value=descendants(c,'t').map(t=>t.textContent??'').join('');
    else if(type==='b')value=raw==='1'?'Sim':'Não';
    else if(raw!==''&&type!=='str'&&type!=='e'&&Number.isFinite(Number(raw))){
     const n=Number(raw);
     if(isDate(style)){const d=new Date(Date.UTC(1899,11,30)+Math.round((n+offset)*86400000));value=`${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;}
     else if(isPercent(style))value=String(Math.round(n*10000)/100).replace('.',',')+'%';else value=n;
    }
    if(child(c,'f')&&raw===''){missingFormulas++;value='';}cells[col]=value;
   }
   if(cells.some(x=>x!==''&&x!==undefined)){rows.push(Array.from({length:cells.length},(_,i)=>cells[i]??''));if(rows.length>10001)throw new Error('Importe até 10.000 lançamentos por arquivo.');}
  }
  return{name:sheet.getAttribute('name')??'Aba',rows};
 });return{sheets,missingFormulas};
}
export function parseDelimited(text:string):string[][]{
 if(text.length>10_000_000)throw new Error('Cole uma tabela de até 10 MB.');
 const first=text.split(/\r?\n/)[0]??'';const candidates=['\t',';',','];const delimiter=candidates.sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&c===delimiter){row.push(cell);cell='';}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('Aspas sem fechamento na tabela.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);if(rows.length>10001||rows.some(x=>x.length>64))throw new Error('Limite de 10.000 linhas e 64 colunas.');return rows;
}
const ALIASES:Record<Column,string[]>={description:['descricao','description','conceito','concepto','detalhe','estabelecimento','merchant','movimento'],type:['tipo','spendingtype','segmento'],mode:['modalidade','compra','purchasemode'],amount:['valor','amount','importe','total','debito'],currency:['moeda','currency','divisa'],category:['categoria','category','compartilhamento'],share:['receber','percentualdereembolso','percentualreembolso','reembolso','porcentagem'],date:['data','date','fecha','datadacompra','dataprimeiraparcela'],finalDate:['datapf','datafinal','ultimaparcela','dataultimaparcela'],cardId:['cartao','card','tarjeta','cartaoconta'],accountId:['conta','account','cuenta','contabancaria']};
export type Mapping=Record<Column,number>;
export function detectMapping(headers:string[]):Mapping{return Object.fromEntries(COLS.map(k=>[k,headers.findIndex(h=>ALIASES[k].includes(normalize(h)))])) as Mapping;}
export interface ImportOptions{headers:string[];data:TableCell[][];mapping:Mapping;format:'comma'|'dot';kind:'expense'|'income';defaultCard:string;defaultAccount:string;defaultCurrency:Currency;name:string}
export async function mapImport(p:Profile,o:ImportOptions):Promise<{entries:Entry[];info:ImportInfo}>{
 if(o.mapping.description<0||o.mapping.amount<0)throw new Error('Associe as colunas Descrição e Valor.');if(o.data.length>10000)throw new Error('Limite de 10.000 lançamentos por importação.');
 const encoder=new TextEncoder();const hash=await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify([o.headers,o.data])));const fingerprint=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
 if(p.imports.some(i=>i.fingerprint===fingerprint))throw new Error('Esta tabela já foi importada. Nenhuma linha foi duplicada.');
 const importId=uid();const byHeader=(names:string[],row:TableCell[])=>{const index=o.headers.findIndex(x=>names.includes(normalize(x)));return index<0?'':String(row[index]??'');};
 const entries=o.data.filter(row=>row.some(x=>String(x).trim())).map(raw=>{
  const v=emptyValues();for(const k of COLS){const cell=raw[o.mapping[k]];v[k]=cell===undefined?'':typeof cell==='number'?(k==='date'||k==='finalDate'?String(cell):k==='amount'?(Math.abs(cell*100-Math.round(cell*100))<0.00001?inputMoney(Math.abs(Math.round(cell*100))):String(cell).replace('.',',')):String(cell)):String(cell).trim();}
  v.mode=v.mode||((monthIndex(v.finalDate)??0)>(monthIndex(v.date)??Infinity)?'Parcelada':'Avulsa');v.currency=(v.currency||o.defaultCurrency).toUpperCase();v.category=v.category||'Individual';v.share=v.share|| (normalize(v.category)==='individual'?'0':normalize(v.category)==='casal'?'50':'100');
  const sourceAmount=raw[o.mapping.amount];if(typeof sourceAmount!=='number'){const amount=parseMoney(v.amount,o.format);if(amount!==null)v.amount=inputMoney(Math.abs(amount));}
  const cardReference=v.cardId,accountReference=v.accountId;
  const card=p.cards.find(x=>normalize(x.name+' '+x.lastFour)===normalize(cardReference)||cardReference.includes(x.lastFour)&&normalize(cardReference).includes(normalize(x.name)));
  const account=p.accounts.find(x=>normalize(x.name)===normalize(accountReference));
  v.cardId=card?.id||(cardReference?'unlinked:'+cardReference:o.defaultCard);v.accountId=account?.id||(accountReference?'unlinked:'+accountReference:o.defaultAccount);
  let direction=normalize(byHeader(['tipodelancamento','kind','natureza'],raw));const legacyKind=o.headers.findIndex(h=>normalize(h)==='tipo');if(!direction&&legacyKind>=0&&o.data.every(r=>!String(r[legacyKind]??'').trim()||['despesa','expense','saida','entrada','income','receita','recebimento'].includes(normalize(String(r[legacyKind]??''))))){direction=normalize(String(raw[legacyKind]??''));if(o.mapping.type===legacyKind)v.type='';}const kind=['entrada','income','receita','recebimento'].includes(direction)?'income':['despesa','expense','saida','gasto'].includes(direction)?'expense':o.kind;
  const ignored=['nao','no','false','0','ignorar','excluido'].includes(normalize(byHeader(['incluir','include','ativo'],raw)));
  const entry:Entry={id:uid(),kind,values:v,posted:false,ignored,importId,personId:normalize(v.category)==='casal'?p.people.find(x=>x.active)?.id:p.people.find(x=>normalize(x.name)===normalize(v.category))?.id,raw:raw.map(String)};
  const paid=Number(byHeader(['parcelaspagas'],raw)),count=Number(byHeader(['parcelastotais','qtparcelas','quantidadeparcelas'],raw));const monthly=byHeader(['valormensal'],raw),debt=byHeader(['saldodevedorinformado'],raw),remaining=byHeader(['parcelasrestantesinformadas'],raw);
  if(v.mode==='Parcelada'&&(paid>0||monthly||debt)&&monthIndex(v.date)!==null){const start=monthIndex(v.date)!,end=monthIndex(v.finalDate),n=count|| (end!==null?end-start+1:0);if(n>1){entry.legacy={start,final:end,count:n,paid:paid||0,remaining:remaining?Number(remaining):n-paid,monthly:parseMoney(monthly)??Math.round((parseMoney(v.amount)??0)/n),debt:parseMoney(debt)??Math.max(0,(parseMoney(v.amount)??0)-paid*(parseMoney(monthly)??Math.round((parseMoney(v.amount)??0)/n))),reference:start};}}
  const history=byHeader(['historicoparcelas'],raw);if(history){let saved:LegacyPlan;try{saved=JSON.parse(history);}catch{throw new Error('Histórico de parcelas inválido.');}if(!validLegacy(saved))throw new Error('Histórico de parcelas inválido.');entry.legacy=saved;}
  return entry;
 });return{entries,info:{id:importId,name:o.name,fingerprint,headers:o.headers}};
}
function escapeXml(s:string){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');}
export function exportExcel(p:Profile):Uint8Array{
 const header=[...HEADERS,'Tipo de lançamento','Incluir','Histórico parcelas'];const rows=[header,...p.entries.map(e=>[...COLS.map(k=>k==='cardId'?(p.cards.find(c=>c.id===e.values[k])?p.cards.find(c=>c.id===e.values[k])!.name+' • '+p.cards.find(c=>c.id===e.values[k])!.lastFour:e.values[k].replace('unlinked:','')):k==='accountId'?p.accounts.find(a=>a.id===e.values[k])?.name??e.values[k]:e.values[k]),e.kind==='income'?'Entrada':'Despesa',e.ignored?'Não':'Sim',e.legacy?JSON.stringify(e.legacy):''])];
 const cells=rows.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((value,c)=>{const ref=String.fromCharCode(65+c)+(r+1);return '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+escapeXml(String(value??''))+'</t></is></c>';}).join('')+'</row>').join('');
 const files:Record<string,Uint8Array>={};const add=(path:string,text:string)=>files[path]=strToU8(text);
 add('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
 add('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 add('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Despesas" sheetId="1" r:id="rId1"/></sheets></workbook>');
 add('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
 add('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="36" customWidth="1"/><col min="2" max="11" width="20" customWidth="1"/><col min="12" max="14" hidden="1" width="18" customWidth="1"/></cols><sheetData>'+cells+'</sheetData><autoFilter ref="A1:K'+rows.length+'"/></worksheet>');return zipSync(files);
}
