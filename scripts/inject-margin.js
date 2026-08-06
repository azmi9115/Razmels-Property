const fs = require('fs');
const path = './src/app/dashboard/cashflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add MarginChart import
if (!content.includes('import { MarginChart }')) {
  content = content.replace(
    'import { TypeFilter } from "@/components/type-filter"',
    'import { TypeFilter } from "@/components/type-filter"\nimport { MarginChart } from "@/components/margin-chart"'
  );
}

// 2. Inject margin logic
const logicSearch = /  \/\/ Client-side like filtering/;
const logicReplace = `  // Margin calculation for chart (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const marginDataMap = new Map<string, { month: string, Pemasukan: number, Pengeluaran: number, marginNominal: number, marginPercentage: number }>();

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const monthStr = \`\${monthNames[m]} \${y.toString().slice(-2)}\`;
    marginDataMap.set(\`\${y}-\${m}\`, { month: monthStr, Pemasukan: 0, Pengeluaran: 0, marginNominal: 0, marginPercentage: 0 });
  }

  cashflows.forEach(cf => {
    const d = new Date(cf.transaction_date);
    if (d >= sixMonthsAgo) {
      const m = d.getMonth();
      const y = d.getFullYear();
      const key = \`\${y}-\${m}\`;

      if (marginDataMap.has(key)) {
        const data = marginDataMap.get(key)!;
        if (cf.type === "Pemasukan") data.Pemasukan += cf.amount;
        else data.Pengeluaran += cf.amount;
      }
    }
  });

  let currentMonthMarginHealth = "N/A";
  let currentMonthMarginHealthColor = "text-slate-500 bg-slate-100 border-transparent";
  let currentMonthMarginPercentage = 0;
  let currentMonthMarginNominal = 0;

  const marginChartData = Array.from(marginDataMap.values()).map(data => {
    data.marginNominal = data.Pemasukan - data.Pengeluaran;
    data.marginPercentage = data.Pemasukan > 0 ? (data.marginNominal / data.Pemasukan) * 100 : 0;
    return data;
  });

  const latestMonthData = marginChartData[marginChartData.length - 1];
  if (latestMonthData) {
     currentMonthMarginPercentage = latestMonthData.marginPercentage;
     currentMonthMarginNominal = latestMonthData.marginNominal;
     if (currentMonthMarginPercentage > 30) {
       currentMonthMarginHealth = "Sangat Sehat";
       currentMonthMarginHealthColor = "text-emerald-700 bg-emerald-100 border-emerald-200";
     } else if (currentMonthMarginPercentage >= 10) {
       currentMonthMarginHealth = "Sehat";
       currentMonthMarginHealthColor = "text-blue-700 bg-blue-100 border-blue-200";
     } else if (currentMonthMarginPercentage >= 0) {
       currentMonthMarginHealth = "Waspada";
       currentMonthMarginHealthColor = "text-orange-700 bg-orange-100 border-orange-200";
     } else {
       currentMonthMarginHealth = "Rugi / Defisit";
       currentMonthMarginHealthColor = "text-red-700 bg-red-100 border-red-200";
     }
  }

  // Client-side like filtering`;
content = content.replace(logicSearch, logicReplace);

// 3. Inject UI chart
const uiSearch = /      <\/Card>\n\n      <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">/;
const uiReplace = `      </Card>

      {/* Margin Chart Section */}
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Grafik Margin Profitabilitas</CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 mt-1">
              Perbandingan pemasukan, pengeluaran, dan persentase keuntungan tiap bulan.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end text-right shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Bulan Ini</span>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-black text-slate-900">{currentMonthMarginPercentage.toFixed(1)}%</div>
                <div className={\`text-[11px] font-bold \${currentMonthMarginNominal >= 0 ? 'text-emerald-600' : 'text-red-600'}\`}>
                  {currentMonthMarginNominal >= 0 ? '+' : '-'} Rp {Math.abs(currentMonthMarginNominal).toLocaleString("id-ID")}
                </div>
              </div>
              <div className={\`px-3 py-1.5 rounded-lg border text-sm font-bold shadow-sm \${currentMonthMarginHealthColor}\`}>
                {currentMonthMarginHealth}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[380px] w-full pt-6 px-6 pb-6">
          <MarginChart data={marginChartData} />
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">`;
content = content.replace(uiSearch, uiReplace);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully injected Margin chart and logic!');
