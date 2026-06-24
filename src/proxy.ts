import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  if (path.startsWith("/dashboard") || path === "/") {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || "razmels_super_secret_key_123!" })
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/"
  ]
}
