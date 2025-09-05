export const runtime = 'nodejs';
import { db } from '@/lib/db';

function toDate(s?: unknown) {
  if (!s) return null;
  const d = new Date(String(s));
  return Number.isNaN(+d) ? null : d;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      roleName,
      startDate,
      endDate,
      allocationPct,
      billable,
      expectedRateCents,
      notes,
    } = body ?? {};

    const updated = await db.rolePlan.update({
      where: { id: params.id },
      data: {
        ...(roleName !== undefined ? { roleName: String(roleName) } : {}),
        ...(startDate !== undefined ? { startDate: toDate(startDate) ?? undefined } : {}),
        ...(endDate !== undefined ? { endDate: toDate(endDate) ?? undefined } : {}),
        ...(allocationPct !== undefined ? { allocationPct: Math.max(0, Math.min(100, Number(allocationPct))) } : {}),
        ...(billable !== undefined ? { billable: Boolean(billable) } : {}),
        ...(expectedRateCents !== undefined ? { expectedRateCents: expectedRateCents != null ? Number(expectedRateCents) : null } : {}),
        ...(notes !== undefined ? { notes: notes != null ? String(notes) : null } : {}),
      },
    });

    return Response.json(updated);
  } catch (e: any) {
    console.error(`PATCH /api/roleplans/${params.id} failed:`, e);
    return Response.json({ error: 'internal_error', detail: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db.rolePlan.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch (e: any) {
    console.error(`DELETE /api/roleplans/${params.id} failed:`, e);
    return Response.json({ error: 'internal_error', detail: String(e?.message ?? e) }, { status: 500 });
  }
}
