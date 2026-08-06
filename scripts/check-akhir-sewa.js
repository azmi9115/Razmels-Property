const XLSX = require('xlsx');

function excelToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const unixTimestamp = (serial - 25569) * 86400 * 1000;
  const date = new Date(unixTimestamp);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() + offset);
}

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

console.log("Checking Akhir Sewa in Pembayaran Sewa:");
const paymentsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Pembayaran Sewa'], { header: 1 });
for (let i = 5; i < 15; i++) {
  const row = paymentsRaw[i];
  if (row[1]) {
    const akhirSewaDate = excelToDate(row[8]);
    console.log(`Row ${i} - ${row[1]}: Akhir Sewa Excel = ${row[8]} -> ${akhirSewaDate}`);
  }
}
