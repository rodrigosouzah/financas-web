/** Device secrets are generated on the Mac. Only SHA-256 digests reach storage. */
export const NATIVE_COOKIE='financas_native';
export const DEVICE_LIFETIME=90*24*60*60*1000;
export function parseDeviceToken(value:string|null){
 const m=value?.length===129?/^([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(value):null;
 return m?{id:m[1],secret:m[2]}:null;
}
export async function deviceDigest(secret:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret))),n=>n.toString(16).padStart(2,'0')).join('');}
export function validApproval(x:unknown):x is {id:string;tokenHash:string;createdAt:number}{
 if(!x||typeof x!=='object')return false;
 const a=x as {id:string;tokenHash:string;createdAt:number};
 return typeof a.id==='string'&&a.id.length===64&&typeof a.tokenHash==='string'&&a.tokenHash.length===64&&/^[a-f0-9]{64}$/.test(a.id)&&/^[a-f0-9]{64}$/.test(a.tokenHash)&&Number.isSafeInteger(a.createdAt)&&a.createdAt<=Date.now()+60_000&&a.createdAt>Date.now()-10*60_000;
}
