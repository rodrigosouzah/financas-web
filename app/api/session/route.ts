import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic='force-dynamic';
export async function GET(){const user=await getChatGPTUser();return Response.json(user?{signedIn:true,userId:user.userId,name:user.displayName}:{signedIn:false},{headers:{'Cache-Control':'no-store'}});}
