// app/api/roleplans/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const TENANT_ID = 'harvest-default-tenant';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      roleName,
      allocationPct,
      startDate,
      endDate,
      billable,
      expectedRateCents,
      notes,
    } = body ?? {};

    // Basic validation
    if (!projectId || !roleName) {
      return NextResponse.json(
        { ok: false, error: 'projectId and roleName are required' },
        { status: 400 }
      );
    }

    // Tenant check: the target project must belong to this tenant
    const project = await db.project.findFirst({
      where: { id: projectId, tenantId: TENANT_ID },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { ok: false, error: 'Project not found in tenant' },
        { status: 404 }
      );
    }

    const created = await db.rolePlan.create({
      data: {
        projectId,
        roleName,
        allocationPct: allocationPct ?? 100,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        billable: Boolean(billable),
        expectedRateCents:
          expectedRateCents === '' || expectedRateCents === null || expectedRateCents === undefined
            ? null
            : Number(expectedRateCents),
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    console.error('roleplans POST failed:', e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}