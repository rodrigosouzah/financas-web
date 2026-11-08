import {configuredEmailAuth} from '../../email-auth';
import AuthForm from '../auth-form';
export const dynamic='force-dynamic';
export default function Page(){return <AuthForm config={configuredEmailAuth()} reset/>;}
