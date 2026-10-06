"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Role } from "@prisma/client";
import { ChevronDownIcon, LogOutIcon, MenuIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import type { NavItem } from "./app-nav";
import { RoleBadge } from "./role-badge";
import { APP_NAME } from "@/lib/brand";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({
  user,
  items,
  homeHref,
}: {
  user: { name: string; role: Role };
  items: NavItem[];
  homeHref: string;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <header className="pointer-events-none sticky top-3 z-40 mx-auto mt-3 w-full max-w-[1280px] px-4">
      <div className="pointer-events-auto flex h-14 items-center gap-2 rounded-full border bg-surface/85 pr-2 pl-5 shadow-md backdrop-blur">
        <Link
          href={homeHref}
          className="mr-2 rounded-full text-lg font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          {APP_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring",
                  active
                    ? "bg-ink text-white hover:text-white"
                    : "text-foreground/75 hover:bg-primary-soft hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <RoleBadge role={user.role} className="hidden sm:inline-flex" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" aria-label={`Account menu, ${user.name}`} className="max-w-48 px-3">
                  <UserIcon aria-hidden />
                  <span className="hidden truncate sm:inline">{user.name}</span>
                  <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-text-muted" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                disabled={pending}
                onClick={() => startTransition(() => logout())}
              >
                <LogOutIcon aria-hidden />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
                  <MenuIcon aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <DropdownMenuItem
                    key={item.href}
                    render={<Link href={item.href} aria-current={active ? "page" : undefined} />}
                    className={cn(active && "bg-ink text-white focus:bg-ink focus:text-white")}
                  >
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
