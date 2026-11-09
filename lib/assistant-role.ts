export interface RoleIdentity{userId:string;email:string;authProvider?:string}
interface RoleDatabase{prepare(sql:string):{run():Promise<unknown>;bind(...args:unknown[]):{run():Promise<unknown>;first<T>():Promise<T|null>}}}
export async function resolveSuperuser(db:RoleDatabase,user:RoleIdentity){
 await db.prepare('CREATE TABLE IF NOT EXISTS finance_roles (user_id TEXT PRIMARY KEY, role TEXT NOT NULL, bootstrap_key TEXT UNIQUE)').run();
 if(user.authProvider==='email'&&user.email.trim().toLowerCase()==='rodrigosouzah@hotmail.com')await db.prepare("INSERT INTO finance_roles (user_id, role, bootstrap_key) VALUES (?, 'superuser', 'initial-owner') ON CONFLICT DO NOTHING").bind(user.userId).run();
 const row=await db.prepare('SELECT role FROM finance_roles WHERE user_id = ?').bind(user.userId).first<{role:string}>();return row?.role==='superuser';
}
