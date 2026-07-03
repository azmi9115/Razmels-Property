import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payments } = body;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty payments data" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(async (tx) => {
      const createdPayments = [];
      const createdCashflows = [];

      for (const p of payments) {
        // Create the payment
        const payment = await tx.payment.create({
          data: {
            tenant_id: p.tenant_id,
            amount: p.amount,
            transfer_date: new Date(p.transfer_date),
            rent_duration_months: p.rent_duration_months,
            rent_end_date: new Date(p.rent_end_date),
          },
          include: {
            tenant: {
              include: { building: true },
            },
          },
        });

        // Add to cashflow
        const cashflow = await tx.cashflow.create({
          data: {
            type: "Pemasukan",
            category: "Sewa",
            transaction_date: new Date(p.transfer_date),
            description: `Pembayaran sewa dari ${payment.tenant.name} (${
              payment.tenant.building?.code || "Kamar/Kios"
            })`,
            amount: p.amount,
          },
        });

        createdPayments.push(payment);
        createdCashflows.push(cashflow);
      }

      return { createdPayments, createdCashflows };
    });

    return NextResponse.json({ success: true, count: results.createdPayments.length });
  } catch (error) {
    console.error("Error bulk insert payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
