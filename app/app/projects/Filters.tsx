'use client';
import { useRouter, useSearchParams } from 'next/navigation';

type ClientOpt = { id: string; name: string };

export default function Filters({ clients }: { clients: ClientOpt[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const active = sp.get('active') ?? 'active'; // 'active' | 'all'
  const clientId = sp.get('clientId') ?? '';

  function update(param: string, value: string) {
    const params = new URLSearchParams(sp);
    if (value) params.set(param, value); else params.delete(param);
    const q = params.toString();
    router.push(`/projects${q ? `?${q}` : ''}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">Status</div>
        <select
          className="rounded border px-2 py-1"
          value={active}
          onChange={(e) => update('active', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="all">All</option>
        </select>
      </label>

      <label className="text-sm">
        <div className="text-xs text-neutral-600 mb-1">Client</div>
        <select
          className="rounded border px-2 py-1 min-w-[12rem]"
          value={clientId}
          onChange={(e) => update('clientId', e.target.value)}
        >
          <option value="">All clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
