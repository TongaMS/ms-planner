import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
export async function GET() {
  const items = await db.person.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
  return Response.json(items);
}
