'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import type {EmailAuthConfig} from '../../../lib/email-auth-config';
export default function Logout({config}:{config:EmailAuthConfig|null}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function exit(){setBusy(true);try{if(config){const {error}=await createBrowserClient(config.url,config.key).auth.signOut({scope:'local'});if(error)throw error;}localStorage.removeItem('financas:last-user');location.assign('/signout-with-chatgpt?return_to=/');}catch{setError('Não foi possível sair. Tente novamente.');setBusy(false);}}
 return <main className="auth-page"><section className="auth-card"><h1>Sair desta conta?</h1><p>Confira se suas alterações estão salvas na nuvem antes de sair.</p>{error&&<p className="auth-error">{error}</p>}<button className="button primary" disabled={busy} onClick={exit}>{busy?'Saindo…':'Sair da conta'}</button><a href="/">Continuar no Finanças</a></section></main>;
}
