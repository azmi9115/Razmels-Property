const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDueDates() {
  console.log("Fixing all payment rent_end_dates to perfectly align with tenant's entry_date...");
  
  const tenants = await prisma.tenant.findMany({
    include: { payments: { orderBy: { transfer_date: 'asc' } } }
  });

  let updatedCount = 0;

  for (const tenant of tenants) {
    const entryDate = new Date(tenant.entry_date);
    let totalMonthsAdded = 0;

    for (const payment of tenant.payments) {
      totalMonthsAdded += payment.rent_duration_months;
      
      const newEndDate = new Date(entryDate.getTime());
      const targetMonth = newEndDate.getMonth() + totalMonthsAdded;
      const intendedMonth = targetMonth % 12;
      
      newEndDate.setMonth(targetMonth);
      
      // Fix rollover (e.g., Jan 31 -> Feb 31 rolls into March)
      // If the resulting month is different from the intended month, we rolled over.
      // JS Date getMonth() is 0-indexed, so 13 % 12 = 1 (Feb).
      if (newEndDate.getMonth() !== (intendedMonth < 0 ? 12 + intendedMonth : intendedMonth)) {
        newEndDate.setDate(0); // clamp to last day of previous month
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { rent_end_date: newEndDate }
      });
      
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} payments!`);
}

fixDueDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
