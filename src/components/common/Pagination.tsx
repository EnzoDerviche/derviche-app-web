import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  /** Existing query string (without page), e.g. "q=abc&status=sent". */
  query: string;
  basePath: string;
}

export function Pagination({ page, pageSize, total, query, basePath }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 pt-4 text-sm">
      <span className="text-muted">
        {total} resultado{total === 1 ? "" : "s"} · página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={href(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && "pointer-events-none opacity-50",
          )}
        >
          Anterior
        </Link>
        <Link
          href={href(page + 1)}
          aria-disabled={page >= totalPages}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= totalPages && "pointer-events-none opacity-50",
          )}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
