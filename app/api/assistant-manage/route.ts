import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {isSuperuser} from '../../superuser';
import {confirmationOrigin} from '../../../lib/email-confirmation';
import {validateWorkspace} from '../../../lib/finance';
import {prepareManagement,applyManagement,managementTotals} from '../../../lib/assistant-management';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Entre na sua conta.'},{status:401,headers});
 if(request.headers.get('Origin')!==confirmationOrigin(request.url)||request.headers.get('X-Financas-Owner')!==user.userId||!await isSuperuser(user))return Response.json({error:'Permissão de superusuário necessária.'},{status:403,headers});
 if(!request.headers.get('Content-Type')?.includes('application/json'))return Response.json({error:'Formato inválido.'},{status:415,headers});
 try{
  const raw=await request.text();if(raw.length>200000)throw Error('Proposta muito grande.');const body=JSON.parse(raw);
  const row=await env.DB!.prepare('SELECT revision,payload FROM finance_workspaces WHERE user_id=?').bind(user.userId).first<{revision:number;payload:string}>();
  if(!row||row.revision!==body.revision)return Response.json({error:'Há alterações mais recentes. Sincronize e revise uma nova proposta.'},{status:409,headers});
  const state=validateWorkspace(JSON.parse(row.payload)),profile=state.profiles.find(p=>p.id===body.profileId);if(!profile)throw Error('Perfil não encontrado.');
  const draft=prepareManagement(profile,body.draft);if(draft.before!==body.draft.before)throw Error('O registro mudou. Revise uma nova proposta.');
  if(draft.operation==='backup')return Response.json({backup:state,userId:user.userId},{headers});
  if(draft.operation==='totals')return Response.json({totals:managementTotals(profile)},{headers});
  if(body.confirm!==true||draft.operation==='clear'&&body.confirmation!=='APAGAR')throw Error('Confirme explicitamente a alteração.');
  const next=applyManagement(profile,draft);state.profiles=state.profiles.map(p=>p.id===next.id?next:p);validateWorkspace(state);
  const changed=await env.DB!.prepare('UPDATE finance_workspaces SET payload=?, revision=revision+1, updated_at=? WHERE user_id=? AND revision=? RETURNING revision').bind(JSON.stringify(state),new Date().toISOString(),user.userId,row.revision).first<{revision:number}>();
  if(!changed)return Response.json({error:'O espaço mudou. Nenhuma alteração desta proposta foi aplicada.'},{status:409,headers});
  return Response.json({state,revision:changed.revision,userId:user.userId},{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Não foi possível aplicar.'},{status:400,headers});}
}
