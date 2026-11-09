export interface AccessIdentity {userId:string;email:string;displayName:string;authProvider?:string}
export interface AccessDB {prepare(sql:string):{run():Promise<unknown>;bind(...args:unknown[]):{run():Promise<unknown>;first<T>():Promise<T|null>;all<T>():Promise<{results:T[]}>}}}
export type AccessStatus='pending'|'approved'|'rejected'|'blocked';
export async function initializeAccess(db:AccessDB){await db.prepare('CREATE TABLE IF NOT EXISTS finance_access (user_id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL, requested_at TEXT NOT NULL, reviewed_at TEXT, reviewed_by TEXT)').run();}
export async function accessStatus(db:AccessDB,user:AccessIdentity,isOwner:boolean):Promise<AccessStatus>{
 await initializeAccess(db);
 const existing=await db.prepare('SELECT status FROM finance_access WHERE user_id=?').bind(user.userId).first<{status:AccessStatus}>();
 if(existing&&!isOwner)return existing.status;
 // Existing cloud workspaces keep access; new identities always start pending.
 const workspace=await db.prepare('SELECT user_id FROM finance_workspaces WHERE user_id=?').bind(user.userId).first<{user_id:string}>();
 const status=isOwner||workspace?'approved':'pending';
 await db.prepare('INSERT INTO finance_access (user_id,email,name,status,requested_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,user.email,user.displayName,status,new Date().toISOString()).run();
 if(isOwner&&existing?.status!=='approved')await db.prepare("UPDATE finance_access SET status='approved' WHERE user_id=?").bind(user.userId).run();
 return status;
}
export async function reviewAccess(db:AccessDB,reviewerId:string,targetId:unknown,status:unknown){
 if(typeof targetId!=='string'||!targetId||targetId===reviewerId||!['approved','rejected'].includes(status as string))throw Error('Solicitação inválida.');
 await initializeAccess(db);
 return !!await db.prepare("UPDATE finance_access SET status=?,reviewed_at=?,reviewed_by=? WHERE user_id=? AND status IN ('pending','rejected') RETURNING user_id").bind(status,new Date().toISOString(),reviewerId,targetId).first();
}
