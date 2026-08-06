const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Looking for building 'DB'...");
  const buildingDB = await prisma.building.findUnique({
    where: { code: 'DB' }
  });

  if (buildingDB) {
    console.log("Deleting building 'DB'...");
    await prisma.building.delete({
      where: { code: 'DB' }
    });
    console.log("Successfully deleted 'DB'.");
  } else {
    console.log("Building 'DB' not found.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
