const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.tenant.findMany({ select: { status: true } });
  console.log([...new Set(data.map(d => d.status))]);
}
main().finally(() => prisma.$disconnect());
