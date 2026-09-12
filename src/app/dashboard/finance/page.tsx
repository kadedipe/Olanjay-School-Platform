import Link from "next/link";
import { Prisma, Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { formatMoney, invoiceBalance, resolvedInvoiceStatus } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoice-form";
import { PaymentForm } from "@/components/payment-form";
import { InvoiceStatusButton } from "@/components/invoice-status-button";

export default async function FinancePage() {
  const user = await requireUser([Role.ADMIN, Role.STUDENT, Role.GUARDIAN]);
  const admin = user.role === Role.ADMIN;
  const where: Prisma.InvoiceWhereInput = admin ? {} : user.role === Role.STUDENT
    ? { student: { userId: user.id } }
    : { student: { guardians: { some: { guardian: { userId: user.id } } } } };
  const [invoices, students, terms] = await Promise.all([
    prisma.invoice.findMany({ where, include: { student: { include: { user: true } }, term: { include: { academicYear: true } }, payments: { orderBy: { paidAt: "desc" } } }, orderBy: { createdAt: "desc" } }),
    admin ? prisma.student.findMany({ where: { enrollments: { some: { status: "ENROLLED" } } }, include: { user: true }, orderBy: { admissionNumber: "asc" } }) : Promise.resolve([]),
    admin ? prisma.term.findMany({ include: { academicYear: true }, orderBy: { startsAt: "desc" } }) : Promise.resolve([]),
  ]);
  const rows = invoices.map((invoice) => {
    const amounts = invoice.payments.map((payment) => ({ amount: Number(payment.amount), status: payment.status }));
    return { ...invoice, ...invoiceBalance(Number(invoice.amount), amounts), resolvedStatus: resolvedInvoiceStatus(invoice.status, Number(invoice.amount), amounts, invoice.dueAt) };
  });
  const outstanding = rows.filter((row) => row.balance > 0 && row.resolvedStatus !== "VOID");
  const paid = rows.filter((row) => row.resolvedStatus === "PAID").length;
  const overdue = rows.filter((row) => row.resolvedStatus === "OVERDUE").length;
  const paymentCount = rows.reduce((sum, row) => sum + row.payments.filter((payment) => payment.status === "SUCCEEDED").length, 0);
  return <main>
    <header><div><p className="eyebrow">FEES &amp; PAYMENTS</p><h1>{admin ? "Student finance" : "My financial account"}</h1><p>{admin ? "Issue student invoices, record payments, and monitor balances." : "Review charges, payment history, due dates, and outstanding balances."}</p></div></header>
    <section className="metrics">
      <div className="metric"><p>Invoices</p><strong>{rows.length}</strong><small>Visible account records</small></div>
      <div className="metric"><p>Outstanding</p><strong>{outstanding.length}</strong><small>Invoices with balances</small></div>
      <div className="metric"><p>Paid</p><strong>{paid}</strong><small>Settled invoices</small></div>
      <div className="metric"><p>Overdue</p><strong>{overdue}</strong><small>{paymentCount} successful payments</small></div>
    </section>
    {admin && <>
      <section className="panel managementPanel"><div className="panelHead"><div><p className="eyebrow">NEW CHARGE</p><h2>Issue invoice</h2></div></div>
        {students.length && terms.length ? <InvoiceForm students={students.map((student) => ({ id: student.id, label: `${student.admissionNumber} — ${student.user.firstName} ${student.user.lastName}` }))} terms={terms.map((term) => ({ id: term.id, label: `${term.academicYear.name} — ${term.name}` }))} /> : <p>An enrolled student and academic term are required.</p>}
      </section>
      <section className="panel managementPanel"><div className="panelHead"><div><p className="eyebrow">PAYMENT ENTRY</p><h2>Record payment</h2></div></div>
        {outstanding.length ? <PaymentForm invoices={outstanding.map((invoice) => ({ id: invoice.id, balance: invoice.balance, label: `${invoice.number} — ${invoice.student.user.firstName} ${invoice.student.user.lastName} — ${formatMoney(invoice.balance, invoice.currency)}` }))} /> : <p>There are no outstanding issued invoices.</p>}
      </section>
    </>}
    <section className="panel tablePanel"><div className="panelHead"><div><h2>Invoice register</h2><p>{rows.length} invoice{rows.length === 1 ? "" : "s"}</p></div></div>
      {rows.length ? <div className="tableWrap"><table><thead><tr><th>Invoice</th><th>Student</th><th>Term</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due</th><th>Status</th>{admin && <th>Action</th>}</tr></thead><tbody>
        {rows.map((invoice) => <tr key={invoice.id}><td><Link href={`/dashboard/finance/invoices/${invoice.id}`}><strong>{invoice.number}</strong></Link><small>View printable invoice</small></td><td>{invoice.student.user.firstName} {invoice.student.user.lastName}<small>{invoice.student.admissionNumber}</small></td><td>{invoice.term.name}<small>{invoice.term.academicYear.name}</small></td><td>{formatMoney(Number(invoice.amount), invoice.currency)}</td><td>{formatMoney(invoice.paid, invoice.currency)}</td><td><strong>{formatMoney(invoice.balance, invoice.currency)}</strong></td><td>{invoice.dueAt.toLocaleDateString("en-UG")}</td><td><span className={`status status${invoice.resolvedStatus}`}>{invoice.resolvedStatus.toLowerCase().replace("_", " ")}</span></td>{admin && <td>{invoice.resolvedStatus === "VOID" ? <InvoiceStatusButton id={invoice.id} status="ISSUED" /> : invoice.paid === 0 && <InvoiceStatusButton id={invoice.id} status="VOID" />}</td>}</tr>)}
      </tbody></table></div> : <div className="emptyState"><h2>No invoices</h2><p>{admin ? "Issue the first student invoice above." : "No financial charges are available for this account."}</p></div>}
    </section>
    <section className="panel tablePanel financePayments"><div className="panelHead"><div><h2>Payment history</h2><p>{paymentCount} successful payment{paymentCount === 1 ? "" : "s"}</p></div></div>
      {paymentCount ? <div className="tableWrap"><table><thead><tr><th>Reference</th><th>Invoice</th><th>Student</th><th>Amount</th><th>Method</th><th>Paid</th><th>Status</th></tr></thead><tbody>
        {rows.flatMap((invoice) => invoice.payments).map((payment) => { const invoice = rows.find((row) => row.id === payment.invoiceId)!; return <tr key={payment.id}><td><Link href={`/dashboard/finance/payments/${payment.id}`}><strong>{payment.reference}</strong></Link><small>View printable receipt</small></td><td>{invoice.number}</td><td>{invoice.student.user.firstName} {invoice.student.user.lastName}</td><td>{formatMoney(Number(payment.amount), invoice.currency)}</td><td>{payment.provider}</td><td>{payment.paidAt?.toLocaleDateString("en-UG") ?? "—"}</td><td><span className={`status status${payment.status}`}>{payment.status.toLowerCase()}</span></td></tr>; })}
      </tbody></table></div> : <div className="emptyState"><h2>No payments</h2></div>}
    </section>
  </main>;
}
