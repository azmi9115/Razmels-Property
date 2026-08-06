const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\mazmi\\Documents\\Project\\New Razmels Property Management Systems\\database juli\\Master Data Kontrakan (1).xlsm';
const workbook = XLSX.readFile(filePath);

console.log("--- Daftar Penghuni ---");
const tenants = XLSX.utils.sheet_to_json(workbook.Sheets['Daftar Penghuni']);
console.log(tenants.slice(0, 3));

console.log("--- Pembayaran Sewa ---");
const payments = XLSX.utils.sheet_to_json(workbook.Sheets['Pembayaran Sewa']);
console.log(payments.slice(0, 3));

console.log("--- CashFlow ---");
const cashflow = XLSX.utils.sheet_to_json(workbook.Sheets['CashFlow']);
console.log(cashflow.slice(0, 3));
