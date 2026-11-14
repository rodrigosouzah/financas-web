import type {MascotAction} from './mascot-motion.ts';
export interface MascotReaction{serial:number;action:MascotAction;phrase?:string}
/** Local reactions never write a ledger or send data to AI. */
export function pageReaction(page:string,shared:boolean,character:'rodrigo'|'victoria'):{action:MascotAction;phrase:string}{
 const diva=character==='victoria';
 if(shared)return{action:'look',phrase:diva?'Oxe, Diva! Bora conferir quem ficou de mandar o Pix?':'Qual foi, chefe! Bora conferir esses reembolsos?'};
 if(page==='expenses')return{action:'no',phrase:diva?'A Diva de olho nas comprinhas… bora conferir antes de gastar!':'E aí, chefe! Vai gastar mais? Bora conferir essa lista primeiro!'};
 if(page==='income')return{action:'celebrate',phrase:diva?'Aí sim, Diva! Dinheiro entrando… guarda uma parte, viu?':'Boa, chefe! Dinheiro entrando. Bora dar um destino pra essa grana!'};
 if(page==='savings')return{action:'pockets',phrase:diva?'Massa, Diva! Um pouquinho hoje, tua meta mais perto amanhã.':'Aí sim, chefe! Bora guardar um pouco pro teu plano sair do papel.'};
 if(page==='cards')return{action:'look',phrase:diva?'Diva, limite não é salário, viu? Bora olhar essas faturas.':'Chefe, limite não é salário! Bora conferir essas faturas.'};
 if(page==='accounts')return{action:'pockets',phrase:diva?'Oxe, bora ver o que vai sair dessa conta, Diva.':'Papo reto, chefe: bora conferir o que vai sair da conta.'};
 return{action:'wave',phrase:diva?'E aí, Diva! Tô por aqui. Bora organizar essa graninha?':'E aí, chefe! Tô na área. Bora organizar essa grana?'};
}
