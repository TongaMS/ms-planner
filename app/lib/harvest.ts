const BASE = 'https://api.harvestapp.com/v2';

function authHeaders() {
  const accountId = process.env.HARVEST_ACCOUNT_ID!;
  const token = process.env.HARVEST_TOKEN!;
  if (!accountId || !token) throw new Error('Missing HARVEST_ACCOUNT_ID or HARVEST_TOKEN');
  return {
    'Harvest-Account-Id': accountId,
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'ms-planner/1.0 (codespaces)',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

async function getAll<T>(path: string, updatedSince?: string) {
  let page = 1;
  const out: any[] = [];
  while (true) {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '100');
    if (updatedSince) url.searchParams.set('updated_since', updatedSince);
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`Harvest GET ${path} failed: ${res.status} ${await res.text()}`);
    const json = await res.json() as any;
    const key = Object.keys(json).find(k => Array.isArray(json[k]));
    const items: T[] = key ? json[key] : [];
    out.push(...items);
    if (!json.next_page) break;
    page = Number(json.next_page);
  }
  return out as T[];
}

async function getOne<T>(path: string) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('page', '1');
  url.searchParams.set('per_page', '1');
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Harvest probe ${path} failed: ${res.status} ${await res.text()}`);
  const json = await res.json() as any;
  const key = Object.keys(json).find(k => Array.isArray(json[k]));
  const items: T[] = key ? json[key] : [];
  return { count: items.length, sample: items[0] ?? null };
}

export async function fetchClients(updatedSince?: string) {
  return getAll<{ id: number; name: string }>(`/clients`, updatedSince);
}
export async function fetchProjects(updatedSince?: string) {
  return getAll<{ id: number; name: string; client: { id: number }; is_active: boolean }>(`/projects`, updatedSince);
}
export async function fetchUsers(updatedSince?: string) {
  return getAll<{ id: number; first_name: string; last_name: string; email: string; is_active: boolean }>(`/users`, updatedSince);
}

export const probe = {
  clients: () => getOne<{ id:number; name:string }>(`/clients`),
  projects: () => getOne<{ id:number; name:string }>(`/projects`),
  users: () => getOne<{ id:number; email:string }>(`/users`),
};
