import { PaymentStatus, Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { paymentInputSchema } from "@/lib/academic-validation";
import { authorizeApi } from "@/lib/api-authorization";
import { invoiceBalance, resolvedInvoiceStatus } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.STUDENT, Role.GUARDIAN]);
  if (access.response) return access.response;
  const user = access.user!;
  const where: Prisma.PaymentWhereInput = user.role === Role.ADMIN
    ? {}
    : user.role === Role.STUDENT
      ? { invoice: { student: { userId: user.id } } }
      : { invoice: { student: { guardians: { some: { guardian: { userId: user.id } } } } } };
  const payments = await prisma.payment.findMany({
    where,
    include: { invoice: { include: { student: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ payments });
}

export async function POST(request: Request) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = paymentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payment" }, { status: 400 });
  try {
    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: parsed.data.invoiceId }, include: { payments: true } });
      if (!invoice) throw new FinanceError("Invoice not found", 404);
      if (invoice.status === "VOID" || invoice.status === "DRAFT") throw new FinanceError("Payments can be recorded only against issued invoices", 409);
      const current = invoiceBalance(Number(invoice.amount), invoice.payments.map((item) => ({ amount: Number(item.amount), status: item.status })));
      if (parsed.data.amount > current.balance) throw new FinanceError(`Payment exceeds the outstanding balance of ${current.balance}`, 400);
      const created = await tx.payment.create({ data: { invoiceId: invoice.id, reference: parsed.data.reference, amount: parsed.data.amount, provider: parsed.data.provider, status: PaymentStatus.SUCCEEDED, paidAt: new Date(`${parsed.data.paidAt}T12:00:00.000Z`) } });
      const payments = [...invoice.payments.map((item) => ({ amount: Number(item.amount), status: item.status })), { amount: parsed.data.amount, status: PaymentStatus.SUCCEEDED }];
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: resolvedInvoiceStatus(invoice.status, Number(invoice.amount), payments, invoice.dueAt) } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "payment.recorded", entityType: "Payment", entityId: created.id, metadata: { invoiceId: invoice.id, reference: created.reference, amount: parsed.data.amount, provider: parsed.data.provider } } });
      return created;
    });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (cause) {
    if (cause instanceof FinanceError) return NextResponse.json({ error: cause.message }, { status: cause.status });
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002") return NextResponse.json({ error: "That payment reference is already recorded" }, { status: 409 });
    throw cause;
  }
}

class FinanceError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
