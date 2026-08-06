const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

console.log("--- CashFlow (Raw Arrays) ---");
const sheet = workbook.Sheets['CashFlow'];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
for(let i=0; i<15; i++) {
  console.log(`Row ${i}:`, JSON.stringify(rawData[i]));
}
