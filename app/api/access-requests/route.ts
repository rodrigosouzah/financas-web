import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {isAccessOwner} from '../../account-access';
import {initializeAdmin,adminChange} from '../../../lib/admin';
import {confirmationOrigin} from '../../../lib/email-confirmation';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user||!await isAccessOwner(user))return Response.json({error:'Acesso restrito ao proprietário.'},{status:403,headers});await initializeAdmin(env.DB!);
 const params=new URL(request.url).searchParams,offset=Math.max(0,Math.min(100000,Number(params.get('offset'))||0)),search=(params.get('search')??'').slice(0,100).replace(/[\\%_]/g,'\\$&'),status=params.get('status')??'all';if(!['all','pending','approved','rejected','blocked'].includes(status))return Response.json({error:'Filtro inválido.'},{status:400,headers});
 const rows=await env.DB!.prepare("SELECT a.user_id AS userId,a.email,a.name,a.status,a.requested_at AS requestedAt,a.reviewed_at AS reviewedAt,COALESCE(r.role,'user') AS role FROM finance_access a LEFT JOIN finance_roles r ON a.user_id=r.user_id WHERE a.user_id<>? AND (?='all' OR a.status=?) AND (a.email LIKE ? ESCAPE '\\' OR a.name LIKE ? ESCAPE '\\') ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END,a.requested_at DESC,a.user_id LIMIT 51 OFFSET ?").bind(user.userId,status,status,'%'+search+'%','%'+search+'%',Math.floor(offset)).all();
 const counts=await env.DB!.prepare('SELECT status,COUNT(*) AS count FROM finance_access WHERE user_id<>? GROUP BY status').bind(user.userId).all();
 const audit=await env.DB!.prepare('SELECT h.id,h.action,h.previous_value AS previousValue,h.next_value AS nextValue,h.created_at AS createdAt,a.email,a.name FROM finance_admin_audit h LEFT JOIN finance_access a ON a.user_id=h.target_id ORDER BY h.id DESC LIMIT 50').all();
 return Response.json({requests:rows.results.slice(0,50),hasMore:rows.results.length>50,counts:counts.results,history:audit.results},{headers});
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user||request.headers.get('Origin')!==confirmationOrigin(request.url)||request.headers.get('X-Financas-Owner')!==user.userId||!await isAccessOwner(user))return Response.json({error:'Acesso restrito ao proprietário.'},{status:403,headers});
 if(!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'Formato inválido.'},{status:415,headers});
 try{const raw=await request.text();if(raw.length>1500)throw Error('Solicitação inválida.');await adminChange(env.DB!,user.userId,JSON.parse(raw));return Response.json({success:true},{headers});}catch(e){return Response.json({error:e instanceof Error?e.message:'Falha ao revisar.'},{status:400,headers});}
}
