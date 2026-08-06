"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { AlertCircle, TrendingUp, Target, HelpCircle } from "lucide-react"

export type MonthlyCashflowData = {
  month: string
  income: number
  expense: number
  margin: number
  isHealthy: boolean
}

export type UnachievedReason = {
  name: string
  room: string
  status: string // e.g. "BELUM BAYAR"
}

export type CurrentMonthTarget = {
  potentialIncome: number
  actualIncome: number
  unachievedReasons: UnachievedReason[]
}

export function CashflowAnalytics({
  monthlyData,
  currentTarget
}: {
  monthlyData: MonthlyCashflowData[],
  currentTarget: CurrentMonthTarget
}) {
  const isTargetAchieved = currentTarget.actualIncome >= currentTarget.potentialIncome

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Left Col: Target Tracking */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Target Bulan Ini
            </CardTitle>
            <CardDescription>Potensi vs Realisasi Pendapatan</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col">
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Potensi Pendapatan</p>
                <p className="text-2xl font-bold text-slate-800">
                  Rp {currentTarget.potentialIncome.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total harga sewa dari seluruh penghuni aktif.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Realisasi (Aktual)</p>
                <p className={`text-2xl font-bold ${isTargetAchieved ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Rp {currentTarget.actualIncome.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Achievement Status */}
            <div className="mt-auto">
              {isTargetAchieved ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Target Tercapai!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Pendapatan bulan ini sudah memenuhi atau melebihi potensi sewa.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Target Belum Tercapai</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Ada selisih Rp {(currentTarget.potentialIncome - currentTarget.actualIncome).toLocaleString("id-ID")}.
                      </p>
                    </div>
                  </div>

                  {currentTarget.unachievedReasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50">
                      <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Penyebab (Belum Bayar):
                      </p>
                      <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {currentTarget.unachievedReasons.map((reason, idx) => (
                          <li key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-amber-700/80 font-medium truncate pr-2">
                              {reason.name} ({reason.room})
                            </span>
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold text-[10px] whitespace-nowrap">
                              {reason.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Col: Monthly Chart */}
      <div className="lg:col-span-2">
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl h-full flex flex-col">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Tren Margin & Arus Kas (12 Bulan)
            </CardTitle>
            <CardDescription>Perbandingan Pemasukan dan Pengeluaran beserta persentase margin (Surplus/Minus).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-6 pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as MonthlyCashflowData;
                        const surplus = data.income - data.expense;
                        return (
                          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-sm min-w-[200px] z-50">
                            <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-emerald-600">
                                <span>Pemasukan:</span>
                                <span className="font-semibold">Rp {data.income.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-red-500">
                                <span>Pengeluaran:</span>
                                <span className="font-semibold">Rp {data.expense.toLocaleString("id-ID")}</span>
                              </div>
                              <div className={`flex justify-between pt-1.5 mt-1.5 border-t border-slate-100 font-bold ${surplus >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                <span>{surplus >= 0 ? 'Surplus' : 'Minus'}:</span>
                                <span>Rp {Math.abs(surplus).toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                <span className="text-xs text-slate-500">Kesehatan:</span>
                                {data.isHealthy ? (
                                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">SEHAT ({data.margin.toFixed(1)}%)</span>
                                ) : (
                                  <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold">TIDAK SEHAT ({data.margin.toFixed(1)}%)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600 font-medium ml-1">{value}</span>}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
