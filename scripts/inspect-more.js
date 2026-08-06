const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

console.log("--- Pembayaran Sewa (Raw Arrays) ---");
let rawData = XLSX.utils.sheet_to_json(workbook.Sheets['Pembayaran Sewa'], { header: 1 });
for(let i=0; i<10; i++) {
  console.log(`Row ${i}:`, JSON.stringify(rawData[i]));
}

console.log("--- Daftar Penghuni (Raw Arrays) ---");
rawData = XLSX.utils.sheet_to_json(workbook.Sheets['Daftar Penghuni'], { header: 1 });
for(let i=0; i<5; i++) {
  console.log(`Row ${i}:`, JSON.stringify(rawData[i]));
}
