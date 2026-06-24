import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden bg-slate-50/50">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-y-auto">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-6 shadow-sm z-10 sticky top-0">
            <SidebarTrigger className="-ml-2" />
            <div className="flex flex-1 items-center justify-between">
              <h1 className="font-semibold text-lg tracking-tight text-slate-800">Admin Panel</h1>
              <div className="flex items-center gap-4">
                {/* Placeholder for User Profile / Notifications */}
                <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
              </div>
            </div>
          </header>
          <div className="flex-1 p-6 lg:p-8 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
