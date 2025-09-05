// app/people/page.tsx
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const people = await db.person.findMany({
    where: { tenantId: 'harvest-default-tenant' },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      harvestId: true,
    },
  });

  return (
    <main className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People</h1>
        <a href="/projects" className="text-blue-600 hover:underline">← Back to Projects</a>
      </header>

      <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Harvest ID</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  No people found. Try syncing from Harvest.
                </td>
              </tr>
            ) : (
              people.map(p => (
                <tr key={p.id} className="border-t hover:bg-neutral-50">
                  <td className="px-4 py-2">
                    {(p.firstName || '') + (p.lastName ? ` ${p.lastName}` : '') || '(no name)'}
                  </td>
                  <td className="px-4 py-2">{p.email ?? '—'}</td>
                  <td className="px-4 py-2">{p.harvestId ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}