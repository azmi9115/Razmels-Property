"use client"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

type PieChartData = {
  name: string
  value: number
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']

export function CategoryPieChart({ data }: { data: PieChartData[] }) {
  if (data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500">Belum ada data</div>
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="#ffffff" 
        textAnchor="middle" 
        dominantBaseline="central" 
        className="text-xs font-bold pointer-events-none"
        style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.6)" }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const dataWithPercentage = data.map(item => ({
    ...item,
    name: `${item.name} (${total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)`
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={dataWithPercentage}
          cx="50%"
          cy="45%"
          innerRadius="40%"
          outerRadius="75%"
          paddingAngle={2}
          dataKey="value"
          stroke="none"
          labelLine={false}
          label={renderCustomizedLabel}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
          formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, undefined]}
        />
        <Legend wrapperStyle={{paddingTop: '20px'}} />
      </PieChart>
    </ResponsiveContainer>
  )
}
