import type { PaymentStatus } from "@/constants/statuses";

/** Round to 2 decimals avoiding binary float drift (e.g. 1.005 -> 1.01). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface ItemInput {
  quantity: number;
  unit_price: number;
  discount?: number;
}

/** item subtotal = quantity * unit_price - discount (never below 0). */
export function calculateItemSubtotal(item: ItemInput): number {
  const gross = item.quantity * item.unit_price;
  return round2(Math.max(0, gross - (item.discount ?? 0)));
}

export interface BudgetTotalsInput {
  items: ItemInput[];
  discount?: number;
  /** Tax as a percentage of (subtotal - discount), e.g. 21 for 21% IVA. */
  taxRate?: number;
}

export interface BudgetTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/** Single source of truth for budget totals. */
export function calculateBudgetTotals({
  items,
  discount = 0,
  taxRate = 0,
}: BudgetTotalsInput): BudgetTotals {
  const subtotal = round2(
    items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0),
  );
  const safeDiscount = round2(Math.min(Math.max(0, discount), subtotal));
  const taxable = subtotal - safeDiscount;
  const tax = round2(taxable * (Math.max(0, taxRate) / 100));
  const total = round2(taxable + tax);
  return { subtotal, discount: safeDiscount, tax, total };
}

/** Derive payment status from the real payments against a total. */
export function computePaymentStatus(
  total: number,
  totalPaid: number,
  paymentCount: number,
): PaymentStatus {
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid >= total) return "fully_paid";
  // Partial: a single first payment reads as an advance.
  if (paymentCount <= 1) return "advance_received";
  return "partially_paid";
}

export function calculateBalance(total: number, totalPaid: number): number {
  return round2(Math.max(0, total - totalPaid));
}
