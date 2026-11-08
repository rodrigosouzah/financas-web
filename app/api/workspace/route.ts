import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { workspaces } from '../../../db/schema';
import { and,eq } from 'drizzle-orm';
import { validateWorkspace } from '../../../lib/finance';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'Entre na sua conta para acessar os dados.'},{status:401,headers});const [row]=await getDb().select().from(workspaces).where(eq(workspaces.userId,user.userId)).limit(1);return Response.json({revision:row?.revision??0,state:row?JSON.parse(row.payload):null},{headers});}
export async function PUT(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Entre na sua conta para salvar.'},{status:401,headers});
 if(request.headers.get('X-Financas-Owner')!==user.userId)return Response.json({error:'A conta conectada mudou. Exporte seu backup local e entre novamente antes de sincronizar.'},{status:403,headers});
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return Response.json({error:'Origem inválida.'},{status:403,headers});
 if(!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'Formato inválido.'},{status:415,headers});
 try{const raw=await request.text();if(raw.length>8*1024*1024)return Response.json({error:'Os dados excedem 8 MB. Exporte um backup antes de continuar.'},{status:413,headers});const body=JSON.parse(raw);if(!Number.isSafeInteger(body.revision)||body.revision<0)throw new Error('Revisão inválida.');const state=validateWorkspace(body.state),db=getDb(),updatedAt=new Date().toISOString(),next=body.revision+1;
  let changed;
  if(body.revision===0)changed=await db.insert(workspaces).values({userId:user.userId,revision:1,payload:JSON.stringify(state),updatedAt}).onConflictDoNothing().returning({revision:workspaces.revision});
  else changed=await db.update(workspaces).set({revision:next,payload:JSON.stringify(state),updatedAt}).where(and(eq(workspaces.userId,user.userId),eq(workspaces.revision,body.revision))).returning({revision:workspaces.revision});
  if(!changed.length)return Response.json({error:'Há alterações mais recentes em outro dispositivo. Exporte o backup local e carregue a versão da nuvem para evitar sobrescrita.'},{status:409,headers});
  return Response.json({revision:next,updatedAt},{headers});
 }catch(error){return Response.json({error:error instanceof Error?error.message:'Não foi possível salvar os dados.'},{status:400,headers});}
}
