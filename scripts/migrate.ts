import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function readJson(filename: string) {
  const filepath = path.join(process.cwd(), 'prisma/seed-data', filename)
  const raw = fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '')
  return JSON.parse(raw)
}

function parseCurrency(str: string) {
  if (!str) return 0
  const cleaned = str.replace(/,/g, '').replace(/[^\d.-]/g, '')
  return Math.round(parseFloat(cleaned)) || 0
}

function parseDateStr(str: string) {
  if (!str || str.includes('#')) return null
  
  // Hardcoded fix for a specific typo in the user's Excel file
  if (str === '11/1/0/25') str = '11/10/2025'
  
  // Format from Excel is M/D/YYYY (e.g., 9/30/2022)
  const d = new Date(str)
  if (isNaN(d.getTime())) return null
  return d
}

async function main() {
  console.log("Reading JSON files...")
  const tenantsData = readJson('tenants.json').slice(1) // skip header row
  const cashflowData = readJson('cashflow.json')
  const paymentsData = readJson('payments.json').slice(1) // skip header row

  console.log("Clearing old data...")
  await prisma.payment.deleteMany()
  await prisma.cashflow.deleteMany()
  await prisma.roomHistory.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.building.deleteMany()

  console.log("Migrating Buildings and Tenants...")
  // Extract all unique building codes
  const buildingCodes = new Set<string>()
  tenantsData.forEach((t: any) => {
    if (t.Column_2) buildingCodes.add(t.Column_2.trim())
    if (t.Column_3) buildingCodes.add(t.Column_3.trim())
  })
  paymentsData.forEach((p: any) => {
    if (p.Column_4) buildingCodes.add(p.Column_4.trim())
  })
  
  // Create buildings
  for (const code of buildingCodes) {
    if (!code) continue;
    let type = "Kamar"
    let rentPrice = 750000
    if (code.startsWith("DA") || code.startsWith("DB")) {
      type = "Kios"
      rentPrice = 3000000 // roughly based on kios prices
    }
    await prisma.building.create({
      data: {
        code,
        type,
        rent_price: rentPrice,
        rent_period: "Bulanan",
      }
    })
  }

  // Create Tenants
  console.log(`Inserting ${tenantsData.length} tenants...`)
  const tenantMap = new Map<string, string>() // name -> id

  for (const t of tenantsData) {
    const name = t.Column_1?.trim()
    if (!name) continue

    const currentRoomCode = t.Column_2?.trim()
    const prevRoomCode = t.Column_3?.trim()
    const nik = t.Column_4?.trim() || "0"
    const contact1 = t.Column_5?.trim() || "-"
    const contact2 = t.Column_6?.trim() || null
    const emergency = t.Column_7?.trim() || null
    const entryDateStr = t.Column_8?.trim()
    const exitDateStr = t.Column_9?.trim()
    const statusStr = t.Column_12?.trim() // Active/Deactive

    let status = "Active"
    if (statusStr?.toLowerCase() === "deactive") status = "Inactive"
    
    let entryDate = parseDateStr(entryDateStr) || new Date()
    let exitDate = parseDateStr(exitDateStr)

    // Find building ID
    let buildingId = null
    if (currentRoomCode) {
      const b = await prisma.building.findUnique({ where: { code: currentRoomCode } })
      if (b) {
        buildingId = b.id
      }
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        nik,
        phone_1: contact1,
        phone_2: contact2,
        emergency_contact: emergency,
        entry_date: entryDate,
        exit_date: exitDate,
        status,
        building_id: buildingId,
        id_card_url: null,
      }
    })
    tenantMap.set(name.toLowerCase(), tenant.id)

    // Create Room History if prevRoomCode exists
    if (prevRoomCode) {
      const bPrev = await prisma.building.findUnique({ where: { code: prevRoomCode } })
      if (bPrev) {
        await prisma.roomHistory.create({
          data: {
            tenant_id: tenant.id,
            building_id: bPrev.id,
            moved_in: new Date(2020, 0, 1), // dummy date for history if unknown
            moved_out: entryDate, // exited when entered current room
            notes: "Migrasi dari Excel (Kode Bangunan 3)"
          }
        })
      }
    }
  }

  console.log(`Inserting ${paymentsData.length} payments...`)
  for (const p of paymentsData) {
    const tenantName = p.Column_2?.trim()
    const amountStr = p.Column_5?.trim()
    const tglTransfer = p.Column_6?.trim()
    const duration = parseInt(p.Column_7 || "1", 10) || 1
    const akhirSewa = p.Column_9?.trim()

    if (!tenantName || !amountStr || !tglTransfer) continue

    const tenantId = tenantMap.get(tenantName.toLowerCase())
    if (!tenantId) {
      console.warn(`Tenant not found for payment: ${tenantName}`)
      continue
    }

    const transferDate = parseDateStr(tglTransfer)
    const endDate = parseDateStr(akhirSewa)
    if (!transferDate) continue

    await prisma.payment.create({
      data: {
        tenant_id: tenantId,
        amount: parseCurrency(amountStr),
        transfer_date: transferDate,
        rent_duration_months: duration,
        rent_end_date: endDate || new Date(transferDate.getTime() + duration * 30 * 24 * 60 * 60 * 1000)
      }
    })
  }

  console.log(`Inserting ${cashflowData.length} cashflows...`)
  for (const c of cashflowData) {
    // Skip rows that don't have actual transaction data (e.g. pre-filled ID rows)
    if (!c.Tanggal || !c.Jumlah) continue;

    const tipe = c.Tipe?.trim() === "Kredit" ? "Pemasukan" : "Pengeluaran"
    const jenis = c.Jenis?.trim() || "Lain-lain"
    let tgl = parseDateStr(c.Tanggal) || new Date()
    const deskripsi = c.Deskripsi?.trim() || "-"
    const jumlah = Math.abs(parseCurrency(c.Jumlah))

    // For dates that are ##########, use today or ignore? Excel format issue.
    // parseDateStr handles '#' by returning null. We fallback to new Date() but we could distribute them?
    // Let's keep new Date().

    await prisma.cashflow.create({
      data: {
        type: tipe,
        category: jenis,
        amount: jumlah,
        transaction_date: tgl,
        description: deskripsi
      }
    })
  }

  console.log("Migration finished successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
