import { PrismaClient } from '@prisma/client'
import { mockBuildings, mockTenants, mockPayments, mockCashflow } from '../lib/mock-data'

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...')
  
  // Clear existing data
  await prisma.payment.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.cashflow.deleteMany()
  await prisma.building.deleteMany()

  // Insert Buildings
  for (const b of mockBuildings) {
    await prisma.building.create({
      data: {
        id: b.id,
        code: b.code,
        type: b.type,
        rent_price: b.rent_price,
        rent_period: b.rent_period,
      }
    })
  }

  // Insert Tenants
  for (const t of mockTenants) {
    await prisma.tenant.create({
      data: {
        id: t.id,
        name: t.name,
        nik: t.nik,
        phone_1: t.phone_1,
        phone_2: t.phone_2,
        emergency_contact: t.emergency_contact,
        entry_date: new Date(t.entry_date),
        exit_date: t.exit_date ? new Date(t.exit_date) : null,
        status: t.status,
        building_id: t.building_id,
      }
    })
  }

  // Insert Payments
  for (const p of mockPayments) {
    await prisma.payment.create({
      data: {
        id: p.id,
        amount: p.amount,
        transfer_date: new Date(p.transfer_date),
        rent_duration_months: p.rent_duration_months,
        rent_end_date: new Date(p.rent_end_date),
        tenant_id: p.tenant_id,
      }
    })
  }

  // Insert Cashflow
  for (const c of mockCashflow) {
    await prisma.cashflow.create({
      data: {
        id: c.id,
        type: c.type,
        category: c.category,
        transaction_date: new Date(c.transaction_date),
        description: c.description,
        amount: c.amount,
      }
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
