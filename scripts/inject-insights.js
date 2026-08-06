const fs = require('fs');
const path = './src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Normalize newlines to \n for easier regex
content = content.replace(/\r\n/g, '\n');

// 1. Calculate totalPotensiKotor
const replace1 = /  const totalBuildings = await prisma\.building\.count\(\);\n  const occupancyRate = totalBuildings > 0 \? \(activeTenants \/ totalBuildings\) \* 100 : 0;/;
const with1 = `  const allBuildings = await prisma.building.findMany();
  const totalBuildings = allBuildings.length;
  const occupancyRate = totalBuildings > 0 ? (activeTenants / totalBuildings) * 100 : 0;
  const totalPotensiKotor = allBuildings.reduce((acc, curr) => acc + curr.rent_price, 0);`;
content = content.replace(replace1, with1);

// 2. Add totalTunggakanRp variable
const replace2 = /  let potensiPendapatan = 0;\n  let tenantMenunggak = 0;\n\n  const upcomingDueDates = tenantsWithPayments\.map\(tenant => \{/;
const with2 = `  let potensiPendapatan = 0;
  let tenantMenunggak = 0;
  let totalTunggakanRp = 0;

  const upcomingDueDates = tenantsWithPayments.map(tenant => {`;
content = content.replace(replace2, with2);

// 3. Accumulate totalTunggakanRp
const replace3 = /    if \(diffDays < 0\) tenantMenunggak\+\+;/;
const with3 = `    if (diffDays < 0) {
      tenantMenunggak++;
      totalTunggakanRp += tenant.building?.rent_price || 0;
    }`;
content = content.replace(replace3, with3);

// 4. Calculate insights logic right before return
const replace4 = /  return \(\n    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">/;
const with4 = `  const kamarKosong = totalBuildings - activeTenants;
  const potensiKosongRp = totalPotensiKotor - potensiPendapatan;
  const proyeksiSaldo = saldoAkhir + totalTunggakanRp;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">`;
content = content.replace(replace4, with4);

// 5. Inject the UI Card
const replace5 = /        <\/Card>\n      <\/div>\n\n      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">/;
const with5 = `        </Card>
      </div>

      {/* Analisis Cerdas Section */}
      <Card className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <CardHeader className="border-b border-indigo-50/50 pb-5 px-6 pt-6">
          <CardTitle className="text-xl font-extrabold text-indigo-950 flex items-center gap-2">
            <span className="text-2xl">💡</span> Analisis Keuangan Cerdas
          </CardTitle>
          <CardDescription className="text-sm font-medium text-indigo-700/70 mt-1">
            Ringkasan performa riil dan proyeksi pendapatan properti Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Performa vs Potensi</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Pemasukan riil bulan ini (<strong className="text-slate-900">Rp {Math.round(incomeThisMonth).toLocaleString("id-ID")}</strong>)
                mencapai <strong className="text-indigo-600">{totalPotensiKotor > 0 ? Math.round((incomeThisMonth / totalPotensiKotor) * 100) : 0}%</strong> dari total potensi kotor
                (Rp {Math.round(totalPotensiKotor).toLocaleString("id-ID")}).
              </p>
            </div>
            <div className="space-y-2 md:border-l border-indigo-100 md:pl-6">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Alasan Kehilangan Potensi</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Terdapat <strong className="text-slate-900">{kamarKosong} kamar kosong</strong> senilai Rp {Math.round(potensiKosongRp).toLocaleString("id-ID")},
                serta <strong className="text-red-600">{tenantMenunggak} penghuni menunggak</strong> dengan total belum tertagih <strong className="text-red-600">Rp {Math.round(totalTunggakanRp).toLocaleString("id-ID")}</strong>.
              </p>
            </div>
            <div className="space-y-2 md:border-l border-indigo-100 md:pl-6">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Proyeksi Saldo Riil</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Jika seluruh tagihan bulan ini dibayar lunas oleh penunggak, maka Saldo Akhir Anda seharusnya adalah <strong className="text-emerald-600 font-extrabold text-[15px]">Rp {Math.round(proyeksiSaldo).toLocaleString("id-ID")}</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">`;
content = content.replace(replace5, with5);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully injected the Financial Insights feature with robust Regex replacements!');
