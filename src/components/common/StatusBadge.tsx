import { Badge } from "@/components/ui/badge";
import {
  BUDGET_STATUS_META,
  PAYMENT_STATUS_META,
  type BudgetStatus,
  type PaymentStatus,
} from "@/constants/statuses";

export function StatusBadge({ status }: { status: BudgetStatus }) {
  const meta = BUDGET_STATUS_META[status] ?? { label: status, className: "bg-stone-200 text-stone-700" };
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status] ?? { label: status, className: "bg-stone-200 text-stone-700" };
  return <Badge className={meta.className}>{meta.label}</Badge>;
}
