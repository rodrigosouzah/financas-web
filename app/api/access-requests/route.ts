import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {isAccessOwner} from '../../account-access';
import {initializeAccess,reviewAccess} from '../../../lib/account-access';
import {confirmationOrigin} from '../../../lib/email-confirmation';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){const user=await getChatGPTUser();if(!user||!await isAccessOwner(user))return Response.json({error:'Acesso restrito ao administrador.'},{status:403,headers});await initializeAccess(env.DB!);const rows=await env.DB!.prepare("SELECT user_id AS userId,email,name,status,requested_at AS requestedAt,reviewed_at AS reviewedAt FROM finance_access WHERE user_id<>? ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END,requested_at DESC LIMIT 200").bind(user.userId).all();return Response.json({requests:rows.results},{headers});}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user||request.headers.get('Origin')!==confirmationOrigin(request.url)||request.headers.get('X-Financas-Owner')!==user.userId||!await isAccessOwner(user))return Response.json({error:'Acesso restrito ao administrador.'},{status:403,headers});
 if(!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'Formato inválido.'},{status:415,headers});
 try{const raw=await request.text();if(raw.length>1000)throw Error('Solicitação inválida.');const body=JSON.parse(raw);const changed=await reviewAccess(env.DB!,user.userId,body.userId,body.status);if(!changed)return Response.json({error:'Solicitação já revisada. Atualize a lista.'},{status:409,headers});return Response.json({success:true},{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Falha ao revisar.'},{status:400,headers});}
}
