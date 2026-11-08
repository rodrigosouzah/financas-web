import {NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {configuredEmailAuth} from '../../email-auth';
import {confirmationInput,confirmationError} from '../../../lib/email-confirmation';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
// GET must never consume a one-time token: email scanners routinely follow links.
export async function GET(request:Request){
 const input=confirmationInput(new URL(request.url).searchParams);
 if(!input)return NextResponse.redirect(new URL('/auth?error=link-invalid',request.url),{headers});
 const recovery=input.type==='recovery';
 return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmar acesso — VR Finanças</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f5f5f7;color:#424245;font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}main{background:white;border-radius:13px;padding:32px;width:min(80vw,366px)}header{display:flex;align-items:center;gap:10px;font-size:23px;font-weight:650}img{width:36px;height:36px}h1{font-size:19.2px;margin-top:26px}p{color:#86868b;line-height:1.6}button{width:100%;padding:13px;border:0;border-radius:7px;background:#0071e3;color:white;font:inherit;cursor:pointer}a{display:block;text-align:center;color:#0071e3;margin-top:20px;text-decoration:none}</style><main><header><img src="/vr-mark.svg" alt="VR">Finanças</header><h1>${recovery?'Redefinir sua senha':'Confirmar seu e-mail'}</h1><p>Clique em Continuar para ${recovery?'escolher uma nova senha':'confirmar seu e-mail e acessar sua conta'}.</p><form method="post" action="/auth/confirm"><input type="hidden" name="token_hash" value="${input.token}"><input type="hidden" name="type" value="${input.type}"><button type="submit">Continuar</button></form><a href="/auth">Voltar para Entrar</a></main></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
export async function POST(request:Request){
 const url=new URL(request.url);
 if(request.headers.get('origin')!==url.origin)return new Response('Origem inválida',{status:403,headers});
 const form=await request.formData();const input=confirmationInput(form);
 const config=configuredEmailAuth();
 if(!input||!config)return NextResponse.redirect(new URL('/auth?error=link-invalid',url.origin),{status:303,headers});
 const jar=await cookies();
 const response=NextResponse.redirect(new URL(input.type==='recovery'?'/auth/reset':'/',url.origin),{status:303,headers});
 // Attach the session directly to the redirect, rather than relying on framework cookie propagation.
 const client=createServerClient(config.url,config.key,{cookies:{getAll:()=>jar.getAll(),setAll:items=>{for(const {name,value,options} of items)response.cookies.set(name,value,{...options,secure:true,sameSite:'lax',path:'/'});}},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store'})}});
 try{
  const {error}=await client.auth.verifyOtp({token_hash:input.token,type:input.type});
  if(error)return NextResponse.redirect(new URL('/auth?error='+confirmationError(error.code),url.origin),{status:303,headers});
  return response;
 }catch{return NextResponse.redirect(new URL('/auth?error=verification-unavailable',url.origin),{status:303,headers});}
}
