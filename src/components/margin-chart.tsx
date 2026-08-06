"use client"
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type MarginData = {
  month: string
  Pemasukan: number
  Pengeluaran: number
  marginNominal: number
  marginPercentage: number
  healthStatus: string
  healthColor: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MarginData;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200 text-sm">
        <p className="font-bold text-slate-800 mb-2 border-b pb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-emerald-600 font-medium">Pemasukan:</span>
            <span className="font-semibold text-slate-700">Rp {data.Pemasukan.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-red-500 font-medium">Pengeluaran:</span>
            <span className="font-semibold text-slate-700">Rp {data.Pengeluaran.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t mt-1">
            <span className="text-amber-500 font-bold">Margin:</span>
            <span className="font-bold text-slate-900">{data.marginPercentage.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4 pt-2 mt-2 items-center">
            <span className="text-slate-500 font-medium text-xs">Status:</span>
            <span 
              className="text-xs font-bold px-2 py-1 rounded" 
              style={{ backgroundColor: data.healthColor + '20', color: data.healthColor }}
            >
              {data.healthStatus}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={5} 
      stroke="#fff" 
      strokeWidth={2} 
      fill={payload.healthColor || "#f59e0b"} 
    />
  );
};

export function MarginChart({ data }: { data: MarginData[] }) {
  if (data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500">Belum ada data transaksi</div>
  }

  // Calculate dynamic width based on data points to prevent squishing when data spans years
  // Give each month roughly 60px of space, with a minimum of 100% width.
  const minChartWidth = Math.max(100, data.length * 70);

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
      <div style={{ minWidth: `${minChartWidth}px`, height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              dy={10} 
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12}} 
              tickFormatter={(value) => value >= 1000000 ? `Rp${value / 1000000}M` : `Rp${value / 1000}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#eab308', fontSize: 12, fontWeight: 600}} 
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Legend wrapperStyle={{paddingTop: '20px', fontSize: '13px'}} />
            <Bar yAxisId="left" dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
            <Bar yAxisId="left" dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={45} />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="marginPercentage" 
              name="Margin (%)" 
              stroke="#f59e0b" 
              strokeWidth={3} 
              dot={<CustomDot />}
              activeDot={{r: 7}} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
