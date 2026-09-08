"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
}

/**
 * URL-syncing search input. Debounced; writes `?<paramName>=` and resets `page`.
 * Server components read the param and query PostgreSQL directly.
 */
export function SearchBar({
  placeholder = "Buscar...",
  paramName = "q",
  className,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get(paramName) ?? "");
  const debounced = useDebounce(value, 350);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (debounced) params.set(paramName, debounced);
    else params.delete(paramName);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
      <input
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-9 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      {value && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-stone-100"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
