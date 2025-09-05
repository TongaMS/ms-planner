// app/projects/SyncButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function syncNow() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/harvest/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      setMsg('Synced ✓');
      router.refresh(); // re-fetch server component data
    } catch (e: any) {
      setMsg(`Sync failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={syncNow}
        disabled={busy}
        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:opacity-60"
      >
        {busy ? 'Syncing…' : 'Sync from Harvest'}
      </button>
      {msg && (
        <span
          className={`text-sm ${
            msg.startsWith('Sync failed') ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {msg}
        </span>
      )}
    </div>
  );
}