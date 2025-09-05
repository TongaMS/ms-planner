// app/projects/[id]/page.tsx
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AddRoleForm from './AddRoleForm';
import DeleteRoleButton from './DeleteRoleButton';
import EditRoleInline from './EditRoleInline';
import AssignPersonSelect from './AssignPersonSelect';

export const dynamic = 'force-dynamic';

function fmt(d?: Date | null) {
  if (!d) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await db.project.findFirst({
    where: { id: params.id, tenantId: 'harvest-default-tenant' },
    include: {
      client: true,
      rolePlans: {
        orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
        include: { assignedPerson: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
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
          Client: {project.client?.name ?? '-'} • Status: {(project as any).isActive ? 'Active' : 'Inactive'}
        </p>
      </header>

      <section className="rounded-lg bg-white p-4 shadow-sm space-y-4">
        <h2 className="font-medium mb-3">Role planning</h2>
        <AddRoleForm projectId={project.id} />

        <table className="w-full text-sm">
          <thead className="text-neutral-600">
            <tr>
              <th className="py-2 text-left">Role</th>
              <th className="py-2 text-left">Dates</th>
              <th className="py-2 text-left">% Allocation</th>
              <th className="py-2 text-left">Billable</th>
              <th className="py-2 text-left">Expected rate</th>
              <th className="py-2 text-left">Assigned to</th>
              <th className="py-2 text-left">Notes</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {project.rolePlans.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-neutral-500">
                  No roles planned yet.
                </td>
              </tr>
            ) : (
              project.rolePlans.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.roleName}</td>
                  <td className="py-2">{fmt(r.startDate)} → {fmt(r.endDate)}</td>
                  <td className="py-2">{r.allocationPct}%</td>
                  <td className="py-2">{r.billable ? 'Yes' : 'No'}</td>
                  <td className="py-2">
                    {r.expectedRateCents != null ? `$${(r.expectedRateCents / 100).toLocaleString()}/h` : '-'}
                  </td>
                  <td className="py-2">
                    <AssignPersonSelect
                      roleId={r.id}
                      initialPersonId={r.assignedPerson?.id ?? null}
                    />
                  </td>
                  <td className="py-2">{r.notes ?? '-'}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <EditRoleInline
                        role={{
                          id: r.id,
                          roleName: r.roleName,
                          startDate: r.startDate as any,
                          endDate: r.endDate as any,
                          allocationPct: r.allocationPct,
                          billable: r.billable,
                          expectedRateCents: r.expectedRateCents,
                          notes: r.notes,
                        }}
                      />
                      <DeleteRoleButton id={r.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}