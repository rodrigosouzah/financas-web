import {env} from 'cloudflare:workers';
import type {ChatGPTUser} from './chatgpt-auth';
import {resolveSuperuser} from '../lib/assistant-role';
// Caller supplies server-verified Supabase identity; never workspace metadata.
export async function isSuperuser(user:ChatGPTUser){return env.DB?resolveSuperuser(env.DB,user):false;}
