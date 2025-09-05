'use client';
import { useState } from 'react';

type RolePlan = {
  id: string;
  roleName: string;
  startDate: string | null;
  endDate: string | null;
  allocationPct: number;
  billable: boolean;
  expectedRateCents: number | null;
  notes: string | null;
};

function toDateValue(d: string | null) {
  if (!d) return '';
  // Normalize to yyyy-mm-dd if ISO string
  const dt = new Date(d);
  if (isNaN(+dt)) return d; // assume already yyyy-mm-dd
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function EditRoleInline({ role }: { role: RolePlan }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    roleName: role.roleName ?? '',
    startDate: toDateValue(role.startDate),
    endDate: toDateValue(role.endDate),
    allocationPct: role.allocationPct ?? 100,
    billable: role.billable ?? true,
    expectedRateCents: role.expectedRateCents ?? 0,
    notes: role.notes ?? '',
  });

  function update<K extends keyof typeof form>(k: K, v: any) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      roleName: form.roleName.trim(),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      allocationPct: Number(form.allocationPct),
      billable: Boolean(form.billable),
      expectedRateCents: form.expectedRateCents === null ? null : Number(form.expectedRateCents),
      notes: form.notes || null,
    };
    const res = await fetch(`/api/roleplans/${role.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setOpen(false);
      location.reload();
    } else {
      const t = await res.text();
      alert(`Update failed: ${t}`);
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <button className="text-blue-700 hover:underline" onClick={() => setOpen(true)}>
        Edit
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-2 bg-neutral-50 border rounded p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">Role name</div>
        <input value={form.roleName} onChange={(e)=>update('roleName', e.target.value)}
          className="w-full border rounded px-2 py-1" required />
      </label>

      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">% allocation</div>
        <input type="number" min={0} max={100} value={form.allocationPct}
          onChange={(e)=>update('allocationPct', e.target.value)}
          className="w-full border rounded px-2 py-1" />
      </label>

      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">Start date</div>
        <input type="date" value={form.startDate}
          onChange={(e)=>update('startDate', e.target.value)}
          className="w-full border rounded px-2 py-1" />
      </label>

      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">End date</div>
        <input type="date" value={form.endDate}
          onChange={(e)=>update('endDate', e.target.value)}
          className="w-full border rounded px-2 py-1" />
      </label>

      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">Billable</div>
        <select value={form.billable ? 'yes' : 'no'}
          onChange={(e)=>update('billable', e.target.value === 'yes')}
          className="w-full border rounded px-2 py-1">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>

      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">Expected rate (cents/hour)</div>
        <input type="number" min={0} value={form.expectedRateCents ?? 0}
          onChange={(e)=>update('expectedRateCents', e.target.value)}
          className="w-full border rounded px-2 py-1" />
      </label>

      <label className="text-sm sm:col-span-2">
        <div className="text-xs text-neutral-600 mb-1">Notes</div>
        <textarea value={form.notes ?? ''} onChange={(e)=>update('notes', e.target.value)}
          className="w-full border rounded px-2 py-1" rows={2} />
      </label>

      <div className="sm:col-span-2 flex items-center gap-2">
        <button disabled={busy} className="rounded bg-blue-600 text-white px-3 py-2 disabled:opacity-60">
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="text-neutral-600 hover:underline" onClick={()=>setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
