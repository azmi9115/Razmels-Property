"use server"

import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { allocationGroup, GROUP_OPTIONS } from "@/lib/allocation"

// Tebakan kelompok dari Gemini (free tier Google AI Studio) untuk transaksi non-bisnis yang belum punya kelompok.
// Yang dikirim hanya tipe, kategori, deskripsi, dan nominal transaksi pribadi — bukan data penghuni/sewa.
// Free tier: Google boleh memakai isi permintaan untuk melatih modelnya, jadi angka panjang (NIK, no. HP/rekening) disamarkan.
const MODELS = [...new Set([process.env.GEMINI_MODEL, "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"].filter((m): m is string => !!m))]
const MAX_ITEMS = 40
const FALLBACK = new Set(["Lain-lain", "Pemasukan lain"])
const isPlaceholder = (d: string) => d.length < 3 || /^(-+|x+|tba|\?+|\.+)$/.test(d)
const mask = (d: string) => d.replace(/\d[\d .-]{6,}\d/g, "#")

export type AiSuggestion = { type: string; description: string; count: number; total: number; keyword: string; group: string; reason: string }

export async function suggestGroupsAI(): Promise<{ error: string } | { suggestions: AiSuggestion[]; asked: number }> {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string } | undefined)?.role !== "OWNER") return { error: "Khusus pemilik" }
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { error: "GEMINI_API_KEY belum diisi di server" }

  const [cashflows, taught] = await Promise.all([prisma.cashflow.findMany(), prisma.groupRule.findMany()])

  // Deskripsi unik yang masih jatuh ke "Lain-lain"/"Pemasukan lain", nominal terbesar dulu
  const items = new Map<string, { type: string; category: string; description: string; count: number; total: number }>()
  for (const cf of cashflows) {
    const g = allocationGroup(cf, taught)
    if (!g || !FALLBACK.has(g)) continue
    const description = cf.description.trim().toLowerCase()
    if (isPlaceholder(description)) continue
    const key = `${cf.type}|${description}`
    const item = items.get(key) ?? { type: cf.type, category: cf.category, description, count: 0, total: 0 }
    item.count++
    item.total += cf.amount
    items.set(key, item)
  }
  const list = [...items.values()].sort((a, b) => b.total - a.total).slice(0, MAX_ITEMS)
  if (list.length === 0) return { suggestions: [], asked: 0 }

  const prompt = [
    "Kamu membantu pemilik usaha kos/kontrakan di Indonesia merapikan catatan keuangan PRIBADI keluarganya.",
    "Untuk tiap transaksi di bawah, pilih kelompok yang paling cocok HANYA dari daftar kelompok untuk tipenya.",
    `Kelompok Pengeluaran: ${GROUP_OPTIONS.Pengeluaran.filter((g) => !FALLBACK.has(g)).join("; ")}.`,
    `Kelompok Pemasukan: ${GROUP_OPTIONS.Pemasukan.filter((g) => !FALLBACK.has(g)).join("; ")}.`,
    'Kalau tidak yakin, isi group dengan "Tidak yakin". Jangan menebak berdasarkan nama orang saja.',
    "keyword: potongan kata huruf kecil (min. 3 huruf) yang benar-benar ada di deskripsi dan kemungkinan muncul lagi di transaksi serupa (mis. \"apotek\", \"kupon\"); kalau tidak ada, pakai deskripsi utuh.",
    "reason: alasan singkat dalam bahasa Indonesia (maks. 12 kata).",
    "Transaksi (nomor | tipe | kategori | deskripsi | jumlah kali | total Rp):",
    ...list.map((it, i) => `${i} | ${it.type} | ${it.category} | ${mask(it.description)} | ${it.count} | ${Math.round(it.total)}`),
  ].join("\n")

  // Model gratis kadang penuh (503) atau dihentikan (404) — coba model berikutnya
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { index: { type: "INTEGER" }, group: { type: "STRING" }, keyword: { type: "STRING" }, reason: { type: "STRING" } },
          required: ["index", "group", "keyword", "reason"],
        },
      },
    },
  })
  let text: string | null = null
  let lastError = ""
  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(45_000),
        body,
      })
      if (res.status === 403) return { error: "API key Gemini ditolak — cek lagi GEMINI_API_KEY di .env server." }
      if (!res.ok) {
        lastError =
          res.status === 429 ? "batas gratis sedang habis" : res.status === 503 ? "sedang penuh" : `${res.status}: ${(await res.text()).slice(0, 150)}`
        if ([404, 429, 500, 503].includes(res.status)) continue
        return { error: `Gemini menolak permintaan (${lastError})` }
      }
      const data = await res.json()
      text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
      break
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  if (text === null) return { error: `Gemini belum bisa dipakai (${lastError}) — coba lagi beberapa menit lagi.` }

  let answers: { index: number; group: string; keyword: string; reason: string }[]
  try {
    answers = JSON.parse(text)
    if (!Array.isArray(answers)) throw new Error("bukan daftar")
  } catch {
    return { error: "Jawaban Gemini tidak bisa dibaca — coba lagi." }
  }

  // Jawaban AI tidak dipercaya mentah-mentah: kelompok harus ada di daftar, keyword harus ada di deskripsinya
  const suggestions: AiSuggestion[] = []
  const seen = new Set<number>()
  for (const a of answers) {
    const it = list[a?.index]
    if (!it || seen.has(a.index) || !GROUP_OPTIONS[it.type]?.includes(a.group) || FALLBACK.has(a.group)) continue
    seen.add(a.index)
    const kw = String(a.keyword ?? "").trim().toLowerCase()
    const keyword = kw.length >= 3 && !isPlaceholder(kw) && it.description.includes(kw) ? kw : it.description
    suggestions.push({ type: it.type, description: it.description, count: it.count, total: it.total, keyword, group: a.group, reason: String(a.reason ?? "").slice(0, 120) })
  }
  return { suggestions, asked: list.length }
}
