import {initializeAccess} from './account-access.ts';
export const ADMIN_ACTIONS=['access','role'] as const;
export interface AdminChange{userId:string;action:'access'|'role';value:string;expectedStatus:string;expectedRole:string}
export async function initializeAdmin(db:Pick<D1Database,'prepare'>){
 await initializeAccess(db);
 await db.prepare('CREATE TABLE IF NOT EXISTS finance_roles (user_id TEXT PRIMARY KEY, role TEXT NOT NULL, bootstrap_key TEXT UNIQUE)').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS finance_admin_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL, target_id TEXT NOT NULL, action TEXT NOT NULL, previous_value TEXT NOT NULL, next_value TEXT NOT NULL, created_at TEXT NOT NULL)').run();
}
/** Explicit owner-only, optimistic mutation; the transaction never touches financial data. */
export async function adminChange(db:Pick<D1Database,'prepare'|'batch'>,actor:string,input:unknown){
 await initializeAdmin(db);
 const owner=await db.prepare("SELECT user_id FROM finance_roles WHERE user_id=? AND role='superuser' AND bootstrap_key='initial-owner'").bind(actor).first();if(!owner)throw Error('Somente o proprietário pode administrar usuários.');
 const v=input as AdminChange;
 if(!v||typeof v.userId!=='string'||v.userId===actor||!ADMIN_ACTIONS.includes(v.action)||!['pending','approved','rejected','blocked'].includes(v.expectedStatus)||!['user','superuser'].includes(v.expectedRole))throw Error('Solicitação inválida.');
 if(v.action==='access'&&!['approved','rejected','blocked'].includes(v.value)||v.action==='role'&&!['user','superuser'].includes(v.value))throw Error('Permissão inválida.');
 const target=await db.prepare("SELECT a.status,COALESCE(r.role,'user') AS role,r.bootstrap_key FROM finance_access a LEFT JOIN finance_roles r ON a.user_id=r.user_id WHERE a.user_id=?").bind(v.userId).first<{status:string;role:string;bootstrap_key:string|null}>();
 if(!target||target.bootstrap_key)throw Error('Conta não encontrada ou protegida.');
 if(target.status!==v.expectedStatus||target.role!==v.expectedRole)throw Error('A conta mudou. Atualize a lista antes de confirmar.');
 const previous=v.action==='access'?target.status:target.role;if(previous===v.value)throw Error('Esta configuração já está ativa.');
 if(v.action==='role'&&v.value==='superuser'&&target.status!=='approved')throw Error('Aprove o acesso antes de conceder Superusuário.');
 if(v.action==='access'&&v.value==='blocked'&&target.status!=='approved'||v.action==='access'&&v.value==='rejected'&&target.status!=='pending')throw Error('Transição de acesso inválida.');
 const stamp=new Date().toISOString();
 const mutation=v.action==='access'?db.prepare("UPDATE finance_access SET status=?,reviewed_at=?,reviewed_by=? WHERE user_id=? AND status=? AND COALESCE((SELECT role FROM finance_roles WHERE user_id=?),'user')=? AND NOT EXISTS (SELECT 1 FROM finance_roles WHERE user_id=? AND bootstrap_key IS NOT NULL) RETURNING user_id").bind(v.value,stamp,actor,v.userId,v.expectedStatus,v.userId,v.expectedRole,v.userId):db.prepare("INSERT INTO finance_roles (user_id,role,bootstrap_key) SELECT a.user_id,?,NULL FROM finance_access a LEFT JOIN finance_roles r ON r.user_id=a.user_id WHERE a.user_id=? AND a.status=? AND COALESCE(r.role,'user')=? AND r.bootstrap_key IS NULL ON CONFLICT(user_id) DO UPDATE SET role=excluded.role WHERE finance_roles.bootstrap_key IS NULL RETURNING user_id").bind(v.value,v.userId,v.expectedStatus,v.expectedRole);
 const audit=db.prepare('INSERT INTO finance_admin_audit (actor_id,target_id,action,previous_value,next_value,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0').bind(actor,v.userId,v.action,previous,v.value,stamp);
 const [result]=await db.batch([mutation,audit]);if(!result.results?.length)throw Error('A conta mudou. Nenhuma alteração foi aplicada. Atualize a lista.');return true;
}
