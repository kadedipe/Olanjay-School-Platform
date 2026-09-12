import { InvoiceStatus, PaymentStatus } from "@prisma/client";
export type PaymentAmount={amount:number;status:PaymentStatus};
export function invoiceBalance(amount:number,payments:PaymentAmount[]){const paid=payments.filter(payment=>payment.status===PaymentStatus.SUCCEEDED).reduce((sum,payment)=>sum+payment.amount,0);return{paid,balance:Math.max(0,amount-paid)};}
export function resolvedInvoiceStatus(status:InvoiceStatus,amount:number,payments:PaymentAmount[],dueAt:Date,now=new Date()){if(status===InvoiceStatus.VOID||status===InvoiceStatus.DRAFT)return status;const{paid,balance}=invoiceBalance(amount,payments);if(balance===0)return InvoiceStatus.PAID;if(dueAt.getTime()<now.getTime())return InvoiceStatus.OVERDUE;if(paid>0)return InvoiceStatus.PARTIALLY_PAID;return InvoiceStatus.ISSUED;}
export function formatMoney(amount:number,currency:string){return new Intl.NumberFormat("en-UG",{style:"currency",currency,maximumFractionDigits:2}).format(amount);}
