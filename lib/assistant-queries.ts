import {type Profile,charges,sumCurrency,money,normalize,CURRENCIES,type Currency} from './finance.ts';
/** Narrow read-only queries; commands are never interpreted as totals. */
export function financialAnswer(p:Profile,message:string):{text:string;brazil?:number}|null{
 const n=normalize(message);if(!/(quanto|total|howmuch)/.test(n)||/(apague|exclua|delete|erase|altere|mude|change|update|cadastre|registre)/.test(n))return null;
 const due=charges(p),expenses=due.filter(c=>c.entry.kind==='expense');const format=(rows:typeof due)=>{const totals=sumCurrency(rows);return CURRENCIES.filter(c=>totals[c]).map(c=>money(totals[c]??0,c)).join(' · ')||'0,00';};
 const title=`Mês selecionado: ${p.month}. `;
 if(/(brasil|brazil)/.test(n)){const amount=expenses.filter(c=>c.currency==='BRL').reduce((s,c)=>s+c.amount,0);return{text:title+'Total bruto das contas em reais: '+money(amount,'BRL')+'. Entradas e reembolsos não foram abatidos deste total. A remessa final depende de câmbio e tarifas.',brazil:amount};}
 const lastFour=p.cards.filter(c=>n.includes(c.lastFour));const cards=lastFour.length?lastFour:p.cards.filter(c=>n.includes(normalize(c.name)));if(/(cartao|card|bbva|nubank|cetelem)/.test(n)&&cards.length){if(cards.length>1)return{text:'Encontrei mais de um cartão: '+cards.map(c=>c.name+' • '+c.lastFour).join(', ')+'. Informe os últimos 4 dígitos.'};const c=cards[0];return{text:title+c.name+' • '+c.lastFour+' — a pagar: '+format(expenses.filter(x=>x.entry.values.cardId===c.id))+'.'};}
 const types=[...new Set([...p.types,...expenses.map(c=>c.entry.values.type).filter(Boolean)])];let matches=types.filter(t=>n.includes(normalize(t)));if(!matches.length&&/(grocer|market|supermercado)/.test(n))matches=types.filter(t=>normalize(t)==='mercado');
 if(matches.length)return{text:title+matches.map(t=>t+': '+format(expenses.filter(c=>normalize(c.entry.values.type)===normalize(t)))).join('\n')+'. Valores por Tipo; inclui somente lançamentos salvos previstos para o mês.'};
 if(/(entrada|income|salario)/.test(n))return{text:title+'Entradas: '+format(due.filter(c=>c.entry.kind==='income'))+'.'};
 if(/(reembolso|refund)/.test(n))return{text:title+'Reembolsos previstos: '+format(expenses.map(c=>({...c,amount:Math.round(c.amount*c.share/10000)})))+'.'};
 if(/(gastei|gastos|despesas|spent|expenses)/.test(n)&&!/(tipo|mercado|market|restaurante|cartao|card)/.test(n))return{text:title+'Despesas: '+format(expenses)+'.'};
 return null;
}

export function isPastedTable(text:string){return text.includes('\n')&&(/[\t;]/.test(text)||text.split('\n').every(line=>!line.trim()||line.includes(',')));}
