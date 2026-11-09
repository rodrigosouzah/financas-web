import {redirect} from 'next/navigation';
import {accountAccess} from '../account-access';
import {requireChatGPTUser} from '../chatgpt-auth';
import ConnectMac from './connect-mac';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{request?:string}>}){const query=await searchParams;const suffix=query.request?'?request='+encodeURIComponent(query.request):'';const user=await requireChatGPTUser('/connect-mac'+suffix);if(await accountAccess(user)!=='approved')redirect('/');return <ConnectMac name={user.displayName}/>;}
