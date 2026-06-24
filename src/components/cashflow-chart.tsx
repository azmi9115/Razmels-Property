"use client"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type ChartData = {
  month: string
  Pemasukan: number
  Pengeluaran: number
}

export function CashflowChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500">Belum ada data transaksi</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{fill: '#64748b'}} 
          tickFormatter={(value) => `Rp${value / 1000}k`}
        />
        <Tooltip 
          cursor={{fill: '#f1f5f9'}}
          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
          formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, undefined]}
        />
        <Legend wrapperStyle={{paddingTop: '20px'}} />
        <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
        <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
      </BarChart>
    </ResponsiveContainer>
  )
}
