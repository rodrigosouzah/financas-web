import {cookies} from 'next/headers';
import {and,eq,gt} from 'drizzle-orm';
import {getDb} from '../db';
import {nativeDevices} from '../db/schema';
import {deviceDigest,NATIVE_COOKIE,parseDeviceToken} from '../lib/native-device';
export async function nativeIdentity(token:string|null){
 const parsed=parseDeviceToken(token);if(!parsed)return null;
 const [device]=await getDb().select().from(nativeDevices).where(and(eq(nativeDevices.id,parsed.id),eq(nativeDevices.tokenHash,await deviceDigest(parsed.secret)),gt(nativeDevices.expiresAt,Date.now()))).limit(1);
 return device?{userId:device.userId,displayName:device.displayName,email:'',fullName:device.displayName,authProvider:'native' as const}:null;
}
export async function nativeCookieIdentity(){return nativeIdentity((await cookies()).get(NATIVE_COOKIE)?.value??null);}
