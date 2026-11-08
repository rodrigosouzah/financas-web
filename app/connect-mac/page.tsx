import {requireChatGPTUser} from '../chatgpt-auth';
import ConnectMac from './connect-mac';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{request?:string}>}){const query=await searchParams;const suffix=query.request?'?request='+encodeURIComponent(query.request):'';const user=await requireChatGPTUser('/connect-mac'+suffix);return <ConnectMac name={user.displayName}/>;}
