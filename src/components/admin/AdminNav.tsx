"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Produtos" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/settings", label: "Configurações" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex w-56 flex-shrink-0 flex-col border-r border-border bg-surface px-3 py-4">
      <p className="mb-4 px-2 text-sm font-bold text-foreground">Painel</p>
      <ul className="flex flex-1 flex-col gap-1">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                  active ? "bg-brand/10 font-medium text-brand" : "text-foreground/70 hover:bg-black/5"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-foreground/60 transition-colors duration-150 hover:bg-black/5"
      >
        Sair
      </button>
    </nav>
  );
}
