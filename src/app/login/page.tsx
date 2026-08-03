"use client";

import Link from "next/link";
import Image from "next/image";


import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      

<main className="flex min-h-screen">

<section className="relative hidden lg:flex lg:w-1/2 overflow-hidden items-center justify-center">

<div className="absolute top-8 left-8 z-50 animate-in fade-in slide-in-from-top-8 duration-1000">
<img alt="Razmel's Property Logo" className="h-32 md:h-40 w-auto object-contain mix-blend-screen hover:scale-105 transition-transform duration-500 rounded-3xl" src="/logo-razmel.png"/>
</div>

<div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-110" data-alt="A cinematic, low-angle photograph of a modern glass and steel luxury residential skyscraper against a twilight sky. The building is illuminated with warm interior lights that contrast against the cool, deep blue atmosphere. The architectural lines are sharp and minimalist, reflecting a high-end cyber-professional aesthetic with deep shadows and sophisticated atmosphere." style={{"backgroundImage": "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBLTzt2JlgR-e2mjlfNG7N0h1F5dOx9Ey3SV-xRBfKfWWzeY1D4PCxSW57MxTcyXKi5kRwCeExgCP13BRsdXkJOyHoHnvdY4ZMh82i-MRQhh1AQ6yKn6evtTv-aQl53AfdOtixHdehaW8cMx5iOsYGBR3Czpn7DvxOZ1yfJJV0QQjIchhImPoY66jQw1ddu_shYUbrP9MgXX0soSsXIhhSeWFC3BBGJlFYc-hQtSY0rYaqYP3aN9GXxOA')", }}>
</div>

<div className="absolute inset-0 bg-gradient-to-tr from-nav-bg/90 via-nav-bg/60 to-transparent z-10"></div>

<div className="relative z-20 px-margin-desktop text-white max-w-xl">
<h1 className="font-headline-xl text-headline-xl mb-6 leading-tight">
                    Redefining Property <br/><span className="text-secondary-fixed-dim">Management</span>.
                </h1>
<p className="font-body-lg text-body-lg text-nav-text mb-12 max-w-md">
                    Seamless operations, intelligent analytics, and elevated living experiences. Designed for the modern landlord.
                </p>

<div className="flex flex-wrap gap-4">
<div className="glass-overlay px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
<span className="material-symbols-outlined text-sm">verified_user</span>
<span className="text-label-md font-label-md">Secure Platform</span>
</div>
<div className="glass-overlay px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
<span className="material-symbols-outlined text-sm">monitoring</span>
<span className="text-label-md font-label-md">Real-time Analytics</span>
</div>
</div>
</div>

<div className="absolute bottom-12 left-margin-desktop z-20">
<p className="text-slate-text text-body-md">© 2024 Razmel’s Property Management. All rights reserved.</p>
</div>
</section>

<section className="w-full lg:w-1/2 bg-surface-bright flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop relative">

<a href="/" className="absolute top-8 left-6 md:left-8 flex items-center gap-2 font-label-md text-label-md text-slate-text hover:text-primary transition-colors uppercase tracking-widest z-50 cursor-pointer pointer-events-auto">
  <span className="material-symbols-outlined text-lg">arrow_back</span>
  Back to Profile
</a>

<div className="lg:hidden mb-12 flex justify-center w-full mt-16">
<img alt="Razmel's Property Logo" className="h-16 w-auto object-contain" src="/logo-razmel.png"/>
</div>
<div className="w-full max-w-md space-y-8 mt-8 lg:mt-0">

<div className="text-center lg:text-left">
<h2 className="font-headline-lg text-headline-lg text-primary mb-2">Welcome back</h2>
<p className="font-body-md text-body-md text-slate-text">Please enter your credentials to access the admin panel.</p>
</div>

<form className="space-y-6" onSubmit={handleSubmit}>


{error && (
  <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm mb-4">
    {error}
  </div>
)}
<div className="space-y-2">
<label className="font-label-md text-label-md text-primary uppercase tracking-wider block" htmlFor="username">Username</label>
<div className="relative group">
<span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-text group-focus-within:text-secondary transition-colors">
<span className="material-symbols-outlined text-xl">person</span>
</span>
<input className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-border-subtle rounded-xl font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white focus:bg-white transition-all duration-300" id="username" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required  placeholder="Enter your username" />
</div>
</div>

<div className="space-y-2">
<div className="flex justify-between items-center">
<label className="font-label-md text-label-md text-primary uppercase tracking-wider block" htmlFor="password">Password</label>
<a className="text-label-md font-label-md text-secondary hover:underline transition-all" href="#">Forgot Password?</a>
</div>
<div className="relative group">
<span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-text group-focus-within:text-secondary transition-colors">
<span className="material-symbols-outlined text-xl">lock</span>
</span>
<input className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-border-subtle rounded-xl font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white focus:bg-white transition-all duration-300" id="password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required  placeholder="••••••••" />
<button className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-text hover:text-primary transition-colors" type="button">
<span className="material-symbols-outlined text-xl">visibility</span>
</button>
</div>
</div>

<div className="flex items-center">
<label className="flex items-center cursor-pointer group">
<input className="w-5 h-5 rounded-md border-border-subtle text-secondary focus:ring-secondary cursor-pointer transition-colors" type="checkbox"/>
<span className="ml-3 font-body-md text-body-md text-slate-text group-hover:text-primary transition-colors">Remember me on this device</span>
</label>
</div>


<button className="w-full py-4 px-6 bg-primary hover:bg-on-primary-container text-white font-headline-md text-headline-md rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 whitespace-nowrap flex-nowrap" type="submit" disabled={loading}>
  {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
  {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
</button>

</form>

<div className="relative py-4">
<div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
<div className="relative flex justify-center text-label-md font-label-md uppercase tracking-widest"><span className="bg-surface-bright px-4 text-slate-text">Identity Verified</span></div>
</div>

<div className="space-y-6 text-center">
<div className="flex items-center justify-center gap-2 p-3 bg-surface-container-low rounded-lg inline-flex mx-auto">
<span className="material-symbols-outlined text-secondary text-lg">dark_mode</span>
<span className="text-body-md text-slate-text">Dark Mode available in dashboard</span>
</div>
<div className="flex justify-center gap-6">
<a className="text-body-md text-slate-text hover:text-primary transition-colors" href="#">Help Center</a>
<span className="text-border-subtle">|</span>
<a className="text-body-md text-slate-text hover:text-primary transition-colors" href="#">Privacy Policy</a>
</div>
</div>
</div>
</section>
</main>

<div className="fixed inset-0 z-50 flex items-center justify-center bg-nav-bg/40 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300" id="success-feedback">
<div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center scale-90 transition-transform duration-300" id="feedback-card">
<div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-secondary text-4xl" style={{"fontVariationSettings": "'FILL' 1", }}>check_circle</span>
</div>
<div>
<h3 className="font-headline-md text-headline-md text-primary">Authenticating...</h3>
<p className="font-body-md text-body-md text-slate-text mt-1">Redirecting you to the command center.</p>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-secondary animate-[loading_2s_ease-in-out]"></div>
</div>
</div>
</div>



    </>
  );
}
