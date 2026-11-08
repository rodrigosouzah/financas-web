'use client';
import { useEffect,useRef,useState,useCallback } from 'react';
import { type Workspace,validateWorkspace } from '../lib/finance';
import { type CachedWorkspace,readLocal,writeLocal,download } from '../lib/browser-storage';
const EMPTY:Workspace={schemaVersion:1,profiles:[],activeId:null};
export function useWorkspace(){
 const [state,setState]=useState<Workspace>(EMPTY),[ready,setReady]=useState(false),[identity,setIdentity]=useState<{userId:string;name:string;authProvider?:'email'|'chatgpt'|'native'}|null>(null),[signInPath,setSignInPath]=useState('/signin-with-chatgpt?return_to=/'),[status,setStatus]=useState('Carregando'),[error,setError]=useState(''),[conflict,setConflict]=useState(false);
 const latest=useRef(state),owner=useRef<{userId:string;name:string;authProvider?:'email'|'chatgpt'|'native'}|null>(null),revision=useRef(0),sequence=useRef(0),dirty=useRef(false),busy=useRef(false),blocked=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const cache=useCallback(async()=>{if(owner.current)await writeLocal('user:'+owner.current.userId,{state:latest.current,revision:revision.current,dirty:dirty.current,name:owner.current.name} satisfies CachedWorkspace);},[]);
 const pump=useCallback(async()=>{
  if(!owner.current||!dirty.current||busy.current||blocked.current||!navigator.onLine)return;
  busy.current=true;const at=sequence.current,payload=latest.current;setStatus('Salvando');
  try{const response=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json','X-Financas-Owner':owner.current.userId},body:JSON.stringify({revision:revision.current,state:payload})});const result=await response.json() as {revision:number;error?:string};if(response.status===409){blocked.current=true;setConflict(true);throw new Error(result.error);}if(!response.ok)throw new Error(result.error||'Não foi possível salvar na nuvem.');revision.current=result.revision;dirty.current=sequence.current!==at;await cache();setStatus(dirty.current?'Alterações locais':'Salvo na nuvem');setError('');}
  catch(e){setStatus('Salvo neste dispositivo');setError(e instanceof Error?e.message:'Falha de conexão. A cópia local foi preservada.');}
  finally{busy.current=false;if(dirty.current&&!blocked.current&&sequence.current!==at){timer.current=setTimeout(()=>void pump(),500);}}
 },[cache]);
 useEffect(()=>{let mounted=true;
  async function start(){try{
   const response=await fetch('/api/session',{cache:'no-store'});if(!response.ok)throw new Error('Não foi possível verificar a conta.');const user=await response.json() as {signedIn:boolean;userId:string;name:string;authProvider?:'email'|'chatgpt'|'native';signInPath?:string};if(!mounted)return;setSignInPath(user.signInPath==='/auth'?'/auth':'/signin-with-chatgpt?return_to=/');
   if(!user.signedIn){setStatus('Entre para começar');setReady(true);return;}
   const who={userId:user.userId,name:user.name,authProvider:user.authProvider};owner.current=who;setIdentity(who);localStorage.setItem('financas:last-user',JSON.stringify(who));
   const cached=await readLocal<CachedWorkspace>('user:'+who.userId).catch(()=>null);
   const remoteResponse=await fetch('/api/workspace',{cache:'no-store'});if(!remoteResponse.ok)throw new Error('A nuvem está indisponível.');const remote=await remoteResponse.json() as {userId:string;revision:number;state:unknown};if(remote.userId!==who.userId)throw new Error('A conta conectada mudou. Entre novamente antes de sincronizar.');
   if(!mounted)return;let chosen:Workspace=remote.state?validateWorkspace(remote.state):EMPTY;
   if(cached?.dirty){chosen=validateWorkspace(cached.state);dirty.current=true;revision.current=cached.revision;if(remote.revision!==cached.revision){blocked.current=true;setConflict(true);setError('Há alterações em outro dispositivo. Exporte seu backup local antes de carregar a nuvem.');}}
   else revision.current=remote.revision;
   latest.current=chosen;setState(chosen);setReady(true);setStatus(cached?.dirty?'Alterações locais':'Salvo na nuvem');await cache();if(dirty.current&&!blocked.current)void pump();
  }catch(e){let last=owner.current;try{last??=JSON.parse(localStorage.getItem('financas:last-user')||'null');}catch{/* Ignore damaged device metadata. */}if(last){const cached=await readLocal<CachedWorkspace>('user:'+last.userId).catch(()=>null);if(cached&&mounted){owner.current=last;setIdentity(last);latest.current=validateWorkspace(cached.state);setState(latest.current);revision.current=cached.revision;dirty.current=cached.dirty;setStatus('Modo offline');}}if(mounted){setReady(true);setError(e instanceof Error?e.message:'Sem conexão.');}}
  }
  void start();const online=()=>void pump();window.addEventListener('online',online);return()=>{mounted=false;window.removeEventListener('online',online);if(timer.current)clearTimeout(timer.current);};
 },[cache,pump]);
 const change=useCallback((update:Workspace|((previous:Workspace)=>Workspace))=>{
  if(!owner.current)return;const next=validateWorkspace(typeof update==='function'?update(latest.current):update);latest.current=next;setState(next);sequence.current++;dirty.current=true;setStatus(navigator.onLine?'Salvando':'Modo offline');void cache().catch(e=>setError(e.message));if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void pump(),600);
 },[cache,pump]);
 // Pull remote changes only while clean. A delayed response cannot replace a
 // local edit made during the request; revision conflicts keep both copies.
 useEffect(()=>{
  if(!ready||!identity)return;
  let stopped=false,reading=false;
  async function refresh(){
   if(stopped||reading||document.hidden||!navigator.onLine||dirty.current||busy.current||blocked.current||!owner.current)return;
   reading=true;const at=sequence.current,who=owner.current.userId;
   try{
    const response=await fetch('/api/workspace',{cache:'no-store'});
    if(!response.ok)return;
    const remote=await response.json() as {userId:string;revision:number;state:unknown};
    if(stopped||dirty.current||busy.current||sequence.current!==at||owner.current?.userId!==who)return;
    if(remote.userId!==who){setError('A conta conectada mudou. Entre novamente antes de sincronizar.');return;}
    if(remote.revision<=revision.current)return;
    const next=remote.state?validateWorkspace(remote.state):EMPTY;
    latest.current=next;revision.current=remote.revision;setState(next);setStatus('Salvo na nuvem');setError('');await cache();
   }catch{/* A transient read failure must never replace the local workspace. */}finally{reading=false;}
  }
  const pull=()=>void refresh();window.addEventListener('focus',pull);window.addEventListener('online',pull);document.addEventListener('visibilitychange',pull);
  const interval=setInterval(pull,30_000);
  return()=>{stopped=true;clearInterval(interval);window.removeEventListener('focus',pull);window.removeEventListener('online',pull);document.removeEventListener('visibilitychange',pull);};
 },[ready,identity,cache]);
 const loadCloud=useCallback(async()=>{const at=sequence.current,who=owner.current?.userId;download('Financas-backup-local-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(latest.current,null,2));const response=await fetch('/api/workspace',{cache:'no-store'});if(!response.ok)throw new Error('Não foi possível carregar a nuvem.');const result=await response.json() as {userId:string;revision:number;state:unknown};if(!who||result.userId!==who||owner.current?.userId!==who)throw new Error('A conta conectada mudou. Entre novamente antes de sincronizar.');if(sequence.current!==at||busy.current)throw new Error('Há novas alterações locais. Salve um novo backup antes de carregar a nuvem.');const next=result.state?validateWorkspace(result.state):EMPTY;latest.current=next;revision.current=result.revision;dirty.current=false;blocked.current=false;setConflict(false);setState(next);setError('');setStatus('Salvo na nuvem');await cache();},[cache]);
 return{state,change,ready,identity,signInPath,status,error,conflict,loadCloud,flush:pump,clearError:()=>setError('')};
}
