'use client';
import {useEffect,useMemo,useState,type FormEvent} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {ArrowLeft,Mail,LockKeyhole,Eye,EyeOff} from 'lucide-react';
import {safeAuthNext,type EmailAuthConfig} from '../../lib/email-auth-config';
export default function AuthForm({config,reset=false}:{config:EmailAuthConfig|null;reset?:boolean}){
 const client=useMemo(()=>config?createBrowserClient(config.url,config.key):null,[config]);
 const [mode,setMode]=useState<'login'|'signup'|'forgot'|'reset'>(reset?'reset':'login'),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[verified,setVerified]=useState(!reset);
 useEffect(()=>{if(new URLSearchParams(location.search).get('error')==='link-expired')setError('O link expirou ou já foi usado. Solicite outro em Esqueci minha senha.');if(reset&&client){let live=true;void client.auth.getUser().then(({data,error})=>{if(live){setVerified(!!data.user&&!error);if(!data.user||error)setError('O link expirou ou é inválido. Solicite outro em Esqueci minha senha.');}});return()=>{live=false;};}},[client,reset]);
 function change(next:typeof mode){setMode(next);setError('');setMessage('');setPassword('');setConfirmation('');setVisible(false);}
 async function submit(e:FormEvent){
  e.preventDefault();if(!client||busy)return;setError('');setMessage('');
  if((mode==='signup'||mode==='reset')&&(password.length<8||password!==confirmation)){setError(password.length<8?'Use uma senha com pelo menos 8 caracteres.':'As senhas não coincidem.');return;}
  setBusy(true);
  try{
   const next=safeAuthNext(new URLSearchParams(location.search).get('next'));
   const callback=(target:string)=>location.origin+'/auth/callback?next='+encodeURIComponent(target);
   if(mode==='login'){
    const {error}=await client.auth.signInWithPassword({email:email.trim(),password});if(error)throw new Error('Não foi possível entrar. Confira o email, a senha e a confirmação do email.');
    location.assign(next);
   }else if(mode==='signup'){
    if(!name.trim()||name.trim().length>80)throw new Error('Informe seu nome completo.');
    const {error}=await client.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()},emailRedirectTo:callback(next)}});
    if(error)throw new Error('Não foi possível criar a conta. Confira os dados ou tente novamente mais tarde.');
    setPassword('');setConfirmation('');setMessage('Confira seu email para confirmar a conta. Se você já tem uma conta, use Entrar ou Esqueci minha senha.');
   }else if(mode==='forgot'){
    const {error}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:callback('/auth/reset')});
    if(error)throw new Error('Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.');
    setMessage('Se existir uma conta com esse email, você receberá um link para redefinir a senha.');
   }else{
    const {error}=await client.auth.updateUser({password});if(error)throw new Error('Não foi possível atualizar a senha. Solicite um novo link e tente novamente.');
    setPassword('');setConfirmation('');setMessage('Senha atualizada. Você já pode voltar ao VR Finanças.');
   }
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy(false);}
 }
 const title=mode==='signup'?'Criar sua conta':mode==='forgot'?'Esqueceu sua senha?':mode==='reset'?'Escolha uma nova senha':'Bem-vindo de volta';
 return <main className="auth-page"><section className="auth-card"><a className="auth-brand" href="/"><img src="/vr-mark.svg" alt=""/><span>VR Finanças</span></a><h1>{title}</h1>{!config?<><p>O acesso por email está em configuração. Seu acesso atual continua disponível.</p><a className="button primary" href="/signin-with-chatgpt?return_to=/" target="_top">Continuar com ChatGPT</a></>:<><p>{mode==='forgot'?'Enviaremos um link para você recuperar o acesso.':'Seus dados, na mesma conta em todos os dispositivos.'}</p><form onSubmit={submit}>
 {mode==='signup'&&<label className="field"><span>Nome completo</span><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} maxLength={80} required disabled={busy}/></label>}
 {mode!=='reset'&&<label className="field"><span>Email</span><div className="auth-input"><Mail size={17}/><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required disabled={busy}/></div></label>}
 {mode!=='forgot'&&<><label className="field"><span>{mode==='reset'?'Nova senha':'Senha'}</span><div className="auth-input"><LockKeyhole size={17}/><input type={visible?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==='login'?1:8} required disabled={busy||(mode==='reset'&&!verified)}/><button type="button" className="icon" aria-label={visible?'Ocultar senha':'Mostrar senha'} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>{mode==='login'?<button type="button" className="text-button auth-forgot" onClick={()=>change('forgot')}>Esqueci minha senha</button>:<label className="field"><span>Confirmar senha</span><input type={visible?'text':'password'} autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} minLength={8} required disabled={busy||(mode==='reset'&&!verified)}/></label>}</>}
 {error&&<p role="alert" className="auth-error">{error}</p>}{message&&<p role="status" className="auth-message">{message}</p>}
 <button className="button primary" disabled={busy||(mode==='reset'&&!verified)}>{busy?'Aguarde…':mode==='signup'?'Criar conta':mode==='forgot'?'Enviar link de recuperação':mode==='reset'?'Salvar nova senha':'Entrar'}</button>
 </form><div className="auth-links">{mode==='login'?<button className="text-button" onClick={()=>change('signup')}>Ainda não tem conta? Criar conta</button>:<button className="text-button" onClick={()=>{if(reset)location.assign('/auth');else change('login');}}><ArrowLeft size={14}/>Voltar para Entrar</button>}{message&&mode==='reset'&&<a href="/">Abrir VR Finanças</a>}<a href="/signin-with-chatgpt?return_to=/" target="_top">Usar meu acesso anterior com ChatGPT</a></div></>}<a className="auth-back" href="/">Voltar ao VR Finanças</a></section></main>;
}
