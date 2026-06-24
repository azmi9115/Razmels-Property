"use client"

import { useState } from "react"
import { EditUserDialog } from "@/components/edit-user-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Crown, UserCog } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

export function UsersTable({ users }: { users: User[] }) {
  const [editUser, setEditUser] = useState<User | null>(null)

  return (
    <>
      <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-6 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    Nama
                  </th>
                  <th className="text-left py-3 px-6 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-6 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-3 px-6 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    Dibuat
                  </th>
                  <th className="text-right py-3 px-6 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{user.email}</td>
                    <td className="py-4 px-6">
                      {user.role === "OWNER" ? (
                        <Badge className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100 gap-1">
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 gap-1">
                          <UserCog className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditUser(user)}
                        className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <UserCog className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Belum ada akun pengguna. Tambah akun pertama!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
