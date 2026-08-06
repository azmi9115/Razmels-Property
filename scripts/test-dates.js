const XLSX = require('xlsx');
function excelToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const unixTimestamp = (serial - 25569) * 86400 * 1000;
  const date = new Date(unixTimestamp);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() + offset);
}
console.log(excelToDate(45689)); // Annita's first payment date
console.log(excelToDate(46180)); // Annita's last Akhir Sewa
