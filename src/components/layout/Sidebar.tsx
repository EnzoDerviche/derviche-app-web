"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCog, FileText, TrendingUp, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/administradores", label: "Administradores", icon: UserCog },
  { href: "/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/ganancias", label: "Ganancias", icon: TrendingUp },
];

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-stone-800",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-stone-700 p-3">
      <p className="mb-2 truncate px-3 text-xs text-stone-400" title={userEmail}>
        {userEmail}
      </p>
      <form action={logout}>
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-stone-800">
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <span className="font-bold text-sm">
          DERVICHE <span className="text-accent">CONSTRUCCIONES</span>
        </span>
        <button aria-label="Abrir menú" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar md:flex">
        <div className="p-4 text-sm font-bold text-sidebar-foreground">
          DERVICHE <span className="text-accent">CONSTRUCCIONES</span>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-sidebar">
            <div className="flex items-center justify-between p-4 text-sm font-bold text-sidebar-foreground">
              <span>DERVICHE <span className="text-accent">CONSTRUCCIONES</span></span>
              <button aria-label="Cerrar menú" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
