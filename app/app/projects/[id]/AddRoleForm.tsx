'use client';
import { useState } from 'react';

export default function AddRoleForm({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|undefined>();
  const [form, setForm] = useState({
    roleName: '',
    startDate: '',
    endDate: '',
    allocationPct: 100,
    billable: true,
    expectedRateCents: '' as string | number,
    notes: '',
  });

  function update<K extends keyof typeof form>(key: K, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(undefined);
    const payload = {
      projectId,
      roleName: form.roleName.trim(),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      allocationPct: Number(form.allocationPct),
      billable: Boolean(form.billable),
      expectedRateCents: form.expectedRateCents === '' ? null : Number(form.expectedRateCents),
      notes: form.notes || undefined,
    };
    const res = await fetch('/api/roleplans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMsg('Role added ✓');
      window.location.reload();
    } else {
      const t = await res.text();
      setMsg(`Error: ${t}`);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-white p-4 shadow-sm space-y-3">
      <h3 className="font-medium">Add role</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          <div className="text-xs text-neutral-600 mb-1">Role name *</div>
          <input required value={form.roleName}
            onChange={(e)=>update('roleName', e.target.value)}
            className="w-full border rounded px-2 py-1" placeholder="e.g. Frontend Dev" />
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
          <input type="number" min={0} value={form.expectedRateCents}
            onChange={(e)=>update('expectedRateCents', e.target.value)}
            className="w-full border rounded px-2 py-1" placeholder="e.g. 12000" />
        </label>
      </div>

      <label className="text-sm block">
        <div className="text-xs text-neutral-600 mb-1">Notes</div>
        <textarea value={form.notes}
          onChange={(e)=>update('notes', e.target.value)}
          className="w-full border rounded px-2 py-1" rows={2} />
      </label>

      <button
        disabled={busy}
        className="rounded bg-blue-600 text-white px-3 py-2 disabled:opacity-60"
      >
        {busy ? 'Adding…' : 'Add role'}
      </button>
      {msg && <p className="text-sm text-neutral-700 mt-2">{msg}</p>}
    </form>
  );
}
