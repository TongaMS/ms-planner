export const runtime = 'nodejs';

import { db } from '@/lib/db';
import { fetchClients, fetchProjects, fetchUsers } from '@/lib/harvest';

const TENANT_ID = 'seed-tenant';

async function getSince(key: string) {
  const state = await db.syncState.findUnique({ where: { key } });
  return state?.value ?? undefined;
}
async function setSince(key: string, iso: string) {
  await db.syncState.upsert({ where: { key }, create: { key, value: iso }, update: { value: iso } });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const full = url.searchParams.get('full') === '1';
  const details: any = { steps: [], full };
  try {
    const nowIso = new Date().toISOString();

    const sinceClients  = full ? undefined : await getSince('harvest-clients');
    const sinceProjects = full ? undefined : await getSince('harvest-projects');
    const sinceUsers    = full ? undefined : await getSince('harvest-users');

    const clients = await fetchClients(sinceClients);
    details.steps.push({ step: 'clients', since: sinceClients ?? null, fetched: clients.length });
    for (const c of clients) {
      await db.client.upsert({
        where: { harvestId: c.id },
        create: { tenantId: TENANT_ID, name: c.name, harvestId: c.id },
        update: { name: c.name },
      });
    }
    await setSince('harvest-clients', nowIso);

    const projects = await fetchProjects(sinceProjects);
    details.steps.push({ step: 'projects', since: sinceProjects ?? null, fetched: projects.length });
    for (const p of projects) {
      const client = await db.client.findFirst({ where: { tenantId: TENANT_ID, harvestId: p.client.id } });
      const clientId = client
        ? client.id
        : (await db.client.upsert({
            where: { harvestId: p.client.id },
            create: { tenantId: TENANT_ID, name: `Client ${p.client.id}`, harvestId: p.client.id },
            update: {},
          })).id;

      await db.project.upsert({
        where: { harvestId: p.id },
        create: { tenantId: TENANT_ID, clientId, harvestId: p.id, harvestName: p.name, isActive: p.is_active },
        update: { clientId, harvestName: p.name, isActive: p.is_active },
      });
    }
    await setSince('harvest-projects', nowIso);

    const users = await fetchUsers(sinceUsers);
    details.steps.push({ step: 'users', since: sinceUsers ?? null, fetched: users.length });
    for (const u of users) {
      await db.person.upsert({
        where: { email: u.email },
        create: {
          tenantId: TENANT_ID,
          firstName: u.first_name ?? '',
          lastName: u.last_name ?? '',
          email: u.email,
          isActive: u.is_active,
          harvestId: u.id,
        },
        update: {
          firstName: u.first_name ?? '',
          lastName: u.last_name ?? '',
          isActive: u.is_active,
          harvestId: u.id,
        },
      });
    }
    await setSince('harvest-users', nowIso);

    const [clientsCount, projectsCount, peopleCount] = await Promise.all([
      db.client.count({ where: { tenantId: TENANT_ID } }),
      db.project.count({ where: { tenantId: TENANT_ID } }),
      db.person.count({ where: { tenantId: TENANT_ID } }),
    ]);

    details.summary = { afterCounts: { clients: clientsCount, projects: projectsCount, people: peopleCount } };
    return Response.json({ ok: true, ...details });
  } catch (err: any) {
    console.error('POST /api/harvest/import failed:', err);
    return Response.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
