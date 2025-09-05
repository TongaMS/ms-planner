// app/api/harvest/import/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const HARVEST_BASE = 'https://api.harvestapp.com/v2';
const DEFAULT_TENANT_ID = 'harvest-default-tenant';

function harvestHeaders() {
  const accountId = process.env.HARVEST_ACCOUNT_ID;
  const token = process.env.HARVEST_TOKEN;
  if (!accountId || !token) {
    throw new Error('Missing HARVEST_ACCOUNT_ID or HARVEST_TOKEN in environment');
  }
  return {
    'User-Agent': 'MS-Planner (support@makingsense.com)',
    'Harvest-Account-Id': accountId,
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

async function fetchAll(endpoint: string) {
  const items: any[] = [];
  let page = 1;
  while (true) {
    const url = new URL(`${HARVEST_BASE}/${endpoint}`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '100');

    const res = await fetch(url.toString(), { headers: harvestHeaders(), cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Harvest ${endpoint} HTTP ${res.status}: ${text}`);
    }
    const data = await res.json();

    const key = endpoint.split('?')[0];
    const topKey =
      key === 'clients' ? 'clients' :
      key === 'projects' ? 'projects' :
      key === 'users' ? 'users' : '';
    const pageItems = (topKey && data[topKey]) ? data[topKey] : [];
    items.push(...pageItems);

    if (!data.next_page) break;
    page = data.next_page;
  }
  return items;
}

async function runImport() {
  // Ensure tenant exists
  await db.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    create: { id: DEFAULT_TENANT_ID, name: 'Harvest Default Tenant' },
    update: {},
  });

  const [clients, projects, users] = await Promise.all([
    fetchAll('clients'),
    fetchAll('projects'),
    fetchAll('users'),
  ]);

  // --- Clients ---
  for (const c of clients) {
    const existing = await db.client.findFirst({
      where: { tenantId: DEFAULT_TENANT_ID, harvestId: c.id },
      select: { id: true },
    });

    if (!existing) {
      await db.client.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          harvestId: c.id,
          name: c.name ?? '(no name)',
        },
      });
    } else {
      await db.client.update({
        where: { id: existing.id },
        data: { name: c.name ?? '(no name)' },
      });
    }
  }

  // Map harvest client IDs -> local client IDs
  const clientRows = await db.client.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    select: { id: true, harvestId: true },
  });
  const clientByHarvestId = new Map<number, string>();
  for (const row of clientRows) {
    if (row.harvestId != null) clientByHarvestId.set(Number(row.harvestId), row.id);
  }

  // --- Projects ---
  for (const p of projects) {
    const harvestClientId = p.client?.id ?? p.client_id ?? null;
    const clientId =
      harvestClientId != null ? clientByHarvestId.get(Number(harvestClientId)) ?? null : null;

    const existing = await db.project.findFirst({
      where: { tenantId: DEFAULT_TENANT_ID, harvestId: p.id },
      select: { id: true },
    });

    if (!existing) {
      await db.project.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          harvestId: p.id,
          name: p.name ?? null,
          harvestName: p.name ?? null,
          clientId,
        },
      });
    } else {
      await db.project.update({
        where: { id: existing.id },
        data: {
          name: p.name ?? null,
          harvestName: p.name ?? null,
          clientId,
        },
      });
    }
  }

  // --- People (Users): upsert safely ---
  for (const u of users) {
    let firstName = (u.first_name ?? '').trim();
    let lastName = (u.last_name ?? '').trim();
    const email = (u.email ?? '').trim() || null;

    if (!firstName && email) firstName = email;
    if (!lastName) lastName = '';

    if (email) {
      // Upsert by (tenantId + email), since email is unique in your schema
      await db.person.upsert({
        where: { email }, // unique constraint on email
        create: {
          tenantId: DEFAULT_TENANT_ID,
          harvestId: u.id,
          firstName,
          lastName,
          email,
        } as any,
        update: {
          harvestId: u.id,
          firstName,
          lastName,
        } as any,
      });
    } else {
      // No email? then upsert by harvestId (should be unique enough)
      const existing = await db.person.findFirst({
        where: { tenantId: DEFAULT_TENANT_ID, harvestId: u.id },
        select: { id: true },
      });
      if (!existing) {
        await db.person.create({
          data: {
            tenantId: DEFAULT_TENANT_ID,
            harvestId: u.id,
            firstName,
            lastName,
          } as any,
        });
      } else {
        await db.person.update({
          where: { id: existing.id },
          data: { firstName, lastName } as any,
        });
      }
    }
  }
  // Return counts
  const [clientsCount, projectsCount, peopleCount] = await Promise.all([
    db.client.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    db.project.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    db.person.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
  ]);

  return {
    ok: true,
    tenantId: DEFAULT_TENANT_ID,
    imported: {
      clients: clients.length,
      projects: projects.length,
      users: users.length,
    },
    totals: { clients: clientsCount, projects: projectsCount, people: peopleCount },
  };
}

export async function POST() {
  try {
    const result = await runImport();
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Harvest import failed:', e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}