const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

function excelToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  // Excel uses 1900 epoch, but mistakenly treats 1900 as leap year.
  // The magic number 25569 is the difference in days between 1900-01-01 and 1970-01-01.
  const unixTimestamp = (serial - 25569) * 86400 * 1000;
  // We use UTC to avoid timezone shifts when doing setHours(0) later
  const date = new Date(unixTimestamp);
  
  // Offset by local timezone to ensure date is correct in local time
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() + offset);
}

async function main() {
  console.log("Starting Migration from database juli/Master Data Kontrakan (1).xlsm ...");
  
  const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
  const workbook = XLSX.readFile(filePath);

  console.log("Wiping current database...");
  await prisma.payment.deleteMany();
  await prisma.cashflow.deleteMany();
  await prisma.roomHistory.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.building.deleteMany();

  // 1. Daftar Penghuni
  console.log("Migrating Tenants and Buildings...");
  const tenantsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Daftar Penghuni'], { header: 1 });
  
  const buildingCodes = new Set();
  const buildingPrices = new Map();
  const tenantRows = [];
  
  for (let i = 1; i < tenantsRaw.length; i++) {
    const row = tenantsRaw[i];
    if (!row[0]) continue; // Nama is empty
    
    const nama = row[0].toString().trim();
    const curRoom = row[1] ? row[1].toString().trim() : null;
    const prevRoom = row[2] ? row[2].toString().trim() : null;
    const biayaSewa = parseFloat(row[10]) || 750000;

    if (curRoom) {
      buildingCodes.add(curRoom);
      buildingPrices.set(curRoom, biayaSewa);
    }
    if (prevRoom) {
      buildingCodes.add(prevRoom);
    }
    
    tenantRows.push({
      name: nama,
      curRoom,
      prevRoom,
      nik: row[3] ? row[3].toString().trim() : "0",
      contact1: row[4] ? row[4].toString().trim() : "-",
      contact2: row[5] ? row[5].toString().trim() : null,
      emergency: row[6] ? row[6].toString().trim() : null,
      entryDate: excelToDate(row[7]),
      exitDate: excelToDate(row[8]),
      statusStr: row[11] ? row[11].toString().trim() : "Active"
    });
  }

  // Also scan Pembayaran Sewa for buildings
  const paymentsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Pembayaran Sewa'], { header: 1 });
  for (let i = 5; i < paymentsRaw.length; i++) {
    const row = paymentsRaw[i];
    if (row[3]) buildingCodes.add(row[3].toString().trim());
  }

  // Insert Buildings
  for (const code of buildingCodes) {
    if (!code) continue;
    let type = "Kamar";
    let rentPrice = buildingPrices.get(code) || 750000;
    
    if (code.startsWith("DA") || code.startsWith("DB")) {
      type = "Kios";
      // If we couldn't find a price in Daftar Penghuni, default to 800k for split kiosks
      if (!buildingPrices.has(code)) {
         rentPrice = code === "DB" ? 3000000 : 800000;
      }
    }
    await prisma.building.create({
      data: { code, type, rent_price: rentPrice, rent_period: "Bulanan" }
    });
  }

  const tenantMap = new Map(); // name -> ID

  // Insert Tenants
  for (const t of tenantRows) {
    let status = t.statusStr.toLowerCase() === "deactive" ? "Inactive" : "Active";
    
    let buildingId = null;
    if (t.curRoom) {
      const b = await prisma.building.findUnique({ where: { code: t.curRoom } });
      if (b) buildingId = b.id;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: t.name,
        nik: t.nik,
        phone_1: t.contact1,
        phone_2: t.contact2,
        emergency_contact: t.emergency,
        entry_date: t.entryDate || new Date(),
        exit_date: t.exitDate,
        status,
        building_id: buildingId,
      }
    });
    
    tenantMap.set(t.name.toLowerCase(), tenant);

    if (t.prevRoom) {
      const bPrev = await prisma.building.findUnique({ where: { code: t.prevRoom } });
      if (bPrev) {
        await prisma.roomHistory.create({
          data: {
            tenant_id: tenant.id,
            building_id: bPrev.id,
            moved_in: new Date(2020, 0, 1),
            moved_out: t.entryDate || new Date(),
            notes: "Migrasi dari Excel (Pindah Kamar)"
          }
        });
      }
    }
  }

  // 2. Pembayaran Sewa
  console.log("Migrating Payments...");
  // Structure: [null,"Nama Penghuni","ID","Kode Bangunan","Nominal","Tgl. Transfer","Masa Sewa1","Masa Sewa","Akhir Sewa"]
  for (let i = 5; i < paymentsRaw.length; i++) {
    const row = paymentsRaw[i];
    const tenantName = row[1] ? row[1].toString().trim() : null;
    if (!tenantName) continue;
    
    const tenant = tenantMap.get(tenantName.toLowerCase());
    if (!tenant) {
      console.warn(`Warning: Tenant not found for payment: ${tenantName}`);
      continue;
    }

    const nominal = parseFloat(row[4]) || 0;
    const transferDate = excelToDate(row[5]);
    const duration = parseInt(row[6]) || 1;
    
    if (!transferDate) continue;

    // Use Excel's explicit Akhir Sewa for the Month and Year,
    // but force the Day to match the tenant's entry_date.
    const excelAkhirSewa = excelToDate(row[8]);
    let newEndDate = null;

    if (excelAkhirSewa) {
      const entryDay = tenant.entry_date.getDate();
      const targetYear = excelAkhirSewa.getFullYear();
      const targetMonth = excelAkhirSewa.getMonth();
      
      newEndDate = new Date(targetYear, targetMonth, entryDay);
      // Clamp day if rolled over (e.g. 31st on a 30-day month)
      if (newEndDate.getMonth() !== targetMonth) {
        newEndDate.setDate(0);
      }
      newEndDate.setHours(0, 0, 0, 0);
    } else {
      const previousPayments = await prisma.payment.findMany({
        where: { tenant_id: tenant.id }
      });
      
      let totalMonthsAdded = 0;
      for (const p of previousPayments) {
        totalMonthsAdded += p.rent_duration_months;
      }
      
      totalMonthsAdded += duration; // include this payment
      
      const baseEntry = new Date(tenant.entry_date.getTime());
      const targetMonth = baseEntry.getMonth() + totalMonthsAdded;
      const intendedMonth = targetMonth % 12;
      
      newEndDate = new Date(baseEntry.getTime());
      newEndDate.setMonth(targetMonth);
      if (newEndDate.getMonth() !== (intendedMonth < 0 ? 12 + intendedMonth : intendedMonth)) {
        newEndDate.setDate(0);
      }
    }

    await prisma.payment.create({
      data: {
        tenant_id: tenant.id,
        amount: nominal,
        transfer_date: transferDate,
        rent_duration_months: duration,
        rent_end_date: newEndDate
      }
    });
  }

  // 3. CashFlow
  console.log("Migrating Cashflow...");
  const cashflowRaw = XLSX.utils.sheet_to_json(workbook.Sheets['CashFlow'], { header: 1 });
  // Structure: ["No","Tipe","Jenis","Tanggal","Deskripsi","Jumlah"] at row 5 (index 5), so data starts at index 6
  for (let i = 6; i < cashflowRaw.length; i++) {
    const row = cashflowRaw[i];
    if (!row[3] || !row[5]) continue; // missing date or amount

    const tipeStr = row[1] ? row[1].toString().trim() : "Kredit";
    const tipe = tipeStr === "Kredit" ? "Pemasukan" : "Pengeluaran";
    const jenis = row[2] ? row[2].toString().trim() : "Lain-lain";
    const tgl = excelToDate(row[3]) || new Date();
    const deskripsi = row[4] ? row[4].toString().trim() : "-";
    const jumlah = Math.abs(parseFloat(row[5])) || 0;

    await prisma.cashflow.create({
      data: {
        type: tipe,
        category: jenis,
        transaction_date: tgl,
        description: deskripsi,
        amount: jumlah
      }
    });
  }

  console.log("Database Migration Complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
