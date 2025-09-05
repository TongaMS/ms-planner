export const runtime = 'nodejs';
import { db } from '@/lib/db';
export async function GET() {
  const hasAccount = !!process.env.HARVEST_ACCOUNT_ID;
  const hasToken = !!process.env.HARVEST_TOKEN;
  const states = await db.syncState.findMany({ where: { key: { in: ['harvest-clients','harvest-projects','harvest-users'] } } });
  return Response.json({
    env: { HARVEST_ACCOUNT_ID: hasAccount, HARVEST_TOKEN: hasToken },
    syncState: states.reduce((m, s) => (m[s.key]=s.value, m), {} as Record<string,string|undefined>)
  });
}
