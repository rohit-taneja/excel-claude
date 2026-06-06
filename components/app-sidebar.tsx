"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  PencilLine,
  Settings,
  Sheet as SheetIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: PencilLine },
  { href: "/tests", label: "Tests", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  user,
  onNavigate,
}: {
  user: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || user.role === "admin");

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <SheetIcon className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Excel Skills</p>
          <p className="text-xs text-muted-foreground">Learn &amp; Test</p>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs uppercase">
              {user.username.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{user.username}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">
              {user.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
