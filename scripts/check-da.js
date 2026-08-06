const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const buildings = await prisma.building.findMany({
    select: { code: true }
  });
  console.log("Buildings in DB:", buildings.map(b => b.code));
}
main().finally(() => prisma.$disconnect());
