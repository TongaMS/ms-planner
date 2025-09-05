export const runtime = 'nodejs';

import { db } from '@/lib/db';
export async function GET() {
  const items = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { client: true },
  });
  return Response.json(items);
}
