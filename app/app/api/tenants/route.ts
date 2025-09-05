import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
export async function GET() {
  const items = await db.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json(items);
}
