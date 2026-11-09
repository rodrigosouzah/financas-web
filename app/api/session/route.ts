import {accountAccess,isAccessOwner} from '../../account-access';
import {isSuperuser} from '../../superuser';
import { getChatGPTUser } from '../../chatgpt-auth';
import {configuredEmailAuth} from '../../email-auth';
export const dynamic='force-dynamic';
export async function GET(){const user=await getChatGPTUser();const signInPath=configuredEmailAuth()?'/auth':'/signin-with-chatgpt?return_to=/';return Response.json(user?{signedIn:true,approval:await accountAccess(user),accessOwner:await isAccessOwner(user),superuser:await isSuperuser(user),userId:user.userId,name:user.displayName,authProvider:user.authProvider,signInPath}:{signedIn:false,signInPath},{headers:{'Cache-Control':'no-store'}});}
