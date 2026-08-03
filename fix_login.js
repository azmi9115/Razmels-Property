const fs = require('fs');

let loginContent = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Strip script tags
loginContent = loginContent.replace(/<script>[\s\S]*?<\/script>/gi, '');
loginContent = loginContent.replace(/<style>[\s\S]*?<\/style>/gi, '');

// Replace the form tag with onSubmit logic
loginContent = loginContent.replace(/<form[^>]*>/, '<form className="space-y-6" onSubmit={handleSubmit}>');

// Inject the NextAuth logic and states
loginContent = loginContent.replace('export default function LoginPage() {', `
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
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
`);

// Replace input values with controlled components
loginContent = loginContent.replace(/id="username"([^>]*)>/, 'id="username" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required $1/>');
loginContent = loginContent.replace(/id="password"([^>]*)>/, 'id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required $1/>');

// Display error if exists above username field
loginContent = loginContent.replace(/<div className="space-y-2">\s*<label className="font-label-md/, `
{error && (
  <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm mb-4">
    {error}
  </div>
)}
<div className="space-y-2">
<label className="font-label-md`);

// Update submit button text to use loading state
loginContent = loginContent.replace(/<button([^>]*)type="submit"[^>]*>[\s\S]*?<\/button>/, `
<button $1 type="submit" disabled={loading}>
  {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
  {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
</button>
`);

fs.writeFileSync('src/app/login/page.tsx', loginContent);
console.log('Fixed login page');

let landingContent = fs.readFileSync('src/app/page.tsx', 'utf8');
landingContent = landingContent.replace(/<script id="tailwind-config">[\s\S]*?<\/script>/gi, '');
landingContent = landingContent.replace(/<script>[\s\S]*?<\/script>/gi, '');
landingContent = landingContent.replace(/<style>[\s\S]*?<\/style>/gi, '');

// Fix style object in landing page, there was an issue where the earlier replacement left style={{fontVariationSettings: ''FILL' 1', }}
landingContent = landingContent.replace(/style={{([^}]+)}}/g, (match, p1) => {
    // Basic fix for invalid JSON in style
    return match.replace(/'FILL' 1'/g, "'\"FILL\" 1'");
});
landingContent = landingContent.replace(/'\"FILL\" 1'/g, '"\\"FILL\\" 1"');

// Fix unclosed head/meta tags if any, though htmlToJsx self closed them
fs.writeFileSync('src/app/page.tsx', landingContent);
console.log('Fixed landing page');
