'use client';
import { useState } from 'react';

export default function SyncButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|undefined>();

  async function doSync(full: boolean) {
    setBusy(true);
    setMsg(undefined);
    const url = full ? '/api/harvest/import?full=1' : '/api/harvest/import';
    const res = await fetch(url, { method: 'POST' });
    let text = '';
    try { text = await res.text(); } catch {}
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }

    const counts =
      json?.summary?.afterCounts
        ? json.summary.afterCounts
        : json?.imported; // older version

    if (res.ok) {
      const fetched =
        (json?.steps?.reduce?.((sum: number, s: any) => sum + (s.fetched || 0), 0)) ??
        0;

      setMsg(
        `Imported ${fetched} items` +
        (counts ? ` • Totals — clients: ${counts.clients ?? '-'}, projects: ${counts.projects ?? '-'}, people: ${counts.people ?? '-'}` : '')
      );
      // reload only if something changed
      if (fetched > 0) window.location.reload();
    } else {
      setMsg(`Error ${res.status}: ${json?.detail ?? res.statusText}`);
    }
    setBusy(false);
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        onClick={(e) => doSync(e.altKey || e.metaKey)}
        disabled={busy}
        title="Click to sync changes from Harvest. Hold Alt/Option (or ⌘) for a full sync."
        className="rounded bg-emerald-600 text-white px-3 py-2 disabled:opacity-60"
      >
        {busy ? 'Syncing…' : 'Sync Harvest'}
      </button>
      <span className="text-xs text-neutral-500">
        Tip: hold <kbd className="border px-1 rounded">Alt</kbd> for full sync
      </span>
      {msg && <p className="text-sm text-neutral-700">{msg}</p>}
    </div>
  );
}
