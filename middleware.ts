import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {configuredEmailAuth} from './app/email-auth';
export async function middleware(request:NextRequest){
 let response=NextResponse.next({request});const config=configuredEmailAuth();
 if(request.nextUrl.pathname.startsWith('/auth')){response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');}
 if(!config||!request.cookies.getAll().some(c=>/^sb-.*-auth-token(?:\.\d+)?$/.test(c.name)))return response;
 const client=createServerClient(config.url,config.key,{cookies:{getAll:()=>request.cookies.getAll(),setAll:items=>{for(const {name,value} of items)request.cookies.set(name,value);response=NextResponse.next({request});for(const {name,value,options} of items)response.cookies.set(name,value,{...options,secure:true,sameSite:'lax',path:'/'});}},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store'})}});
 await client.auth.getUser();
 response.headers.set('Cache-Control','private, no-store');if(request.nextUrl.pathname.startsWith('/auth'))response.headers.set('Referrer-Policy','no-referrer');return response;
}
export const config={matcher:['/','/api/:path*','/connect-mac','/auth/:path*']};
