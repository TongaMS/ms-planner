export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenant = searchParams.get('tenant') ?? 'harvest-default-tenant';

  const items = await db.person.findMany({
    where: { tenantId: tenant },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return NextResponse.json({ items });
}