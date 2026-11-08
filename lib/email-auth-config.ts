export interface EmailAuthConfig {url:string;key:string}
/** Only publishable credentials are accepted; service-role keys never reach UI. */
export function emailAuthConfig(values:Record<string,string|undefined>):EmailAuthConfig|null{
 if(values.EMAIL_AUTH_ENABLED!=='true')return null;
 const url=values.SUPABASE_URL??'',key=values.SUPABASE_PUBLISHABLE_KEY??'';
 try{const parsed=new URL(url);if(parsed.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/.test(parsed.hostname)||parsed.username||parsed.password||parsed.search||parsed.hash||!['','/'].includes(parsed.pathname))return null;}catch{return null;}
 if(!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key))return null;
 return{url:new URL(url).origin,key};
}
export function safeAuthNext(value:string|null|undefined){
 if(!value?.startsWith('/')||value.startsWith('//')||value.includes('\\'))return'/';
 try{const url=new URL(value,'https://app.invalid');if(url.origin!=='https://app.invalid'||!['/','/connect-mac','/auth/reset'].includes(url.pathname))return'/';return url.pathname+url.search;}catch{return'/';}
}
export function emailOwnerId(id:string){if(id.length!==36||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new Error('Identidade inválida.');return'email:'+id.toLowerCase();}
