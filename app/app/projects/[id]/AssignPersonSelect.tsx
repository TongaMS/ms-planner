'use client';

import { useEffect, useState } from 'react';

type Person = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export default function AssignPersonSelect({
  roleId,
  initialPersonId,
}: {
  roleId: string;
  initialPersonId: string | null;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [value, setValue] = useState<string>(initialPersonId ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/people?tenant=harvest-default-tenant', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load people');
        const data = await res.json();
        if (mounted) setPeople(data.items ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const label = (p: Person) =>
    [p.firstName ?? '', p.lastName ?? ''].join(' ').trim() || p.email || '(no name)';

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newVal = e.target.value;
    setValue(newVal);
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/roleplans/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedPersonId: newVal || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg('Saved ✓');
    } catch (err: any) {
      setMsg(`Error: ${err?.message || 'failed'}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 1500);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={onChange}
        disabled={busy}
        className="min-w-48 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
      >
        <option value="">— Unassigned —</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {label(p)}
          </option>
        ))}
      </select>
      {msg && <span className="text-xs text-neutral-600">{msg}</span>}
    </div>
  );
}