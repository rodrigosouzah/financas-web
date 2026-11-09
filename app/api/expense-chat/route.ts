import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {workspaces} from '../../../db/schema';
import {eq} from 'drizzle-orm';
import {validateWorkspace,dateParts} from '../../../lib/finance';
import {chatMessages} from '../../../lib/expense-chat';
import {assistantInstructions,assistantSchema,prepareAssistant} from '../../../lib/assistant';
import {answerFAQ} from '../../../lib/assistant-faq';
import {confirmationOrigin} from '../../../lib/email-confirmation';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Entre na sua conta.'},{status:401,headers});
 if(request.headers.get('Origin')!==confirmationOrigin(request.url)||request.headers.get('X-Financas-Owner')!==user.userId)return Response.json({error:'A conta conectada mudou. Entre novamente.'},{status:403,headers});
 if(!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'Formato inválido.'},{status:415,headers});
 const config=env as unknown as Record<string,string|undefined>;
 if(!env.DB||!config.OPENAI_API_KEY)return Response.json({error:'O assistente ainda não foi ativado.'},{status:503,headers});
 try{
  const text=await request.text();if(text.length>14000)throw new Error('Conversa muito longa.');const body=JSON.parse(text),messages=chatMessages(body.messages);
  if(typeof body.profileId!=='string'||!dateParts(body.today))throw new Error('Perfil ou data inválida.');
  const [row]=await getDb().select().from(workspaces).where(eq(workspaces.userId,user.userId)).limit(1);
  const profile=row?validateWorkspace(JSON.parse(row.payload)).profiles.find(p=>p.id===body.profileId):null;
  if(!profile)return Response.json({error:'Salve o perfil na nuvem antes de usar o assistente.'},{status:409,headers});
  const help=answerFAQ(messages[messages.length-1].content);if(help)return Response.json({reply:help.answer,draft:null,source:'faq'},{headers});
  const day=new Date().toISOString().slice(0,10);
  // Atomic bounded counters contain no conversation text or financial data.
  for(const [key,limit] of [[user.userId,20],['*global*',200]] as const){
   const count=await env.DB!.prepare('INSERT INTO finance_ai_usage (scope, day, count) VALUES (?, ?, 1) ON CONFLICT(scope, day) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count').bind(key,day,limit).first();
   if(!count)return Response.json({error:'Limite diário do assistente atingido. Tente amanhã.'},{status:429,headers});
  }
  const instructions=assistantInstructions(profile,body.today);
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+config.OPENAI_API_KEY},body:JSON.stringify({model:'gpt-6-luna',store:false,instructions,input:messages,text:{format:{type:'json_schema',name:'vr_assistant_review',strict:true,schema:assistantSchema}},max_output_tokens:1800}),signal:AbortSignal.timeout(45000)});
  if(!response.ok)return Response.json({error:response.status===429?'O serviço está sem cota ou temporariamente limitado. Tente mais tarde.':'O assistente está indisponível. Seus lançamentos não foram alterados.'},{status:503,headers});
  const result=await response.json() as {status?:string;output?:{type:string;content?:{type:string;text?:string}[]}[]};
  if(result.status!=='completed')throw new Error('Não foi possível concluir a resposta. Tente novamente.');
  const output=result.output?.flatMap(x=>x.content??[]).filter(x=>x.type==='output_text').map(x=>x.text??'').join('');if(!output)throw new Error('Não foi possível preparar o cadastro.');
  const parsed=JSON.parse(output),draft=prepareAssistant(profile,parsed.action,parsed.data);
  return Response.json({reply:typeof parsed.reply==='string'?parsed.reply.slice(0,1600):'Confira os dados abaixo.',draft,source:'ai'},{headers});
 }catch{return Response.json({error:'Não foi possível preparar o cadastro. Confira a conexão e tente novamente. Nenhum lançamento foi salvo.'},{status:400,headers});}
}
