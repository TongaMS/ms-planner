// app/projects/[id]/AddRoleForm.tsx
'use client';

import { useState } from 'react';

export default function AddRoleForm({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    roleName: '',
    allocationPct: 100,
    startDate: '',
    endDate: '',
    billable: 'yes' as 'yes' | 'no',
    expectedRateCents: '' as string | number,
    notes: '',
  });

  function update<K extends keyof typeof form>(k: K, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function validate() {
    if (!form.roleName.trim()) {
      return 'Role name is required';
    }
    const pct = Number(form.allocationPct);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return 'Allocation must be between 0 and 100';
    }
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate).getTime();
      const e = new Date(form.endDate).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
        return 'End date cannot be before start date';
      }
    }
    if (form.expectedRateCents !== '' && Number(form.expectedRateCents) < 0) {
      return 'Expected rate must be ≥ 0';
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const err = validate();
    if (err) {
      setMsg({ type: 'err', text: err });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        projectId,
        roleName: form.roleName.trim(),
        allocationPct: Number(form.allocationPct),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        billable: form.billable === 'yes',
        expectedRateCents:
          form.expectedRateCents === '' ? null : Number(form.expectedRateCents),
        notes: form.notes || undefined,
      };

      const res = await fetch('/api/roleplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to create role');
      }

      setMsg({ type: 'ok', text: 'Role added ✓' });
      // quick refresh to re-fetch server-rendered list
      window.location.reload();
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Something went wrong' });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-200 p-4 space-y-3">
      <h3 className="font-medium">Add role</h3>

      {msg && (
        <div
          className={`text-sm rounded-md px-3 py-2 ${
            msg.type === 'ok'
              ? 'bg-green-50 text-green-700 ring-1 ring-green-600/15'
              : 'bg-red-50 text-red-700 ring-1 ring-red-600/15'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Role name */}
        <label className="text-sm">
          <div className="text-xs text-neutral-600 mb-1">Role name *</div>
          <input
            required
            value={form.roleName}
            onChange={(e) => update('roleName', e.target.value)}
            placeholder="e.g. Frontend Developer"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        {/* Allocation */}
        <label className="text-sm">
          <div className="text-xs text-neutral-600 mb-1">% allocation</div>
          <input
            type="number"
            min={0}
            max={100}
            value={form.allocationPct}
            onChange={(e) => update('allocationPct', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        {/* Start date */}
        <label className="text-sm">
          <div className="text-xs text-neutral-600 mb-1">Start date</div>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        {/* End date */}
        <label className="text-sm">
          <div className="text-xs text-neutral-600 mb-1">End date</div>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        {/* Billable */}
        <label className="text-sm">
          <div className="text-xs text-neutral-600 mb-1">Billable</div>
          <select
            value={form.billable}
            onChange={(e) => update('billable', e.target.value as 'yes' | 'no')}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>

        {/* Rate */}
        <label className="text-sm">
          <div className="text-xs text-neutral-600 mb-1">Expected rate (cents/hour)</div>
          <input
            type="number"
            min={0}
            placeholder="e.g. 12000 → $120/h"
            value={form.expectedRateCents}
            onChange={(e) => update('expectedRateCents', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>
      </div>

      {/* Notes */}
      <label className="text-sm block">
        <div className="text-xs text-neutral-600 mb-1">Notes</div>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:opacity-60"
        >
          {busy ? 'Adding…' : 'Add role'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setForm({
              roleName: '',
              allocationPct: 100,
              startDate: '',
              endDate: '',
              billable: 'yes',
              expectedRateCents: '',
              notes: '',
            });
            setMsg(null);
          }}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          Reset
        </button>
      </div>
    </form>
  );
}