const fs = require('fs');
const path = './src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">';

const startIndex = content.indexOf(startStr);

if (startIndex === -1) {
  console.log('Could not find start boundary for chart sections');
  process.exit(1);
}

const newCharts = `<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart Section */}
        <Card className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6">
            <CardTitle className="text-xl font-bold text-slate-800">Grafik Arus Kas (6 Bulan Terakhir)</CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 mt-1">
              Perbandingan pemasukan sewa dan pengeluaran operasional
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-6 px-6">
            <CashflowChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6">
            <CardTitle className="text-xl font-bold text-slate-800">Jatuh Tempo Terdekat</CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 mt-1">Penyewa yang mendekati batas waktu</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-6 pb-6">
            <div className="space-y-3">
              {upcomingDueDates.length > 0 ? (
                upcomingDueDates.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={\`flex h-9 w-9 shrink-0 items-center justify-center rounded-full \${item.isLate ? 'bg-red-50 text-red-600' : item.isDueSoon ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'}\`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs font-medium text-slate-500">Kamar {item.room}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={\`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider \${item.isLate ? 'text-red-700 bg-red-100/50' : item.isDueSoon ? 'text-orange-700 bg-orange-100/50' : 'text-slate-600 bg-slate-100'}\`}>
                        {item.isLate ? \`Terlewat \${Math.abs(item.diffDays)} Hari\` : item.diffDays === 0 ? "Hari Ini" : \`Sisa \${item.diffDays} Hari\`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-8 text-sm font-medium">
                  Tidak ada penghuni yang mendekati jatuh tempo.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6">
            <CardTitle className="text-lg font-bold text-slate-800">Pemasukan vs Pengeluaran</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-1">Rasio keseluruhan dari awal s/d terbaru</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-6 px-6 pb-6">
            <CategoryPieChart data={incomeVsExpensePieData} />
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6">
            <CardTitle className="text-lg font-bold text-slate-800">Rincian Pemasukan</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-1">Berdasarkan semua jenis kategori</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-6 px-6 pb-6">
            <CategoryPieChart data={allTimeIncomePieData} />
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6">
            <CardTitle className="text-lg font-bold text-slate-800">Rincian Pengeluaran</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-1">Berdasarkan semua jenis kategori</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-6 px-6 pb-6">
            <CategoryPieChart data={allTimeExpensePieData} />
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6">
            <CardTitle className="text-lg font-bold text-slate-800">Penghasilan vs ZWS</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-1">Porsi amal (ZWS) dibandingkan total Pemasukan</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-6 px-6 pb-6">
            <CategoryPieChart data={zwsVsIncomePieData} />
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6">
            <CardTitle className="text-lg font-bold text-slate-800">Rincian ZWS</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-1">Perbandingan antara Zakat, Wakaf, dan Sedekah</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-6 px-6 pb-6">
            <CategoryPieChart data={zwsBreakdownPieData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
`;

content = content.substring(0, startIndex) + newCharts;
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced charts sections by slicing to the end of the file!');
