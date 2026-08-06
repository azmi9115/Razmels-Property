const XLSX = require('xlsx');

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

const paymentsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Pembayaran Sewa'], { header: 1 });
for (let i = 5; i < paymentsRaw.length; i++) {
  const row = paymentsRaw[i];
  const tenantName = row[1] ? row[1].toString().trim() : null;
  if (tenantName === 'Annita Wulandari') {
    console.log(`Row ${i}:`, JSON.stringify(row));
  }
}
