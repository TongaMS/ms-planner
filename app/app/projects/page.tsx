// app/projects/page.tsx
import { db } from '@/lib/db';
import SyncButton from './SyncButton';

function labelType(t: string | null | undefined) {
  if (!t) return '-';
  return t.replaceAll('_', ' ');
}

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const items = await db.project.findMany({
    where: { tenantId: 'harvest-default-tenant' }, // 🔑 filter only Harvest tenant
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { name: true } } },
  });

  return (
    <main className="space-y-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <SyncButton />
      </header>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No projects found. Try syncing from Harvest.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-2">
                    <a
                      href={`/projects/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {p.name ?? p.harvestName ?? '(unnamed)'}
                    </a>
                  </td>
                  <td className="px-4 py-2">{p.client?.name ?? '-'}</td>
                  <td className="px-4 py-2">{labelType((p as any).type)}</td>
                  <td className="px-4 py-2">
                    {(p as any).isActive ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}