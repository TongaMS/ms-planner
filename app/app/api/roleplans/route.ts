export const runtime = 'nodejs';
import { db } from '@/lib/db';

function toDate(s?: unknown) {
  if (!s) return null;
  const d = new Date(String(s));
  return Number.isNaN(+d) ? null : d;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      roleName,
      startDate,
      endDate,
      allocationPct = 100,
      billable = true,
      expectedRateCents,
      notes,
    } = body ?? {};

    if (!projectId || !roleName) {
      return Response.json({ error: 'projectId and roleName are required' }, { status: 400 });
    }

    const created = await db.rolePlan.create({
      data: {
        projectId,
        roleName: String(roleName),
        startDate: toDate(startDate) ?? undefined,
        endDate: toDate(endDate) ?? undefined,
        allocationPct: Math.max(0, Math.min(100, Number(allocationPct ?? 100))),
        billable: Boolean(billable),
        expectedRateCents: expectedRateCents != null ? Number(expectedRateCents) : null,
        notes: notes != null ? String(notes) : null,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/roleplans failed:', e);
    return Response.json({ error: 'internal_error', detail: String(e?.message ?? e) }, { status: 500 });
  }
}
