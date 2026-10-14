import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { AppSidebar, type SessionUser } from "@/components/app-sidebar"
import { Topbar } from "@/components/shell/topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authOptions } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const user: SessionUser = {
    name: session.user.name ?? "Pengguna",
    email: session.user.email ?? "",
    role: (session.user as { role?: string }).role ?? "ADMIN",
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="app-canvas min-w-0">
        <Topbar user={user} />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
