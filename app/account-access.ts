import {env} from 'cloudflare:workers';
import type {ChatGPTUser} from './chatgpt-auth';
import {isSuperuser} from './superuser';
import {accessStatus} from '../lib/account-access';
export async function isAccessOwner(user:ChatGPTUser){
 await isSuperuser(user);
 if(!env.DB)return false;
 const role=await env.DB.prepare("SELECT user_id FROM finance_roles WHERE user_id=? AND role='superuser' AND bootstrap_key='initial-owner'").bind(user.userId).first();return !!role;
}
export async function accountAccess(user:ChatGPTUser){if(!env.DB)throw Error('Acesso indisponível.');return accessStatus(env.DB,user,await isAccessOwner(user));}
export async function approvalDenied(user:ChatGPTUser){const status=await accountAccess(user);return status==='approved'?null:Response.json({error:status==='pending'?'Sua conta aguarda aprovação do administrador.':'Seu acesso não foi aprovado. Entre em contato com o administrador.',approval:status},{status:403,headers:{'Cache-Control':'no-store'}});}
