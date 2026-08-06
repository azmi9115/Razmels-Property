const XLSX = require('xlsx');

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

console.log("Checking DB in Daftar Penghuni:");
const tenantsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Daftar Penghuni'], { header: 1 });
for (let i = 1; i < tenantsRaw.length; i++) {
  const row = tenantsRaw[i];
  if (row[1] === 'DB' || row[2] === 'DB') {
    console.log(`Row ${i}:`, JSON.stringify(row));
  }
}

console.log("Checking DB in Pembayaran Sewa:");
const paymentsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Pembayaran Sewa'], { header: 1 });
for (let i = 5; i < paymentsRaw.length; i++) {
  const row = paymentsRaw[i];
  if (row[3] === 'DB') {
    console.log(`Row ${i}:`, JSON.stringify(row));
  }
}
