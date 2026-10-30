"use client"

import { useState, useTransition } from "react"
import { Check, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { suggestGroupsAI, type AiSuggestion } from "@/app/actions/ai-suggest"
import { teachGroup } from "@/app/actions/group-rules"
import { formatRupiah } from "@/lib/format"

// Tebakan AI untuk transaksi yang masih "Lain-lain". Tidak ada yang tersimpan sebelum pemilik klik Terima.
export function AiSuggestions({ enabled, options }: { enabled: boolean; options: Record<string, string[]> }) {
  const [items, setItems] = useState<AiSuggestion[] | null>(null)
  const [asked, setAsked] = useState(0)
  const [returned, setReturned] = useState(0)
  const [loading, startLoading] = useTransition()
  const [saving, setSaving] = useState<string | null>(null)

  if (!enabled) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Tebakan AI belum aktif. Isi <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> di file <code className="rounded bg-muted px-1">.env</code> server (gratis dari Google AI Studio).
      </p>
    )
  }

  const key = (s: AiSuggestion) => `${s.type}|${s.description}`
  const remove = (s: AiSuggestion) => setItems((prev) => prev?.filter((x) => key(x) !== key(s)) ?? null)
  const update = (s: AiSuggestion, patch: Partial<AiSuggestion>) => setItems((prev) => prev?.map((x) => (key(x) === key(s) ? { ...x, ...patch } : x)) ?? null)

  function ask() {
    startLoading(async () => {
      const res = await suggestGroupsAI()
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      setItems(res.suggestions)
      setAsked(res.asked)
      setReturned(res.suggestions.length)
      if (res.asked === 0) toast.success("Semua transaksi sudah punya kelompok")
    })
  }

  async function accept(s: AiSuggestion) {
    setSaving(key(s))
    const res = await teachGroup(s.type, s.keyword, s.group)
    setSaving(null)
    if (res.error) toast.error(res.error)
    else {
      toast.success(`Diingat: "${s.keyword}" → ${s.group}`)
      // Tebakan lain yang sudah tercakup kata kunci ini ikut selesai
      const kw = s.keyword.trim().toLowerCase()
      setItems((prev) => prev?.filter((x) => !(x.type === s.type && x.description.includes(kw))) ?? null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={ask} disabled={loading}>
          <Sparkles className="size-4" />
          {loading ? "Gemini sedang menebak..." : items ? "Tebak ulang" : "Minta tebakan AI"}
        </Button>
        <p className="text-[13px] text-muted-foreground">
          Untuk transaksi pribadi yang masih masuk &ldquo;Lain-lain&rdquo;. Yang dikirim hanya deskripsi &amp; nominal, bukan data penghuni.
        </p>
      </div>

      {items && (
        items.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            {asked === 0
              ? "Tidak ada transaksi yang perlu ditebak."
              : returned > 0
                ? "Semua tebakan sudah ditinjau."
                : `Dari ${asked} transaksi, AI tidak yakin dengan satu pun — ajarkan manual lewat Alur uang.`}
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {items.map((s) => (
              <li key={key(s)} className="flex flex-col gap-2 p-3 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">&ldquo;{s.description}&rdquo;</p>
                  <p className="text-xs text-muted-foreground">
                    {s.type} · {s.count}× · {formatRupiah(s.total)} · <span className="italic">{s.reason}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    kata
                    <input
                      aria-label="Kata kunci"
                      value={s.keyword}
                      onChange={(e) => update(s, { keyword: e.target.value })}
                      className="h-7 w-28 rounded-md border bg-card px-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <select
                    aria-label="Kelompok"
                    value={s.group}
                    onChange={(e) => update(s, { group: e.target.value })}
                    className="h-7 max-w-48 rounded-md border bg-card px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {(options[s.type] ?? []).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => accept(s)} disabled={saving === key(s)}>
                    <Check className="size-3.5" /> Terima
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)} aria-label="Bukan, abaikan tebakan ini">
                    <X className="size-3.5" /> Bukan
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}
