"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Loader2, Check, X, Info } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

type Tenant = {
  id: string;
  name: string;
  building: { code: string; rent_price: number } | null;
};

type MutationRow = {
  date: string;
  description: string;
  amount: number;
};

type MatchedMutation = {
  id: string; // unique temp id
  date: string;
  description: string;
  amount: number;
  matchedTenant: Tenant | null;
  selected: boolean;
};

export function MutationUploadDialog({ activeTenants }: { activeTenants: Tenant[] }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchedMutations, setMatchedMutations] = useState<MatchedMutation[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // 1: upload, 2: verify
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCsv = () => {
    if (!file) {
      toast.error("Pilih file CSV terlebih dahulu.");
      return;
    }

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as Record<string, string>[];
          const mutations: MutationRow[] = [];

          rawData.forEach((row) => {
            // Flexible matching for typical Indonesian bank CSVs (like BRI)
            const dateStr = row["TGL_TRAN"] || row["Tanggal"] || row["Date"] || row["TANGGAL"] || "";
            const desc = row["DESK_TRAN"] || row["REMARK_CUSTOM"] || row["Keterangan"] || row["Description"] || row["KETERANGAN"] || row["Berita"] || "";
            const amountStr = row["MUTASI_KREDIT"] || row["Mutasi"] || row["Kredit"] || row["Uang Masuk"] || row["Amount"] || "";
            
            // Clean up the amount string (remove commas, dots used as thousand separators, etc.)
            // Handle negative amounts if it's a unified 'Mutasi' column (though we want Kredit)
            const cleanAmount = amountStr.replace(/[^0-9.-]+/g, "");
            const amount = parseFloat(cleanAmount);

            // Only interested in positive amounts (income)
            if (dateStr && desc && !isNaN(amount) && amount > 0) {
              mutations.push({ date: dateStr, description: desc, amount });
            }
          });

          if (mutations.length === 0) {
            toast.error("Tidak ditemukan baris mutasi pemasukan yang valid.");
            setLoading(false);
            return;
          }

          // Smart matching logic (Heuristic based on exact rent_price)
          const matched: MatchedMutation[] = mutations.map((m, index) => {
            // Find exactly one tenant whose rent_price matches the amount
            let possibleTenant = null;
            const tenantsWithMatchingPrice = activeTenants.filter(t => t.building?.rent_price === m.amount);
            
            if (tenantsWithMatchingPrice.length === 1) {
              possibleTenant = tenantsWithMatchingPrice[0];
            } else if (tenantsWithMatchingPrice.length > 1) {
              // If multiple tenants have the same rent price, try matching name in description
              const nameMatch = tenantsWithMatchingPrice.find(t => 
                m.description.toLowerCase().includes(t.name.toLowerCase())
              );
              if (nameMatch) possibleTenant = nameMatch;
            }

            return {
              id: `temp-${index}`,
              date: m.date,
              description: m.description,
              amount: m.amount,
              matchedTenant: possibleTenant,
              selected: !!possibleTenant, // Auto select if we found a match
            };
          });

          setMatchedMutations(matched);
          setStep(2);
        } catch (error) {
          console.error(error);
          toast.error("Gagal membaca format CSV. Pastikan kolom sesuai.");
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        toast.error("Error membaca file: " + error.message);
        setLoading(false);
      },
    });
  };

  const toggleSelection = (id: string) => {
    setMatchedMutations(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  const submitBulk = async () => {
    const toSubmit = matchedMutations.filter(m => m.selected && m.matchedTenant);
    
    if (toSubmit.length === 0) {
      toast.error("Pilih minimal satu mutasi yang sudah dicocokkan dengan penghuni.");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload
      const payments = toSubmit.map(m => {
        // Parse date properly. Natively parse YYYY-MM-DD first (BRI format)
        let txDate = new Date(m.date);
        if (isNaN(txDate.getTime())) {
          // fallback for DD/MM/YYYY formats if any
          const parts = m.date.split(/[-/]/);
          if (parts.length >= 3) {
            txDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        }

        // Calculate end date (assuming 1 month duration)
        const endDate = new Date(txDate);
        endDate.setMonth(endDate.getMonth() + 1);

        return {
          tenant_id: m.matchedTenant!.id,
          amount: m.amount,
          transfer_date: txDate.toISOString(),
          rent_duration_months: 1,
          rent_end_date: endDate.toISOString(),
        };
      });

      const res = await fetch("/api/payments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments }),
      });

      if (!res.ok) throw new Error("Failed to process bulk payments");
      
      const data = await res.json();
      toast.success(`${data.count} pembayaran berhasil diproses dan masuk ke Cashflow!`);
      setOpen(false);
      
      // Reset state
      setStep(1);
      setFile(null);
      setMatchedMutations([]);
      router.refresh();
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Terjadi kesalahan sistem.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2 bg-slate-50 hover:bg-slate-100 border-slate-200" />}>
        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        Verifikasi Mutasi CSV (Beta)
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Verifikasi Mutasi Bank (Beta)</DialogTitle>
        </DialogHeader>
        
        {step === 1 && (
          <div className="flex flex-col gap-6 py-4">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-600 space-y-2">
              <p className="font-medium text-slate-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" /> Cara Kerja Fitur Beta
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Upload file mutasi berformat <b>.csv</b> (contoh: dari Internet Banking BRI).</li>
                <li>Sistem otomatis membaca baris pemasukan uang (*Kredit/Uang Masuk*).</li>
                <li>Sistem akan **menebak cerdas** siapa yang bayar jika nominal uang masuk sama persis dengan harga sewa kamar penghuni aktif.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv_file">Upload File Mutasi (.csv)</Label>
              <Input 
                id="csv_file" 
                type="file" 
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            
            <DialogFooter>
              <Button onClick={parseCsv} disabled={!file || loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Baca & Cocokkan Data
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
            <p className="text-sm text-slate-600">
              Ditemukan <b>{matchedMutations.length}</b> transaksi pemasukan. Centang transaksi yang benar-benar merupakan pembayaran sewa untuk diproses masuk ke buku kas.
            </p>

            <div className="overflow-y-auto border rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr>
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3 max-w-[200px]">Keterangan Bank</th>
                    <th className="p-3">Nominal Masuk</th>
                    <th className="p-3">Tebakan Penghuni (AI)</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedMutations.map((m) => (
                    <tr key={m.id} className={`border-b last:border-0 ${m.selected ? 'bg-emerald-50/50' : ''}`}>
                      <td className="p-3">
                        <Checkbox 
                          checked={m.selected} 
                          onCheckedChange={() => toggleSelection(m.id)}
                          disabled={!m.matchedTenant}
                        />
                      </td>
                      <td className="p-3 font-mono text-xs">{m.date}</td>
                      <td className="p-3 truncate max-w-[200px]" title={m.description}>{m.description}</td>
                      <td className="p-3 font-semibold text-emerald-600">
                        Rp {m.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3">
                        {m.matchedTenant ? (
                          <div className="flex items-center gap-2 text-emerald-700 font-medium">
                            <Check className="h-4 w-4" />
                            {m.matchedTenant.name} ({m.matchedTenant.building?.code})
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400">
                            <X className="h-4 w-4" />
                            <span className="italic">Tidak Cocok</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="mt-2">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                Batal / Upload Ulang
              </Button>
              <Button onClick={submitBulk} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Proses {matchedMutations.filter(m => m.selected).length} Pembayaran
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
