// app/api/roleplans/[id]/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const TENANT_ID = 'harvest-default-tenant';

// Ensure the role belongs to a project in the tenant
async function ensureTenant(roleId: string) {
  const role = await db.rolePlan.findUnique({
    where: { id: roleId },
    select: { id: true, project: { select: { id: true, tenantId: true } } },
  });
  if (!role || role.project.tenantId !== TENANT_ID) return null;
  return role;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await ensureTenant(params.id);
    if (!role) {
      return NextResponse.json(
        { ok: false, error: 'Role not found in tenant' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      roleName,
      allocationPct,
      startDate,
      endDate,
      billable,
      expectedRateCents,
      notes,
    } = body ?? {};

    const updated = await db.rolePlan.update({
      where: { id: params.id },
      data: {
        ...(roleName !== undefined ? { roleName } : {}),
        ...(allocationPct !== undefined ? { allocationPct: Number(allocationPct) } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        ...(billable !== undefined ? { billable: Boolean(billable) } : {}),
        ...(expectedRateCents !== undefined
          ? {
              expectedRateCents:
                expectedRateCents === '' || expectedRateCents === null
                  ? null
                  : Number(expectedRateCents),
            }
          : {}),
        ...(notes !== undefined ? { notes: notes ?? null } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    console.error('roleplans PATCH failed:', e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await ensureTenant(params.id);
    if (!role) {
      return NextResponse.json(
        { ok: false, error: 'Role not found in tenant' },
        { status: 404 }
      );
    }

    await db.rolePlan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('roleplans DELETE failed:', e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}