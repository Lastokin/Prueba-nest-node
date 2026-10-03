import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

function requireEnvironmentVariable(name: string, minimumLength = 1): string {
  const value = process.env[name];

  if (!value || value.length < minimumLength) {
    throw new Error(
      `${name} must be set to a value of at least ${minimumLength} characters before seeding.`,
    );
  }

  return value;
}

const databaseUrl = requireEnvironmentVariable("DATABASE_URL");
const adminPassword = requireEnvironmentVariable("SEED_ADMIN_PASSWORD", 12);

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { name: "Tenant de ejemplo" },
    update: {},
    create: { name: "Tenant de ejemplo" },
  });

  const password = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrador de ejemplo",
      password,
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });

  console.log("Seed completado: tenant y usuario de ejemplo creados o existentes.");
}

main()
  .catch((error: unknown) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });