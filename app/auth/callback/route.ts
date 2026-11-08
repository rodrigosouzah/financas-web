import {NextResponse} from 'next/server';
import {emailServerClient} from '../../email-auth';
import {safeAuthNext} from '../../../lib/email-auth-config';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const url=new URL(request.url),code=url.searchParams.get('code'),next=safeAuthNext(url.searchParams.get('next'));
 const client=await emailServerClient(true);
 if(code&&code.length<4096&&client){const {error}=await client.auth.exchangeCodeForSession(code);if(!error){const response=NextResponse.redirect(new URL(next,url.origin));response.headers.set('Cache-Control','private, no-store');return response;}}
 return NextResponse.redirect(new URL('/auth?error=link-expired',url.origin));
}
