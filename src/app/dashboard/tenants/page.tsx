import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Phone, FileText } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddTenantDialog } from "@/components/add-tenant-dialog"
import { TenantActions } from "@/components/tenant-actions"
import { SearchBar } from "@/components/search-bar"
import { PaginationControls } from "@/components/pagination-controls"

export default async function TenantsPage(props: { searchParams?: Promise<{ query?: string, page?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const limit = 15;
  
  const tenants = await prisma.tenant.findMany({
    include: {
      building: true,
      payments: {
        orderBy: { rent_end_date: "desc" },
        take: 1
      }
    },
    where: query ? {
      OR: [
        { name: { contains: query } },
        { nik: { contains: query } },
        { building: { code: { contains: query } } }
      ]
    } : {},
    orderBy: { entry_date: "desc" }
  });

  const availableBuildings = await prisma.building.findMany({
    where: {
      tenants: {
        none: { status: "Active" }
      }
    }
  });

  const totalPages = Math.ceil(tenants.length / limit);
  const paginatedTenants = tenants.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Daftar Penghuni
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Kelola data penyewa yang aktif maupun yang sudah keluar. (Live Database)
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar placeholder="Cari nama, NIK, atau kamar..." />
          <AddTenantDialog availableBuildings={availableBuildings} />
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Database Penghuni
          </CardTitle>
          <CardDescription>Semua data penghuni yang pernah menyewa properti Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">Nama Lengkap</TableHead>
                  <TableHead className="font-semibold text-slate-700">Kamar/Properti</TableHead>
                  <TableHead className="font-semibold text-slate-700">Kontak</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tgl Masuk</TableHead>
                  <TableHead className="font-semibold text-slate-700">Jatuh Tempo</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                      Tidak ada data penghuni.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTenants.map((tenant) => {
                    const building = tenant.building;

                    return (
                    <TableRow key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-slate-900">{tenant.name}</div>
                        <div className="text-xs text-slate-500 font-medium font-mono mt-0.5">NIK: {tenant.nik}</div>
                        {tenant.id_card_url && (
                          <a href={tenant.id_card_url} target="_blank" rel="noreferrer" className="text-xs text-primary mt-1.5 inline-flex items-center gap-1 hover:underline">
                            <FileText className="w-3.5 h-3.5" /> Lihat KTP
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        {building ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{building.code}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {building.type}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Tidak ada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {tenant.phone_1}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium">
                        {new Date(tenant.entry_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const dueDate = tenant.payments && tenant.payments.length > 0 
                            ? tenant.payments[0].rent_end_date 
                            : tenant.entry_date;
                            
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          const due = new Date(dueDate);
                          due.setHours(0, 0, 0, 0);
                          
                          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          
                          const isActive = tenant.status === "Active";
                          const isLate = diffDays < 0 && isActive;
                          const isDueSoon = diffDays >= 0 && diffDays <= 7 && isActive;
                          
                          let textColor = 'text-slate-500';
                          if (isLate) textColor = 'text-red-600 font-bold';
                          else if (isDueSoon) textColor = 'text-amber-600 font-bold';
                          else if (isActive) textColor = 'text-slate-700 font-medium';

                          return (
                            <div>
                              <div className={`${textColor}`}>
                                {new Date(dueDate).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              {isActive && (
                                <div className="mt-1 flex items-center">
                                  {isLate && (
                                    <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded">
                                      Terlewat {Math.abs(diffDays)} Hari
                                    </span>
                                  )}
                                  {isDueSoon && diffDays === 0 && (
                                    <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded">
                                      Hari Ini
                                    </span>
                                  )}
                                  {isDueSoon && diffDays > 0 && (
                                    <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded">
                                      Sisa {diffDays} Hari
                                    </span>
                                  )}
                                  {!isLate && !isDueSoon && (
                                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider bg-emerald-100 px-1.5 py-0.5 rounded">
                                      Sisa {diffDays} Hari
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant.status === "Active" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700 border-transparent rounded-full px-3 py-0.5">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-600 border-transparent rounded-full px-3 py-0.5">
                            Tidak Aktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <TenantActions tenant={tenant} availableBuildings={availableBuildings} isActive={tenant.status === "Active"} />
                      </TableCell>
                    </TableRow>
                  );
                }))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls totalPages={totalPages} currentPage={currentPage} />
        </CardContent>
      </Card>
    </div>
  )
}
