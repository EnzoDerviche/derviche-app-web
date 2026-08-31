import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Inbox className="size-8 text-muted" aria-hidden />
      <p className="text-muted">{title}</p>
      {action}
    </div>
  );
}
