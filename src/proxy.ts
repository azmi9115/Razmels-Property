import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isOwnerOnlyPath } from "@/lib/nav"

// Semua API di matcher wajib login. /api/export berisi seluruh data (NIK, HP, keuangan), jadi khusus OWNER.
const OWNER_API = ["/api/export"]

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || "razmels_super_secret_key_123!" })
  const isOwner = token?.role === "OWNER"

  if (path.startsWith("/api/")) {
    if (!token) return NextResponse.json({ error: "Harus login" }, { status: 401 })
    if (OWNER_API.some((p) => path.startsWith(p)) && !isOwner) {
      return NextResponse.json({ error: "Khusus pemilik" }, { status: 403 })
    }
    return NextResponse.next()
  }

  if (path.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Staf (ADMIN) yang membuka halaman pemilik lewat URL langsung dikembalikan ke Penghuni
    if (!isOwner && isOwnerOnlyPath(path)) {
      return NextResponse.redirect(new URL("/dashboard/tenants", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/export/:path*", "/api/payments/:path*", "/api/upload/:path*"],
}
