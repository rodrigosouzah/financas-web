import { VERSION } from '../../../lib/finance';
export async function GET(){return Response.json({version:VERSION},{headers:{'Cache-Control':'no-store'}});}
