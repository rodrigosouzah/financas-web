import {NextResponse} from 'next/server';
import {emailServerClient} from '../../email-auth';
import {safeAuthNext} from '../../../lib/email-auth-config';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const url=new URL(request.url),token=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
 const next=type==='recovery'?'/auth/reset':safeAuthNext(url.searchParams.get('next'));
 const client=await emailServerClient(true);
 let valid=false;
 if(client&&token&&/^[a-f0-9]{32,256}$/i.test(token)&&['email','recovery'].includes(type??'')){
  const {error}=await client.auth.verifyOtp({token_hash:token,type:type as 'email'|'recovery'});valid=!error;
 }
 const response=NextResponse.redirect(new URL(valid?next:'/auth?error=link-expired',url.origin));
 response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
}
