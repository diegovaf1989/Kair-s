import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  await db.carreira.upsert({
    where: { slug: "prf" },
    update: {},
    create: { nome: "Polícia Rodoviária Federal", slug: "prf" },
  });
  await db.carreira.upsert({
    where: { slug: "pcdf" },
    update: {},
    create: { nome: "Polícia Civil do DF", slug: "pcdf" },
  });
  await db.carreira.upsert({
    where: { slug: "tjdft" },
    update: {},
    create: { nome: "Tribunal de Justiça do DF e Territórios", slug: "tjdft" },
  });
  console.log("Seed completed: 3 carreiras inserted");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
