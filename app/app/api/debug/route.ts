export const runtime = 'nodejs';
import { db } from '@/lib/db';

export async function GET() {
  const [tenants, clients, projects, people, rolePlans] = await Promise.all([
    db.tenant.count(),
    db.client.count(),
    db.project.count(),
    db.person.count(),
    db.rolePlan.count(),
  ]);
  return Response.json({ tenants, clients, projects, people, rolePlans });
}
