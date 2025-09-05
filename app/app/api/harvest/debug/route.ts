export const runtime = 'nodejs';
import { probe } from '@/lib/harvest';

export async function GET() {
  try {
    const [c, p, u] = await Promise.all([probe.clients(), probe.projects(), probe.users()]);
    return Response.json({ ok: true, probes: { clients: c, projects: p, users: u } });
  } catch (e:any) {
    return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
