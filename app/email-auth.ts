import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {emailAuthConfig,emailOwnerId} from '../lib/email-auth-config';
export function configuredEmailAuth(){return emailAuthConfig(env as unknown as Record<string,string|undefined>);}
export async function emailServerClient(writable=false){
 const config=configuredEmailAuth();if(!config)return null;const jar=await cookies();
 return createServerClient(config.url,config.key,{cookies:{getAll:()=>jar.getAll(),setAll:items=>{if(writable)for(const {name,value,options} of items)jar.set(name,value,{...options,secure:true,sameSite:'lax',path:'/'});}},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store'})}});
}
export async function emailIdentity(writable=false){
 const config=configuredEmailAuth();if(!config)return{attempted:false,user:null};
 const jar=await cookies();const attempted=jar.getAll().some(c=>/^sb-.*-auth-token(?:\.\d+)?$/.test(c.name));
 if(!attempted)return{attempted:false,user:null};
 const client=await emailServerClient(writable);const {data,error}=await client!.auth.getUser();
 if(error||!data.user?.email_confirmed_at||!data.user.email)return{attempted:true,user:null};
 const fullName=typeof data.user.user_metadata?.full_name==='string'?data.user.user_metadata.full_name.slice(0,80):null;
 return{attempted:true,user:{userId:emailOwnerId(data.user.id),email:data.user.email,displayName:fullName||data.user.email,fullName,authProvider:'email' as const}};
}
