import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const tenant = await db.tenant.upsert({
    where: { id: 'seed-tenant' },
    update: {},
    create: { id: 'seed-tenant', name: 'Making Sense' }
  });

  await db.person.deleteMany({ where: { tenantId: tenant.id }});
  await db.project.deleteMany({ where: { tenantId: tenant.id }});
  await db.client.deleteMany({ where: { tenantId: tenant.id }});

  const [acme, globex, initech] = await Promise.all([
    db.client.create({ data: { tenantId: tenant.id, name: 'Acme Corp' } }),
    db.client.create({ data: { tenantId: tenant.id, name: 'Globex' } }),
    db.client.create({ data: { tenantId: tenant.id, name: 'Initech' } }),
  ]);

  await Promise.all([
    db.project.create({ data: { tenantId: tenant.id, clientId: acme.id, harvestName: 'Website Revamp', isActive: true }}),
    db.project.create({ data: { tenantId: tenant.id, clientId: acme.id, harvestName: 'Design System',   isActive: true }}),
    db.project.create({ data: { tenantId: tenant.id, clientId: globex.id, harvestName: 'Mobile App',     isActive: true }}),
    db.project.create({ data: { tenantId: tenant.id, clientId: globex.id, harvestName: 'Data Platform',  isActive: false }}),
    db.project.create({ data: { tenantId: tenant.id, clientId: initech.id, harvestName: 'Onboarding Portal', isActive: true }}),
  ]);

  const people = [
    ['Ana','Sosa','ana@example.com', ['react','nextjs','ui']],
    ['Luis','García','luis@example.com', ['node','prisma','sql']],
    ['Mia','Lopez','mia@example.com', ['pm','agile','jira']],
  ];
  await Promise.all(people.map(([first,last,email,skills]) =>
    db.person.create({ data: { tenantId: tenant.id, firstName: first, lastName: last, email, skills, weeklyCapacityHours: 40 }})
  ));

  console.log('Seeded (simplified) clients, projects, people!');
}

main().catch((e)=>{ console.error(e); process.exit(1); })
  .finally(async ()=>{ await db.$disconnect(); });
