"use client"

import { useState } from "react"
import { EditUserDialog } from "@/components/edit-user-dialog"
import { Button } from "@/components/ui/button"
import { Crown, Pencil, UserCog } from "lucide-react"
import { StatusPill } from "@/components/status-pill"
import { formatDate, initials } from "@/lib/format"

type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

export function UsersTable({ users }: { users: User[] }) {
  const [editUser, setEditUser] = useState<User | null>(null)

  if (users.length === 0) {
    return (
      <section className="surface flex flex-col items-center gap-2 px-6 py-16 text-center">
        <UserCog className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Belum ada akun pengguna. Tambah akun pertama!</p>
      </section>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => {
          const isOwner = user.role === "OWNER"
          return (
            <article key={user.id} className="surface relative flex flex-col gap-5 overflow-hidden p-5">
              {isOwner && <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-emerald-400/15 blur-2xl" />}
              <div className="relative flex items-start gap-4">
                <span
                  className={
                    isOwner
                      ? "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-emerald-950"
                      : "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-bold text-muted-foreground"
                  }
                >
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <StatusPill tone="success" icon={Crown}>Owner</StatusPill>
                  ) : (
                    <StatusPill tone="info" icon={UserCog}>Admin</StatusPill>
                  )}
                  <span className="text-xs text-muted-foreground">sejak {formatDate(user.createdAt)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditUser(user)} className="gap-1.5">
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => { if (!open) setEditUser(null) }}
        />
      )}
    </>
  )
}
