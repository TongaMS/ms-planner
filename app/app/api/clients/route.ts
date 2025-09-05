import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
export async function GET() {
  const items = await db.client.findMany({ orderBy: { name: 'asc' } });
  return Response.json(items);
}
