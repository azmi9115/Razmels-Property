const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.cashflow.count();
  const latest = await prisma.cashflow.findMany({
    orderBy: { transaction_date: 'desc' },
    take: 5
  });
  console.log('Total Cashflow Rows:', count);
  console.log('Latest 5 Transactions:');
  console.dir(latest, { depth: null });
}

main().finally(() => prisma.$disconnect());
