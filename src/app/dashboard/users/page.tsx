import { getUsers } from "@/app/actions/users"
import { AddUserDialog } from "@/components/add-user-dialog"
import { UsersTable } from "@/components/users-table"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Manajemen Staf — Razmel's Property",
  description: "Kelola akun pengguna dan hak akses sistem."
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Manajemen Staf</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-base">
            Kelola akun dan hak akses pengguna sistem.
          </p>
        </div>
        <AddUserDialog />
      </div>

      <UsersTable users={users} />
    </div>
  )
}
