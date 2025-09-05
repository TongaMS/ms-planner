import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function fmt(d?: Date | null) {
  if (!d) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      rolePlans: { orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }] },
    },
  });
  if (!project) return notFound();

  return (
    <main className="p-8 space-y-8 text-neutral-900">
      <a href="/projects" className="text-blue-700 underline">← Back to Projects</a>

      <header>
        <h1 className="text-2xl font-semibold">
          {project.name ?? project.harvestName ?? '(unnamed project)'}
        </h1>
        <p className="text-sm text-neutral-600">
          Client: {project.client?.name ?? '-'} • Status: {project.isActive ? 'Active' : 'Inactive'}
        </p>
      </header>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-medium mb-3">Identifiers</h2>
        <div className="text-sm space-y-1">
          <div>Project ID: {project.id}</div>
          {project.harvestId != null && <div>Harvest ID: {project.harvestId}</div>}
          {project.harvestName && <div>Harvest Name: {project.harvestName}</div>}
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-medium mb-3">Role planning</h2>
        {project.rolePlans.length === 0 ? (
          <p className="text-sm text-neutral-600">No roles planned yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-neutral-600">
              <tr>
                <th className="py-2 text-left">Role</th>
                <th className="py-2 text-left">Dates</th>
                <th className="py-2 text-left">% Allocation</th>
                <th className="py-2 text-left">Billable</th>
                <th className="py-2 text-left">Expected rate</th>
                <th className="py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {project.rolePlans.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.roleName}</td>
                  <td className="py-2">{fmt(r.startDate)} → {fmt(r.endDate)}</td>
                  <td className="py-2">{r.allocationPct}%</td>
                  <td className="py-2">{r.billable ? 'Yes' : 'No'}</td>
                  <td className="py-2">{r.expectedRateCents != null ? `$${(r.expectedRateCents/100).toLocaleString()}/h` : '-'}</td>
                  <td className="py-2">{r.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
