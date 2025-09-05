// app/api/dev/seed-calendar/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const TENANT = 'harvest-default-tenant';

function email(i: number) {
  return `demo${i}@local.test`;
}
function addDays(base: Date, d: number) {
  const x = new Date(base);
  x.setDate(x.getDate() + d);
  return x;
}

export async function POST() {
  try {
    // 1) Tenant
    await db.tenant.upsert({
      where: { id: TENANT },
      create: { id: TENANT, name: 'Harvest Default Tenant' },
      update: {},
    });

    // 2) Client (find-or-create)
    let client = await db.client.findFirst({
      where: { tenantId: TENANT, name: 'Demo Client' },
      select: { id: true },
    });
    if (!client) {
      client = await db.client.create({
        data: { tenantId: TENANT, name: 'Demo Client' },
        select: { id: true },
      });
    }

    // 3) Projects (minimal fields only)
    const projNames = ['Demo Project A', 'Demo Project B', 'Demo Project C'];
    const projects = [];
    for (const name of projNames) {
      let p = await db.project.findFirst({
        where: { tenantId: TENANT, name },
        select: { id: true, name: true },
      });
      if (!p) {
        p = await db.project.create({
          data: { tenantId: TENANT, clientId: client.id, name },
          select: { id: true, name: true },
        });
      }
      projects.push(p);
    }

    // 4) People (6 demo users)
    const needed = 6;
    const people: { id: string; firstName: string | null; lastName: string | null; email: string | null }[] =
      await db.person.findMany({
        where: { tenantId: TENANT, email: { contains: '@local.test' } },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { createdAt: 'asc' },
      });

    for (let i = people.length; i < needed; i++) {
      const created = await db.person.create({
        data: {
          tenantId: TENANT,
          firstName: `Demo${i + 1}`,
          lastName: 'User',
          email: email(i + 1), // unique emails
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      people.push(created);
    }

    // 5) RolePlans: 2 per person, staggered across months (with assignment)
    const now = new Date();
    let createdCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const p1 = projects[i % projects.length];
      const p2 = projects[(i + 1) % projects.length];

      const r1 = await db.rolePlan.create({
        data: {
          projectId: p1.id,
          roleName: `Frontend Dev ${i + 1}`,
          startDate: addDays(now, -7 - i * 3),
          endDate: addDays(now, 45),
          allocationPct: [100, 50, 25][i % 3],
          billable: i % 2 === 0,
          expectedRateCents: 12000,
          notes: '[SEED] calendar demo',
          assignedPersonId: person.id,
        },
        select: { id: true },
      });
      createdCount++;

      const r2 = await db.rolePlan.create({
        data: {
          projectId: p2.id,
          roleName: `QA ${i + 1}`,
          startDate: addDays(now, 10 + (i % 4) * 5),
          endDate: addDays(now, 70 + (i % 4) * 5),
          allocationPct: i % 2 === 0 ? 100 : 50,
          billable: true,
          expectedRateCents: 8000,
          notes: '[SEED] calendar demo',
          assignedPersonId: person.id,
        },
        select: { id: true },
      });
      createdCount++;
    }

    return NextResponse.json({
      ok: true,
      projects: projects.length,
      people: people.length,
      rolePlansCreated: createdCount,
      hint: 'Open /calendar',
    });
  } catch (e: any) {
    console.error('seed-calendar failed:', e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}