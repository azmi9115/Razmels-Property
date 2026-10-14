import { getUsers } from "@/app/actions/users"
import { AddUserDialog } from "@/components/add-user-dialog"
import { UsersTable } from "@/components/users-table"
import { PageHeader } from "@/components/page-header"

export const metadata = {
  title: "Manajemen Staf",
  description: "Kelola akun pengguna dan hak akses sistem."
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Administrasi"
        title="Manajemen Staf"
        description="Kelola akun dan hak akses. Owner punya akses penuh, Admin hanya menu operasional."
        actions={<AddUserDialog />}
      />

      <UsersTable users={users} />
    </div>
  )
}
