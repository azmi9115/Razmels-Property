"use client"

import Link from "next/link"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, Eye, EyeOff, Loader2, Lock, Mail, ReceiptText, Users } from "lucide-react"
import { BrandMark, BrandWordmark } from "@/components/brand"
import { ThemeToggle } from "@/components/shell/theme-toggle"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError(res.error)
      } else {
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()
        const role = sessionData?.user?.role

        if (role === "ADMIN") {
          router.push("/dashboard/tenants")
        } else {
          router.push("/dashboard")
        }
        router.refresh()
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel brand */}
      <section className="relative hidden overflow-hidden bg-brand-ink p-12 text-white lg:flex lg:flex-col">
        <div className="grid-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-32 -left-20 size-[460px] rounded-full bg-emerald-500/25 blur-[110px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 size-[420px] rounded-full bg-indigo-500/20 blur-[110px]" />

        <Link href="/" className="relative flex items-center gap-3">
          <BrandMark className="size-11" />
          <BrandWordmark />
        </Link>

        <div className="relative my-auto max-w-lg">
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">Portal pengelola</p>
          <h1 className="mt-4 text-5xl leading-[1.05] font-extrabold tracking-tight">
            Semua urusan sewa, <span className="text-emerald-300">satu tempat.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/60">
            Pantau unit, penghuni, pembayaran, dan arus kas tanpa buka-buka Excel lagi.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              { icon: Users, text: "Data penghuni & jatuh tempo otomatis" },
              { icon: ReceiptText, text: "Catat pembayaran, cetak kuitansi" },
              { icon: BarChart3, text: "Laporan arus kas & margin bulanan" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10 backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <f.icon className="size-[18px]" />
                </span>
                <span className="text-sm text-white/80">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/40">© {new Date().getFullYear()} Razmel&apos;s Property</p>
      </section>

      {/* Form */}
      <section className="app-canvas relative flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />
            Beranda
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <BrandMark className="mb-8 size-12 lg:hidden" />
          <h2 className="text-3xl font-bold tracking-tight">Masuk</h2>
          <p className="mt-2 text-sm text-muted-foreground">Gunakan email dan password akun pengelola Anda.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="h-12 w-full rounded-xl border border-input bg-card pr-4 pl-10 text-[15px] shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="h-12 w-full rounded-xl border border-input bg-card pr-12 pl-10 text-[15px] shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:translate-y-px disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memeriksa…
                </>
              ) : (
                <>
                  Masuk ke dashboard
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Lupa password? Minta Owner untuk mengatur ulang lewat menu Manajemen Staf.
          </p>
        </div>
      </section>
    </main>
  )
}
