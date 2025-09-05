export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const TENANT = 'harvest-default-tenant';

export async function GET() {
  const people = await db.person.count({ where: { tenantId: TENANT } });
  const roles = await db.rolePlan.count();
  const assigned = await db.rolePlan.count({ where: { assignedPersonId: { not: null } } });

  const sample = await db.rolePlan.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      roleName: true,
      startDate: true,
      endDate: true,
      assignedPersonId: true,
      project: { select: { id: true, tenantId: true, name: true } },
    },
  });

  return NextResponse.json({ people, roles, assigned, sample });
}