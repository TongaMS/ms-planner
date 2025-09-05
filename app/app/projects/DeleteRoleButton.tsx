// app/projects/[id]/DeleteRoleButton.tsx
'use client';
import { useState } from 'react';

export default function DeleteRoleButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (!confirm('Delete this role? This cannot be undone.')) return;
    setBusy(true);
    const res = await fetch(`/api/roleplans/${id}`, { method: 'DELETE' });
    if (res.ok) {
      // simple approach: reload the page so server re-queries the list
      location.reload();
    } else {
      const t = await res.text();
      alert(`Failed to delete: ${t}`);
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="text-red-600 hover:underline disabled:opacity-60"
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}