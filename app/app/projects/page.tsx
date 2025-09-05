import { db } from '@/lib/db';
import SyncButton from './SyncButton';
import Filters from './Filters';

export const dynamic = 'force-dynamic';

function HarvestBadge() {
  return (
    <span className="ml-2 inline-block text-[10px] px-2 py-[2px] rounded-full border border-amber-400 text-amber-700 bg-amber-50 align-middle">
      Harvest
    </span>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: { active?: string; clientId?: string };
}) {
  const active = (searchParams?.active ?? 'active').toLowerCase(); // 'active' | 'all'
  const clientId = searchParams?.clientId ?? '';

  // Clients for the filter dropdown
  const clients = await db.client.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const where: any = {};
  if (active === 'active') where.isActive = true;
  if (clientId) where.clientId = clientId;

  const items = await db.project.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    include: { client: true },
  });

  return (
    <main className="p-8 text-neutral-900">
      <h1 className="text-2xl font-semibold mb-2">Projects</h1>

      <SyncButton />
      <Filters clients={clients} />

      <table className="w-full text-sm border-separate border-spacing-y-1">
        <thead>
          <tr className="text-left text-neutral-700">
            <th className="py-2">Name</th>
            <th className="py-2">Client</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="bg-white">
              <td className="py-3 px-3">
                <a href={`/projects/${p.id}`} className="text-blue-700 underline hover:text-blue-500">
                  {p.name ?? p.harvestName ?? '(unnamed)'}
                </a>
                {p.harvestId != null && <HarvestBadge />}
              </td>
              <td className="py-3 px-3">{p.client?.name ?? '-'}</td>
              <td className="py-3 px-3">{p.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-neutral-500">
                No projects match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
