import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const buildings = await prisma.building.findMany({ include: { tenants: { where: { status: "Active" } } } })
    const tenants = await prisma.tenant.findMany({ include: { building: true }, orderBy: { entry_date: "asc" } })
    const cashflows = await prisma.cashflow.findMany({ orderBy: { transaction_date: "asc" } })

    const wb = XLSX.utils.book_new()

    // 1. Data Kamar
    const wsBuildings = XLSX.utils.json_to_sheet(buildings.map(b => ({
      "Kode Kamar": b.code,
      "Tipe": b.type,
      "Harga Sewa": b.rent_price,
      "Periode": b.rent_period,
      "Status": b.tenants.length > 0 ? "Terisi" : "Kosong"
    })))
    XLSX.utils.book_append_sheet(wb, wsBuildings, "Data Kamar")

    // 2. Data Penghuni
    const wsTenants = XLSX.utils.json_to_sheet(tenants.map(t => ({
      "Nama": t.name,
      "NIK": t.nik,
      "Kamar": t.building?.code || "-",
      "No HP Utama": t.phone_1,
      "No HP Alt": t.phone_2 || "-",
      "Kontak Darurat": t.emergency_contact || "-",
      "Tanggal Masuk": new Date(t.entry_date).toLocaleDateString("id-ID"),
      "Status": t.status
    })))
    XLSX.utils.book_append_sheet(wb, wsTenants, "Data Penghuni")

    // 3. Arus Kas
    const wsCashflow = XLSX.utils.json_to_sheet(cashflows.map(c => ({
      "Tanggal": new Date(c.transaction_date).toLocaleDateString("id-ID"),
      "Tipe": c.type,
      "Kategori": c.category,
      "Nominal": c.amount,
      "Deskripsi": c.description
    })))
    XLSX.utils.book_append_sheet(wb, wsCashflow, "Arus Kas")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Laporan_Razmels_PMS.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses file export" }, { status: 500 })
  }
}
