const fs = require('fs');

function updateDashboard() {
  const path = './src/app/dashboard/page.tsx';
  let content = fs.readFileSync(path, 'utf8');
  
  const search = `maka potensi maksimal Saldo Akhir Anda adalah <strong className="text-emerald-600 font-extrabold text-[15px]">Rp {Math.round(saldoAkhir + totalTunggakanRp + potensiKosongRp).toLocaleString("id-ID")}</strong>.`;
  const replace = `maka potensi maksimal Saldo Akhir Anda adalah <strong className="text-emerald-600 font-extrabold text-[15px]">Rp {Math.round(saldoAkhir + (totalPotensiKotor - incomeThisMonth)).toLocaleString("id-ID")}</strong>.`;
  
  content = content.replace(search, replace);
  fs.writeFileSync(path, content, 'utf8');
}

function updateCashflow() {
  const path = './src/app/dashboard/cashflow/page.tsx';
  let content = fs.readFileSync(path, 'utf8');
  
  const search = `maka potensi maksimal Saldo Akhir Anda adalah <strong className="text-emerald-600 font-extrabold text-[15px]">Rp {Math.round(finalBalance + totalTunggakanRp + potensiKosongRp).toLocaleString("id-ID")}</strong>.`;
  const replace = `maka potensi maksimal Saldo Akhir Anda adalah <strong className="text-emerald-600 font-extrabold text-[15px]">Rp {Math.round(finalBalance + (totalPotensiKotor - incomeThisMonthInsights)).toLocaleString("id-ID")}</strong>.`;
  
  content = content.replace(search, replace);
  fs.writeFileSync(path, content, 'utf8');
}

updateDashboard();
updateCashflow();
console.log("Updated both files to use Total Potensi Kotor for maximum projection!");
