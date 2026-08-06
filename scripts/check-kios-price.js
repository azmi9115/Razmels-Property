const XLSX = require('xlsx');

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

console.log("Checking DB in Daftar Penghuni:");
const tenantsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Daftar Penghuni'], { header: 1 });
for (let i = 1; i < tenantsRaw.length; i++) {
  const row = tenantsRaw[i];
  if (row[1] && (row[1].startsWith('DA') || row[1].startsWith('DB'))) {
    console.log(`Row ${i} - ${row[1]}:`, row[10]);
  }
}
