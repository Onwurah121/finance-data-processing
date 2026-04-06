import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Permission codes ────────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  // Users
  'user_create',
  'user_read',
  'user_update',
  'user_delete',
  // Permissions
  'manage_permissions',
  'view_permissions',
  // Transactions
  'transaction_create',
  'transaction_read',
  'transaction_update',
  'transaction_delete',
  // Categories
  'category_create',
  'category_read',
  'category_update',
  'category_delete',
  // Dashboard
  'dashboard_read',
] as const;

// ─── Role → permission mapping ───────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [...ALL_PERMISSIONS],
  analyst: [
    'user_read',
    'view_permissions',
    'transaction_read',
    'category_create',
    'category_read',
    'category_update',
    'dashboard_read',
  ],
  viewer: ['user_read', 'view_permissions', 'dashboard_read'],
};

// ─── Seed admin user ─────────────────────────────────────────────────────────

const ADMIN_USER = {
  email: 'admin@zorvyn.io',
  fullName: 'System Administrator',
  password: 'Admin@123',
};

async function main() {
  console.log('Seeding database…');

  // 1. Upsert all permissions
  for (const code of ALL_PERMISSIONS) {
    await prisma.permissions.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
  console.log(`✔  ${ALL_PERMISSIONS.length} permissions upserted`);

  // 2. Upsert roles and assign permissions
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const code of permCodes) {
      const permission = await prisma.permissions.findUnique({
        where: { code },
      });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }

    console.log(
      `✔  Role "${roleName}" upserted with ${permCodes.length} permissions`,
    );
  }

  // 3. Create admin user
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_USER.email },
    update: {},
    create: {
      email: ADMIN_USER.email,
      fullName: ADMIN_USER.fullName,
      password: hashedPassword,
      roleId: adminRole!.id,
    },
  });

  console.log(`✔  Admin user "${user.email}" seeded with role "admin"`);
  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
