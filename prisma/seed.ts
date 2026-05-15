import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seed completed (no data for Phase 0)");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
