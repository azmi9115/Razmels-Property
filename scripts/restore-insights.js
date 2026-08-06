const fs = require('fs');
const path = './src/app/dashboard/cashflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Re-inject calculation logic before Margin calculation if missing
if (!content.includes('potensiKosongRp')) {
  const targetLogic = '  // Margin calculation for chart (All Time)';
  const replaceLogic = `  // Calculation for Insights
  const allBuildings = await prisma.building.findMany();
  const totalBuildings = allBuildings.length;
  const totalPotensiKotor = allBuildings.reduce((acc, curr) => acc + curr.rent_price, 0);

  const tenantsWithPayments = await prisma.tenant.findMany({
    where: { status: "Active" },
    include: {
      building: true,
      payments: {
        orderBy: { rent_end_date: "desc" },
        take: 1
      }
    }
  });

  const activeTenants = tenantsWithPayments.length;
  const kamarKosong = totalBuildings - activeTenants;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let potensiPendapatan = 0;
  let tenantMenunggak = 0;
  let totalTunggakanRp = 0;

  tenantsWithPayments.forEach(tenant => {
    potensiPendapatan += tenant.building?.rent_price || 0;
    const dueDate = tenant.payments && tenant.payments.length > 0
      ? new Date(tenant.payments[0].rent_end_date)
      : new Date(tenant.entry_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      tenantMenunggak++;
      totalTunggakanRp += tenant.building?.rent_price || 0;
    }
  });

  const potensiKosongRp = totalPotensiKotor - potensiPendapatan;
  const proyeksiSaldo = finalBalance + totalTunggakanRp;
  
  const currentMonth = new Date().getMonth();
  const currentYearDate = new Date().getFullYear();
  const incomeThisMonthInsights = cashflows
    .filter(c => c.type === "Pemasukan" && new Date(c.transaction_date).getMonth() === currentMonth && new Date(c.transaction_date).getFullYear() === currentYearDate)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Margin calculation for chart (All Time)`;
  
  content = content.replace(targetLogic, replaceLogic);
}

// 2. Re-inject UI Card before Margin Chart Section if missing
if (!content.includes('Analisis Keuangan Cerdas')) {
  const targetUI = '      {/* Margin Chart Section */}';
  const replaceUI = `      {/* Analisis Cerdas Section */}
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
                Pemasukan riil bulan ini (<strong className="text-slate-900">Rp {Math.round(incomeThisMonthInsights).toLocaleString("id-ID")}</strong>)
                mencapai <strong className="text-indigo-600">{totalPotensiKotor > 0 ? Math.round((incomeThisMonthInsights / totalPotensiKotor) * 100) : 0}%</strong> dari total potensi kotor
                (Rp {Math.round(totalPotensiKotor).toLocaleString("id-ID")}).
              </p>
            </div>
            <div className="space-y-2 md:border-l border-indigo-100 md:pl-6">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Alasan Kehilangan Potensi</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Terdapat <strong className="text-slate-900">{kamarKosong} kamar kosong</strong> senilai Rp {Math.round(potensiKosongRp).toLocaleString("id-ID")},
                serta <strong className="text-red-600">{tenantMenunggak} penghuni menunggak</strong> dengan total belum tertagih <strong className="text-red-600">Rp {Math.round(totalTunggakanRp).toLocaleString("id-ID")}</strong>.
                <br/><br/>
                Jika penunggak melunasi, Saldo Akhir Anda menjadi <strong className="text-emerald-600 font-bold">Rp {Math.round(proyeksiSaldo).toLocaleString("id-ID")}</strong>.
              </p>
            </div>
            <div className="space-y-2 md:border-l border-indigo-100 md:pl-6">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Proyeksi Saldo Maksimal</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Jika seluruh kamar penuh dan seluruh tagihan dibayar lunas (tanpa tunggakan), maka potensi maksimal Saldo Akhir Anda adalah <strong className="text-emerald-600 font-extrabold text-[15px]">Rp {Math.round(finalBalance + totalTunggakanRp + potensiKosongRp).toLocaleString("id-ID")}</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin Chart Section */}`;
      
  content = content.replace(targetUI, replaceUI);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully restored Analisis Keuangan Cerdas to Cashflow page!");
