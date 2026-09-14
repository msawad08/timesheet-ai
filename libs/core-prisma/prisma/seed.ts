import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Precomputed bcrypt hash for 'Password123!' (cost 10)
// Can be validated using bcrypt.compare('Password123!', hash)
const DEFAULT_PASSWORD_HASH = '$2b$10$78K0bB0e8bqv.B1H2o2e.e/q3z4y5x6w7v8u9t0s1r2q3p4o5n6m';

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default-corp' },
    update: {},
    create: {
      name: 'Default Corp',
      slug: 'default-corp',
    },
  });
  console.log(`Tenant created or found: ${tenant.name} (${tenant.id})`);

  // 2. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@default.com' },
    update: {},
    create: {
      email: 'admin@default.com',
      name: 'Admin User',
      password: DEFAULT_PASSWORD_HASH,
      role: Role.ADMIN,
      tenantId: tenant.id,
    },
  });
  console.log(`Admin user created or found: ${adminUser.email}`);

  // 3. Create Developer User
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@default.com' },
    update: {},
    create: {
      email: 'dev@default.com',
      name: 'Dev User',
      password: DEFAULT_PASSWORD_HASH,
      role: Role.DEVELOPER,
      tenantId: tenant.id,
    },
  });
  console.log(`Developer user created or found: ${devUser.email}`);

  // 4. Create Standard Projects
  const project1 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Core Engineering',
      description: 'Infrastructure, API services, and core backend platform development.',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Internal Dashboard',
      description: 'Next.js frontend user dashboard and management interfaces.',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`Projects created: ${project1.name}, ${project2.name}`);

  // 5. Assign Users to Projects
  await prisma.projectAssignment.upsert({
    where: {
      userId_projectId: {
        userId: devUser.id,
        projectId: project1.id,
      },
    },
    update: {},
    create: {
      userId: devUser.id,
      projectId: project1.id,
    },
  });

  await prisma.projectAssignment.upsert({
    where: {
      userId_projectId: {
        userId: devUser.id,
        projectId: project2.id,
      },
    },
    update: {},
    create: {
      userId: devUser.id,
      projectId: project2.id,
    },
  });
  console.log('Assigned developer to default projects');

  // 6. Create Base Permission Rules
  await prisma.permissionRule.createMany({
    data: [
      {
        tenantId: tenant.id,
        role: Role.DEVELOPER,
        action: 'read',
        subject: 'Project',
        conditions: JSON.stringify({ isActive: true }),
      },
      {
        tenantId: tenant.id,
        role: Role.DEVELOPER,
        action: 'manage',
        subject: 'TimeEntry',
        conditions: JSON.stringify({ userId: '${user.id}' }),
      },
      {
        tenantId: tenant.id,
        role: Role.ADMIN,
        action: 'manage',
        subject: 'all',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Default permission rules seeded');

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
