import {getChatGPTUser} from '../../chatgpt-auth';
import {nativeIdentity} from '../../native-auth';
import {headers as requestHeaders} from 'next/headers';
import {getDb} from '../../../db';
import {nativeDevices} from '../../../db/schema';
import {and,eq} from 'drizzle-orm';
import {DEVICE_LIFETIME,deviceDigest,parseDeviceToken,validApproval} from '../../../lib/native-device';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const bearer=(r:Request)=>r.headers.get('Authorization')?.replace(/^Bearer /,'')??null;
export async function GET(request:Request){
 const user=await nativeIdentity(bearer(request));
 return user?Response.json({userId:user.userId,name:user.displayName},{headers}):Response.json({error:'Autorize este Mac no navegador.'},{status:401,headers});
}
export async function POST(request:Request){
 // Approval requires the real browser sign-in, never an existing device cookie.
 const trusted=await requestHeaders();
 if(!trusted.get('oai-authenticated-user-id')||!trusted.get('oai-authenticated-user-email'))return Response.json({error:'Entre com ChatGPT no navegador.'},{status:401,headers});
 if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'Origem inválida.'},{status:403,headers});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Entre novamente.'},{status:401,headers});
 try{
  const raw=await request.text();if(raw.length>1000)throw new Error('Solicitação inválida.');
  const body:unknown=JSON.parse(raw);if(!validApproval(body))throw new Error('Conexão expirada. Gere outra solicitação no Mac.');
  const inserted=await getDb().insert(nativeDevices).values({id:body.id,tokenHash:body.tokenHash,userId:user.userId,displayName:user.displayName,createdAt:Date.now(),expiresAt:Date.now()+DEVICE_LIFETIME}).onConflictDoNothing().returning({id:nativeDevices.id});
  if(!inserted.length)return Response.json({error:'Solicitação já utilizada. Gere outra no Mac.'},{status:409,headers});
  return Response.json({connected:true},{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Solicitação inválida.'},{status:400,headers});}
}
export async function DELETE(request:Request){
 const token=bearer(request),parsed=parseDeviceToken(token);
 if(!parsed)return Response.json({error:'Credencial inválida.'},{status:401,headers});
 await getDb().delete(nativeDevices).where(and(eq(nativeDevices.id,parsed.id),eq(nativeDevices.tokenHash,await deviceDigest(parsed.secret))));
 return Response.json({disconnected:true},{headers});
}
