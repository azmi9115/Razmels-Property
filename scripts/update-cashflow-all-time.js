const fs = require('fs');
const path = './src/app/dashboard/cashflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchLogic = `  // Margin calculation for chart (Last 6 Months)
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
  });`;

const replaceLogic = `  // Margin calculation for chart (All Time)
  type MarginDataType = { month: string, Pemasukan: number, Pengeluaran: number, marginNominal: number, marginPercentage: number, healthStatus: string, healthColor: string };
  const marginDataMap = new Map<string, MarginDataType>();

  // Determine start date from oldest cashflow, or fallback to 6 months ago if no data
  let startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);
  
  if (cashflows.length > 0) {
    const oldestDate = new Date(cashflows[0].transaction_date);
    oldestDate.setDate(1);
    if (oldestDate < startDate) {
      startDate = oldestDate;
    }
  }

  const endDate = new Date();
  endDate.setDate(1); // until current month
  
  // Populate marginDataMap with all months from startDate to endDate
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const monthStr = \`\${monthNames[m]} \${y.toString().slice(-2)}\`;
    marginDataMap.set(\`\${y}-\${m}\`, { 
      month: monthStr, Pemasukan: 0, Pengeluaran: 0, marginNominal: 0, marginPercentage: 0, healthStatus: "N/A", healthColor: "#94a3b8" 
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  cashflows.forEach(cf => {
    const d = new Date(cf.transaction_date);
    const m = d.getMonth();
    const y = d.getFullYear();
    const key = \`\${y}-\${m}\`;

    if (marginDataMap.has(key)) {
      const data = marginDataMap.get(key)!;
      if (cf.type === "Pemasukan") data.Pemasukan += cf.amount;
      else data.Pengeluaran += cf.amount;
    }
  });`;

// Ensure we also replace the mapping to include healthStatus
const searchMap = `  const marginChartData = Array.from(marginDataMap.values()).map(data => {
    data.marginNominal = data.Pemasukan - data.Pengeluaran;
    data.marginPercentage = data.Pemasukan > 0 ? (data.marginNominal / data.Pemasukan) * 100 : 0;
    return data;
  });`;

const replaceMap = `  const marginChartData = Array.from(marginDataMap.values()).map(data => {
    data.marginNominal = data.Pemasukan - data.Pengeluaran;
    data.marginPercentage = data.Pemasukan > 0 ? (data.marginNominal / data.Pemasukan) * 100 : (data.marginNominal < 0 ? -100 : 0);
    
    if (data.marginPercentage > 30) {
      data.healthStatus = "Sangat Sehat";
      data.healthColor = "#10b981"; // emerald-500
    } else if (data.marginPercentage >= 10) {
      data.healthStatus = "Sehat";
      data.healthColor = "#3b82f6"; // blue-500
    } else if (data.marginPercentage >= 0) {
      data.healthStatus = "Waspada";
      data.healthColor = "#f59e0b"; // amber-500
    } else {
      data.healthStatus = "Rugi / Defisit";
      data.healthColor = "#ef4444"; // red-500
    }
    return data;
  });`;

content = content.replace(searchLogic.replace(/\r\n/g, '\\n'), replaceLogic);
content = content.replace(searchMap.replace(/\r\n/g, '\\n'), replaceMap);

// In case the exact string match fails due to whitespace differences, we can use a more robust replacement strategy.
// Let's do it right.
content = content.replace(/  \/\/ Margin calculation for chart \(Last 6 Months\)[\s\S]*?else data\.Pengeluaran \+= cf\.amount;\n      \}\n    \}\n  \}\);/m, replaceLogic);
content = content.replace(/  const marginChartData = Array\.from\(marginDataMap\.values\(\)\)\.map\(data => \{[\s\S]*?return data;\n  \}\);/m, replaceMap);


fs.writeFileSync(path, content, 'utf8');
console.log("Successfully updated cashflow/page.tsx for all-time margin charting!");
