// app/calendar/page.tsx
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TENANT = 'harvest-default-tenant';
const MONTHS_PAST = 6;
const MONTHS_FUTURE = 6;

/** ---------- date helpers ---------- */
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addMonths(d: Date, m: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
function monthDiff(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
function fmtMonthLabel(d: Date) {
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}
function clampDate(d: Date, min: Date, max: Date) {
  return d < min ? min : d > max ? max : d;
}
function overlaps(aStart?: Date | null, aEnd?: Date | null, bStart?: Date, bEnd?: Date) {
  const s = aStart ?? new Date(-8640000000000000); // min
  const e = aEnd ?? new Date(8640000000000000); // max
  return s <= bEnd && e >= bStart;
}

// ISO week helpers (week starts Monday)
function startOfISOWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  x.setHours(0, 0, 0, 0);
  return addDays(x, -day);
}
function endOfISOWeek(d: Date) {
  return addDays(startOfISOWeek(d), 6);
}
function weekDiff(aStart: Date, bStart: Date) {
  const msPerWeek = 7 * 24 * 3600 * 1000;
  return Math.floor((bStart.getTime() - aStart.getTime()) / msPerWeek);
}
function fmtWeekLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** ---------- utilization helpers ---------- */
// For each week in the window, sum allocation % for all roles overlapping that week.
// Returns { avgPct, maxPct } across all weeks in-window.
function computeUtilizationByWeek(
  weeks: Date[],
  roles: { startDate: Date | null; endDate: Date | null; allocationPct: number | null }[],
  winStart: Date,
  winEnd: Date
) {
  if (weeks.length === 0) return { avgPct: 0, maxPct: 0 };
  const perWeek: number[] = weeks.map(() => 0);

  for (const r of roles) {
    const s = r.startDate ? new Date(r.startDate) : winStart;
    const e = r.endDate ? new Date(r.endDate) : winEnd;
    const rs = clampDate(s, winStart, winEnd);
    const re = clampDate(e, winStart, winEnd);
    const alloc = Math.max(0, r.allocationPct ?? 0);

    // add alloc to each week overlapped
    for (let i = 0; i < weeks.length; i++) {
      const ws = weeks[i];
      const we = endOfISOWeek(ws);
      if (overlaps(rs, re, ws, we)) perWeek[i] += alloc;
    }
  }

  const sum = perWeek.reduce((a, b) => a + b, 0);
  const avgPct = Math.round((sum / perWeek.length) * 10) / 10; // one decimal
  const maxPct = Math.max(0, ...perWeek);
  return { avgPct, maxPct };
}

/** ---------- Page ---------- */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: {
    client?: string;
    project?: string;
    person?: string;
    billable?: 'all' | 'billable' | 'nonbillable';
    zoom?: 'month' | 'week';
  };
}) {
  // Window: 6 months back → 6 months ahead (used for both zoom modes)
  const today = new Date();
  const baseMonthStart = startOfMonth(today);
  const winStart = startOfMonth(addMonths(today, -MONTHS_PAST));
  const winEnd = endOfMonth(addMonths(today, MONTHS_FUTURE));

  const zoom = (searchParams.zoom ?? 'month') as 'month' | 'week';

  // Build columns based on zoom
  const months: Date[] = [];
  for (let i = -MONTHS_PAST; i <= MONTHS_FUTURE; i++) {
    months.push(addMonths(baseMonthStart, i));
  }

  // Weeks array always built (used for totals computation even when zoom=month)
  const weeks: Date[] = [];
  {
    let cursor = startOfISOWeek(winStart);
    const last = endOfISOWeek(winEnd);
    while (cursor <= last) {
      weeks.push(new Date(cursor));
      cursor = addDays(cursor, 7);
    }
  }

  // Filters (from query string)
  const clientFilter = (searchParams.client ?? '').trim() || undefined;
  const projectFilter = (searchParams.project ?? '').trim() || undefined;
  const personFilter = (searchParams.person ?? '').trim() || undefined;
  const billableFilter = (searchParams.billable ?? 'all') as 'all' | 'billable' | 'nonbillable';

  // Load filter options
  const [clients, projects, people] = await Promise.all([
    db.client.findMany({
      where: { tenantId: TENANT },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    db.project.findMany({
      where: { tenantId: TENANT },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, clientId: true },
    }),
    db.person.findMany({
      where: { tenantId: TENANT },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
  ]);

  const personName = (p: { firstName: string | null; lastName: string | null; email: string | null }) =>
    [p.firstName ?? '', p.lastName ?? ''].join(' ').trim() || p.email || '(no name)';

  // Fetch people + all assigned roles (no date filter here)
  const rawPeople = await db.person.findMany({
    where: {
      tenantId: TENANT,
      ...(personFilter ? { id: personFilter } : {}),
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      assignedRoles: {
        select: {
          id: true,
          roleName: true,
          startDate: true,
          endDate: true,
          allocationPct: true,
          billable: true,
          expectedRateCents: true,
          project: { select: { id: true, name: true, harvestName: true, clientId: true } },
        },
      },
    },
  });

  // Apply role-level filters (client / project / billable), then window overlap for display
  const filteredRows = rawPeople.map((p) => {
    let roles = p.assignedRoles;

    if (clientFilter) roles = roles.filter((r) => r.project?.clientId === clientFilter);
    if (projectFilter) roles = roles.filter((r) => r.project?.id === projectFilter);
    if (billableFilter === 'billable') roles = roles.filter((r) => r.billable === true);
    else if (billableFilter === 'nonbillable') roles = roles.filter((r) => r.billable === false);

    const visibleRoles = roles.filter((r) => overlaps(r.startDate, r.endDate, winStart, winEnd));

    // For totals, compute against the visible roles within the window
    const { avgPct, maxPct } = computeUtilizationByWeek(
      weeks,
      visibleRoles.map((r) => ({
        startDate: r.startDate ? new Date(r.startDate) : null,
        endDate: r.endDate ? new Date(r.endDate) : null,
        allocationPct: r.allocationPct ?? 0,
      })),
      winStart,
      winEnd
    );

    return { ...p, visibleRoles, totalAvgPct: avgPct, totalMaxPct: maxPct };
  });

  const hasAnyone = people.length > 0;

  // Grid column helper (now we add a rightmost "Total" column)
  const GRID_FIRST_COL = '16rem';
  const GRID_COL_WIDTH = zoom === 'month' ? 'minmax(7rem, 1fr)' : 'minmax(6rem, 1fr)';
  const GRID_TOTAL_COL = '8rem';
  const gridColumns =
    zoom === 'month'
      ? `${GRID_FIRST_COL} repeat(${months.length}, ${GRID_COL_WIDTH}) ${GRID_TOTAL_COL}`
      : `${GRID_FIRST_COL} repeat(${weeks.length}, ${GRID_COL_WIDTH}) ${GRID_TOTAL_COL}`;

  return (
    <main className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assignments Calendar</h1>
        <div className="flex items-center gap-3">
          <a href="/projects" className="text-blue-600 hover:underline">Projects</a>
          <a href="/people" className="text-blue-600 hover:underline">People</a>
        </div>
      </header>

      {/* Filters (with Zoom) */}
      <form method="GET" className="rounded-lg bg-white p-4 shadow-sm border border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Client</label>
            <select name="client" defaultValue={clientFilter ?? ''} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm">
              <option value="">All</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">Project</label>
            <select name="project" defaultValue={projectFilter ?? ''} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm">
              <option value="">All</option>
              {projects
                .filter((p) => !clientFilter || p.clientId === clientFilter)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">Person</label>
            <select name="person" defaultValue={personFilter ?? ''} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm">
              <option value="">All</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{personName(p)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">Billable</label>
            <select name="billable" defaultValue={billableFilter} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm">
              <option value="all">All</option>
              <option value="billable">Billable</option>
              <option value="nonbillable">Non-billable</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">Zoom</label>
            <select name="zoom" defaultValue={zoom} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm">
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm">Apply</button>
            <a href="/calendar" className="rounded-md bg-neutral-100 px-3 py-2 text-sm border border-neutral-300">Reset</a>
          </div>
        </div>
      </form>

      {/* Legend */}
      <div className="text-xs text-neutral-600">
        <span className="inline-flex items-center gap-1 mr-4">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Allocation ≤ 100%
        </span>
        <span className="inline-flex items-center gap-1 mr-4">
          <span className="inline-block w-3 h-3 rounded bg-rose-500" /> Overbooked (weekly peak &gt; 100%)
        </span>
      </div>

      {!hasAnyone ? (
        <p className="text-neutral-600">
          No people found for tenant <code>{TENANT}</code>. Try syncing from Harvest or seeding dev data.
        </p>
      ) : (
        <div className="rounded-lg bg-white shadow-sm border border-neutral-200">
          {/* Header */}
          <div
            className="grid border-b border-neutral-200 text-xs text-neutral-700"
            style={{ gridTemplateColumns: gridColumns }}
          >
            <div className="px-4 py-2 font-medium bg-neutral-50 sticky left-0 z-10">Person</div>
            {zoom === 'month'
              ? months.map((m) => (
                  <div key={monthKey(m)} className="px-2 py-2 bg-neutral-50 text-center font-medium">
                    {fmtMonthLabel(m)}
                  </div>
                ))
              : weeks.map((w, i) => (
                  <div key={`wk-${i}`} className="px-2 py-2 bg-neutral-50 text-center font-medium">
                    {fmtWeekLabel(w)}
                  </div>
                ))}
            <div className="px-2 py-2 bg-neutral-50 text-center font-medium border-l border-neutral-200">
              Total
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-200">
            {filteredRows.map((p) => {
              const name = personName(p);
              const overbooked = p.totalMaxPct > 100;

              return (
                <div
                  key={p.id}
                  className="grid items-stretch"
                  style={{ gridTemplateColumns: gridColumns }}
                >
                  {/* Person cell */}
                  <div className="px-4 py-3 text-sm sticky left-0 bg-white z-10">
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-neutral-500">{p.email ?? '—'}</div>
                    {p.visibleRoles.length === 0 && (
                      <div className="text-xs text-amber-600 mt-1">No assignments in this window</div>
                    )}
                  </div>

                  {/* Background cells (timeline) */}
                  {(zoom === 'month' ? months : weeks).map((d, idx) => (
                    <div
                      key={`${p.id}-${zoom}-${idx}`}
                      className="border-l border-neutral-100 relative"
                    />
                  ))}

                  {/* Bars layer (span only the timeline columns, not the Total column) */}
                  <div className="col-start-2 col-end-[-2] -mt-8 mb-2 px-2">
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns:
                          zoom === 'month'
                            ? `repeat(${months.length}, minmax(7rem, 1fr))`
                            : `repeat(${weeks.length}, minmax(6rem, 1fr))`,
                      }}
                    >
                      {p.visibleRoles.map((r) => {
                        const startRaw = r.startDate ? new Date(r.startDate) : winStart;
                        const endRaw = r.endDate ? new Date(r.endDate) : winEnd;
                        const start = clampDate(startRaw, winStart, winEnd);
                        const end = clampDate(endRaw, winStart, winEnd);

                        let colStart = 1;
                        let span = 1;

                        if (zoom === 'month') {
                          const startIdx = Math.max(0, Math.min(months.length - 1, monthDiff(months[0], start)));
                          const endIdx = Math.max(0, Math.min(months.length - 1, monthDiff(months[0], end)));
                          colStart = startIdx + 1;
                          span = Math.max(1, endIdx - startIdx + 1);
                        } else {
                          const base = weeks[0];
                          const startIdx = Math.max(0, Math.min(weeks.length - 1, weekDiff(base, startOfISOWeek(start))));
                          const endIdx = Math.max(0, Math.min(weeks.length - 1, weekDiff(base, startOfISOWeek(end))));
                          colStart = startIdx + 1;
                          span = Math.max(1, endIdx - startIdx + 1);
                        }

                        const projectLabel = r.project?.name ?? r.project?.harvestName ?? 'Unnamed Project';
                        const rate =
                          r.expectedRateCents != null
                            ? `$${(r.expectedRateCents / 100).toLocaleString()}/h`
                            : '—';

                        const badge =
                          (r.allocationPct ?? 0) >= 100
                            ? 'bg-emerald-600'
                            : (r.allocationPct ?? 0) >= 50
                            ? 'bg-emerald-500'
                            : 'bg-emerald-400';

                        const border = r.billable ? 'ring-1 ring-emerald-700/30' : 'ring-1 ring-amber-600/30';

                        return (
                          <div
                            key={r.id}
                            className={`relative rounded-md ${badge} ${border} text-white px-3 py-2 mr-1 mb-2`}
                            style={{ gridColumn: `${colStart} / span ${span}` }}
                            title={`${projectLabel} • ${r.roleName} • ${r.allocationPct ?? 0}% • ${r.billable ? 'Billable' : 'Non-billable'}`}
                          >
                            <div className="text-xs font-medium truncate">{projectLabel}</div>
                            <div className="text-[11px] opacity-90 truncate">
                              {r.roleName} • {r.allocationPct ?? 0}% • {r.billable ? 'Billable' : 'Non-billable'} • {rate}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total column */}
                  <div className="px-3 py-2 text-sm flex items-center justify-center border-l border-neutral-200">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                        overbooked ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                                   : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                      }`}
                      title={`Avg weekly allocation across window: ${p.totalAvgPct}% • Peak week: ${p.totalMaxPct}%`}
                    >
                      {p.totalAvgPct}% avg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}