import {configuredEmailAuth} from '../../email-auth';
import Logout from './logout';
export const dynamic='force-dynamic';
export default function Page(){return <Logout config={configuredEmailAuth()}/>;}
