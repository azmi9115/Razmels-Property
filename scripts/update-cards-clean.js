const fs = require('fs');
const path = './src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">';
const endStr = '<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find boundaries');
  process.exit(1);
}

const newCards = `<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Pendapatan Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              TOTAL PENDAPATAN
            </CardTitle>
            <div className="h-10 w-10 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <Landmark className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              Rp {Math.round(income).toLocaleString("id-ID")}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-semibold">
              <ArrowUpRight className="h-3 w-3" />
              +20.1% dari bulan lalu
            </div>
          </CardContent>
        </Card>

        {/* Pendapatan Bulan Ini Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              PENDAPATAN BULAN INI
            </CardTitle>
            <div className="h-10 w-10 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              Rp {Math.round(incomeThisMonth).toLocaleString("id-ID")}
            </div>
            <div className={\`mt-2 inline-flex items-center gap-1 \${incomeDiff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} px-2 py-1 rounded-md text-[10px] font-semibold\`}>
              {incomeDiff >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {incomeDiff >= 0 ? '+' : '-'} Rp {Math.round(Math.abs(incomeDiff)).toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>

        {/* Pengeluaran Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              PENGELUARAN
            </CardTitle>
            <div className="h-10 w-10 bg-red-100/50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              Rp {Math.round(expense).toLocaleString("id-ID")}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-md text-[10px] font-semibold">
              <ArrowUpRight className="h-3 w-3" />
              +4.3% dari bln lalu
            </div>
          </CardContent>
        </Card>

        {/* Okupansi Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              KAMAR TERISI
            </CardTitle>
            <div className="h-10 w-10 bg-blue-100/50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              {activeTenants} / {totalBuildings}
            </div>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Tingkat okupansi: {occupancyRate.toFixed(0)}%
            </p>
            <div className="w-full bg-slate-100 h-1 mt-1 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: \`\${occupancyRate}%\` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Kosong Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              KAMAR KOSONG
            </CardTitle>
            <div className="h-10 w-10 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
              <Building className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              {totalBuildings - activeTenants}
            </div>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Siap untuk disewakan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Baris Kedua: Parameter Bisnis (New) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Akhir Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              SALDO AKHIR
            </CardTitle>
            <div className="h-10 w-10 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <Landmark className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              Rp {Math.round(saldoAkhir).toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Sisa Kas Bersih
            </p>
          </CardContent>
        </Card>

        {/* Profit Margin Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              MARGIN LABA
            </CardTitle>
            <div className="h-10 w-10 bg-indigo-100/50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <PieChart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              {profitMargin.toFixed(1)}%
            </div>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Persentase Keuntungan
            </p>
          </CardContent>
        </Card>

        {/* Potensi Pendapatan Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              POTENSI BULANAN
            </CardTitle>
            <div className="h-10 w-10 bg-blue-100/50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="text-[22px] xl:text-[24px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
              Rp {Math.round(potensiPendapatan).toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] font-semibold text-slate-500 mt-2">
              Dari {activeTenants} kamar yang aktif
            </p>
          </CardContent>
        </Card>

        {/* Tunggakan Card */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight max-w-[90px]">
              TUNGGAKAN
            </CardTitle>
            <div className={\`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 \${tenantMenunggak > 0 ? 'bg-red-100/80 text-red-600' : 'bg-slate-100/80 text-slate-600'}\`}>
              <CalendarOff className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className={\`text-[22px] xl:text-[24px] font-extrabold tracking-tight whitespace-nowrap \${tenantMenunggak > 0 ? 'text-red-600' : 'text-slate-900'}\`}>
              {tenantMenunggak} <span className="text-sm font-bold">Penghuni</span>
            </div>
            <p className={\`text-[10px] font-semibold mt-2 \${tenantMenunggak > 0 ? 'text-red-500' : 'text-slate-500'}\`}>
              Lewat batas jatuh tempo
            </p>
          </CardContent>
        </Card>
      </div>

      `;

content = content.substring(0, startIndex) + newCards + content.substring(endIndex);
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced cards!');
