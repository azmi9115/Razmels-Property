"use client"

import { useMemo, useRef, useState } from "react"
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, CreditCard, FileSpreadsheet, Landmark, ListChecks, RotateCcw, Upload, Users, Wallet } from "lucide-react"
import { toast } from "sonner"
import { applyExcelSync, previewExcelSync, type PreviewResult } from "@/app/actions/excel-sync"
import type { Change, ChangeKind, Entity } from "@/lib/excel-sync"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Panel } from "@/components/panel"
import { StatCard } from "@/components/stat-card"
import { StatusPill, type Tone } from "@/components/status-pill"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

type Preview = Exclude<PreviewResult, { error: string }>

const ENTITIES: { id: Entity; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "snapshot", label: "Saldo & investasi", icon: Landmark },
  { id: "building", label: "Bangunan", icon: Building2 },
  { id: "tenant", label: "Penghuni", icon: Users },
  { id: "payment", label: "Pembayaran Sewa", icon: CreditCard },
  { id: "cashflow", label: "Cash Flow", icon: Wallet },
]

const KINDS: { id: ChangeKind; label: string; tone: Tone; hint: string }[] = [
  { id: "add", label: "Baru di Excel", tone: "success", hint: "Belum ada di web — akan ditambahkan" },
  { id: "update", label: "Berubah", tone: "info", hint: "Sudah ada di web tapi isinya beda — web disamakan dengan Excel" },
  { id: "webOnly", label: "Hanya ada di web", tone: "neutral", hint: "Tidak ada di Excel — dibiarkan, kecuali dicentang untuk dihapus" },
]

const PAGE = 40

