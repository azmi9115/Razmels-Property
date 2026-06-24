import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddBuildingDialog } from "@/components/add-building-dialog"
import { BuildingActions } from "@/components/building-actions"
import { SearchBar } from "@/components/search-bar"

export default async function BuildingsPage(props: { searchParams?: Promise<{ query?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";

  const buildings = await prisma.building.findMany({
    include: {
      tenants: {
        where: { status: "Active" }
      }
    },
    where: query ? {
      OR: [
        { code: { contains: query } },
        { type: { contains: query } }
      ]
    } : {},
    orderBy: { code: 'asc' }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Manajemen Bangunan
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Kelola data properti, kamar kos, dan rumah kontrakan. (Live Database)
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar placeholder="Cari kode atau tipe..." />
          <AddBuildingDialog />
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Daftar Properti
          </CardTitle>
          <CardDescription>Semua properti yang Anda kelola beserta statusnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">Kode Kamar</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tipe</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tarif Sewa</TableHead>
                  <TableHead className="font-semibold text-slate-700">Periode</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildings.map((building) => {
                  const isOccupied = building.tenants.length > 0;

                  return (
                    <TableRow key={building.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{building.code}</TableCell>
                      <TableCell>
                        <Badge variant={building.type === "Kontrakan" ? "default" : "secondary"} className="rounded-md">
                          {building.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">Rp {building.rent_price.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-slate-500">{building.rent_period}</TableCell>
                      <TableCell>
                        {isOccupied ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700 border-transparent rounded-full px-3 py-0.5">
                            Terisi ({building.tenants[0].name})
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700 border-transparent rounded-full px-3 py-0.5">
                            Tersedia
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <BuildingActions building={building} isOccupied={isOccupied} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
