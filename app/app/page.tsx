export default function Home() {
  return (
    <main className="p-8 space-y-3">
      <h1 className="text-2xl font-semibold">MS Staffing ✅</h1>
      <a className="underline text-blue-600" href="/api/health">Health check</a>
      <a className="underline text-blue-600 block" href="/api/tenants">Tenants API</a>
      <a className="underline text-blue-600 block" href="/projects">Projects</a>
    </main>
  );
}