export function ExcelSyncClient() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<"preview" | "apply" | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [done, setDone] = useState<{ applied: number; backup: string } | null>(null)
  const [dragging, setDragging] = useState(false)

  function pick(f: File | undefined | null) {
    if (!f) return
    setFile(f)
    setPreview(null)
    setDone(null)
  }

  async function check() {
    if (!file) return
    setLoading("preview")
    try {
      const fd = new FormData()
      fd.set("file", file)
      const res = await previewExcelSync(fd)
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      setPreview(res)
      setSelected(new Set(res.changes.filter((c) => c.selectable && c.defaultOn).map((c) => c.key)))
    } finally {
      setLoading(null)
    }
  }

  async function apply() {
    if (!file || !preview) return
    setLoading("apply")
    try {
      const fd = new FormData()
      fd.set("file", file)
      fd.set("token", preview.token)
      fd.set("selected", JSON.stringify([...selected]))
      const res = await applyExcelSync(fd)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setConfirmOpen(false)
      setDone({ applied: res.applied ?? 0, backup: res.backup ?? "" })
      setPreview(null)
      toast.success("Data web sudah diperbarui dari Excel")
    } finally {
      setLoading(null)
    }
  }

  function reset() {
    setFile(null)
    setPreview(null)
    setDone(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const byKey = useMemo(() => new Map(preview?.changes.map((c) => [c.key, c]) ?? []), [preview])

  // Mencentang perubahan ikut mencentang yang dibutuhkannya (mis. penghuni baru untuk pembayarannya);
  // melepas centang ikut melepas yang bergantung padanya
  function toggle(keys: string[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      const queue = [...keys]
      while (queue.length) {
        const k = queue.pop()!
        if (on) {
          if (next.has(k)) continue
          next.add(k)
          queue.push(...(byKey.get(k)?.requires ?? []))
        } else {
          if (!next.has(k)) continue
          next.delete(k)
          queue.push(...(preview?.changes.filter((c) => c.requires?.includes(k)).map((c) => c.key) ?? []))
        }
      }
      return next
    })
  }

  const counts = useMemo(() => {
    const all = preview?.changes ?? []
    const chosen = all.filter((c) => selected.has(c.key))
    return {
      add: all.filter((c) => c.kind === "add").length,
      update: all.filter((c) => c.kind === "update").length,
      webOnly: all.filter((c) => c.kind === "webOnly").length,
      chosen: chosen.length,
      chosenBy: (k: ChangeKind) => chosen.filter((c) => c.kind === k).length,
      saldoAfter: (preview?.webSaldo ?? 0) + chosen.reduce((acc, c) => acc + (c.saldoDelta ?? 0), 0),
    }
  }, [preview, selected])

  if (done) {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 className="size-6" />
          </span>
          <h2 className="text-lg font-semibold">{done.applied} perubahan sudah diterapkan</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Semua halaman (Dashboard, Monitoring, Cash Flow, Laporan) sudah memakai data terbaru. Cadangan database sebelum update tersimpan sebagai{" "}
            <span className="font-mono text-xs text-foreground">{done.backup}</span>.
          </p>
          <Button variant="outline" onClick={reset} className="mt-2">
            <RotateCcw /> Upload file lain
          </Button>
        </div>
      </Panel>
    )
  }

  return (
    <div className="space-y-6">
      <Panel title="1. Upload Excel dari manager ops" description="File Master Data Kontrakan (.xlsm / .xlsx). Belum ada data yang berubah sampai kamu menekan Verifikasi." icon={FileSpreadsheet}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pick(e.dataTransfer.files[0])
            }}
            className={cn(
              "flex min-w-0 flex-1 cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-5 transition-colors hover:border-ring/50 hover:bg-muted/40",
              dragging && "border-ring bg-accent/50"
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Upload className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{file ? file.name : "Pilih atau tarik file Excel ke sini"}</span>
              <span className="block text-[13px] text-muted-foreground">
                {file ? `${(file.size / 1024).toFixed(0)} KB · klik untuk ganti file` : "Sheet yang dibaca: Bangunan, Daftar Penghuni, Pembayaran Sewa, CashFlow"}
              </span>
            </span>
            <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.xls" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          <Button size="lg" onClick={check} disabled={!file || loading !== null} className="lg:h-auto lg:px-6">
            {loading === "preview" ? "Membandingkan..." : preview ? "Cek ulang" : "Cek perubahan"}
            <ArrowRight />
          </Button>
        </div>
      </Panel>

      {preview && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Baru di Excel" value={counts.add} tone="success" hint="Akan ditambahkan" />
            <StatCard label="Berubah" value={counts.update} tone="info" hint="Web disamakan dengan Excel" />
            <StatCard label="Hanya di web" value={counts.webOnly} tone="neutral" hint="Dibiarkan kecuali dicentang" />
            <StatCard
              label="Saldo kas web"
              value={formatRupiah(counts.saldoAfter)}
              tone="neutral"
              hint={counts.saldoAfter === preview.webSaldo ? "Tidak berubah" : `Sekarang ${formatRupiah(preview.webSaldo)}`}
            />
          </div>

          {counts.add + counts.update === 0 && (
            <Panel>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-5 shrink-0 text-success" />
                {counts.webOnly === 0
                  ? "Data web sudah sama persis dengan Excel ini. Tidak ada yang perlu diperbarui."
                  : "Semua isi Excel ini sudah ada di web. Sisanya hanya data yang dicatat langsung di web."}
              </div>
            </Panel>
          )}

          {preview.issues.length > 0 && <IssuesPanel issues={preview.issues} />}

          {ENTITIES.map((e) => {
            const items = preview.changes.filter((c) => c.entity === e.id)
            if (items.length === 0) return null
            return <EntityPanel key={e.id} entity={e} items={items} selected={selected} toggle={toggle} />
          })}

          {preview.changes.length > 0 && (
            <div className="sticky bottom-3 z-10">
              <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">
                  <span className="font-semibold">{counts.chosen} perubahan dipilih</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {counts.chosenBy("add")} tambah, {counts.chosenBy("update")} ubah, {counts.chosenBy("webOnly")} hapus
                  </span>
                </p>
                <Button size="lg" disabled={counts.chosen === 0 || loading !== null} onClick={() => setConfirmOpen(true)}>
                  <ListChecks /> Verifikasi & update data
                </Button>
              </div>
            </div>
          )}

          <AlertDialog open={confirmOpen} onOpenChange={(o) => loading !== "apply" && setConfirmOpen(o)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Terapkan {counts.chosen} perubahan?</AlertDialogTitle>
                <AlertDialogDescription>
                  {counts.chosenBy("add")} data ditambahkan, {counts.chosenBy("update")} diubah mengikuti Excel
                  {counts.chosenBy("webOnly") > 0 && <>, dan <strong className="text-danger">{counts.chosenBy("webOnly")} dihapus dari web</strong></>}. Saldo kas web menjadi{" "}
                  {formatRupiah(counts.saldoAfter)}. Database dicadangkan otomatis sebelum update, dan kalau ada satu yang gagal, tidak ada yang berubah.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading === "apply"}>Cek lagi</AlertDialogCancel>
                <Button onClick={apply} disabled={loading === "apply"}>
                  {loading === "apply" ? "Memperbarui..." : "Ya, sudah benar — update"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

function IssuesPanel({ issues }: { issues: Preview["issues"] }) {
  const [all, setAll] = useState(false)
  const shown = all ? issues : issues.slice(0, 8)
  return (
    <Panel title="Perlu dirapikan di Excel" description="Baris ini dilewati atau dibaca dengan penyesuaian. Sampaikan ke manager ops supaya diperbaiki di file berikutnya." icon={AlertTriangle}>
      <ul className="divide-y text-[13px]">
        {shown.map((i, n) => (
          <li key={n} className="flex gap-3 py-2 first:pt-0 last:pb-0">
            <span className="w-36 shrink-0 text-muted-foreground">
              {i.sheet}
              {i.row ? ` · baris ${i.row}` : ""}
            </span>
            <span className="min-w-0">{i.message}</span>
          </li>
        ))}
      </ul>
      {issues.length > 8 && (
        <Button variant="link" size="sm" className="mt-2 px-0" onClick={() => setAll(!all)}>
          {all ? "Ringkas" : `Tampilkan semua (${issues.length})`}
        </Button>
      )}
    </Panel>
  )
}

function EntityPanel({
  entity,
  items,
  selected,
  toggle,
}: {
  entity: (typeof ENTITIES)[number]
  items: Change[]
  selected: Set<string>
  toggle: (keys: string[], on: boolean) => void
}) {
  const chosen = items.filter((c) => selected.has(c.key)).length
  return (
    <Panel title={entity.label} description={`${items.length} perbedaan · ${chosen} dipilih`} icon={entity.icon} bodyClassName="space-y-5">
      {KINDS.map((k) => {
        const group = items.filter((c) => c.kind === k.id)
        if (group.length === 0) return null
        return <KindGroup key={k.id} kind={k} items={group} selected={selected} toggle={toggle} />
      })}
    </Panel>
  )
}

function KindGroup({
  kind,
  items,
  selected,
  toggle,
}: {
  kind: (typeof KINDS)[number]
  items: Change[]
  selected: Set<string>
  toggle: (keys: string[], on: boolean) => void
}) {
  // "Hanya di web" dilipat dulu — biasanya cuma informasi
  const [open, setOpen] = useState(kind.id !== "webOnly")
  const [limit, setLimit] = useState(PAGE)
  const selectable = items.filter((c) => c.selectable)
  const allOn = selectable.length > 0 && selectable.every((c) => selected.has(c.key))
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left">
          <StatusPill tone={kind.tone}>
            {kind.label} · {items.length}
          </StatusPill>
          <span className="text-[13px] text-muted-foreground">{open ? kind.hint : "Tampilkan"}</span>
        </button>
        {open && selectable.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => toggle(selectable.map((c) => c.key), !allOn)}>
            {allOn ? "Lepas semua" : "Centang semua"}
          </Button>
        )}
      </div>
      {open && (
        <ul className="mt-2 divide-y rounded-xl border">
          {items.slice(0, limit).map((c) => (
            <ChangeRow key={c.key} change={c} checked={selected.has(c.key)} toggle={toggle} />
          ))}
          {items.length > limit && (
            <li className="p-2 text-center">
              <Button variant="ghost" size="sm" onClick={() => setLimit(limit + 200)}>
                Tampilkan {Math.min(200, items.length - limit)} lagi (dari {items.length - limit})
              </Button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ChangeRow({ change: c, checked, toggle }: { change: Change; checked: boolean; toggle: (keys: string[], on: boolean) => void }) {
  const danger = c.kind === "webOnly" && checked
  return (
    <li className={cn("flex gap-3 px-3.5 py-3", danger && "bg-danger-soft/60")}>
      {c.selectable ? (
        <Checkbox checked={checked} onCheckedChange={(on) => toggle([c.key], !!on)} aria-label={`Pilih ${c.title}`} className="mt-0.5" />
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn("font-medium break-words", danger && "text-danger line-through")}>{c.title}</span>
          {c.subtitle && <span className="text-[13px] text-muted-foreground">{c.subtitle}</span>}
        </div>
        {c.fields && c.fields.length > 0 && (
          <dl className="mt-1.5 grid gap-1 text-[13px]">
            {c.fields.map((f) => (
              <div key={f.field} className="flex flex-wrap items-baseline gap-x-2">
                <dt className="w-28 shrink-0 text-muted-foreground">{f.field}</dt>
                <dd className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                  <span className="break-words text-muted-foreground line-through decoration-muted-foreground/50">{f.before}</span>
                  <ArrowRight className="size-3 shrink-0 self-center text-muted-foreground" />
                  <span className="font-medium break-words">{f.after}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
        {(c.note || c.requires) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {c.note}
            {c.requires && <span>{c.note ? " · " : ""}Ikut menambahkan data yang dibutuhkan</span>}
          </p>
        )}
      </div>
      {c.saldoDelta !== undefined && c.saldoDelta !== 0 && (
        <span className={cn("shrink-0 text-[13px] font-medium tabular-nums", c.saldoDelta > 0 ? "text-success" : "text-danger", !checked && "opacity-40")}>
          {c.saldoDelta > 0 ? "+" : ""}
          {formatRupiah(c.saldoDelta)}
        </span>
      )}
    </li>
  )
}
