const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

console.log("Sheet names:");
workbook.SheetNames.forEach(sheetName => {
  console.log(`- ${sheetName}`);
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`  Rows: ${jsonData.length}`);
  if (jsonData.length > 0) {
    console.log(`  Headers/First Row: ${JSON.stringify(jsonData[0])}`);
  }
});
