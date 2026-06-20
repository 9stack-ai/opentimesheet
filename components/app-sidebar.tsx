"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CheckSquare,
  ChevronsUpDown,
  CircleDollarSign,
  Clock,
  LayoutDashboard,
  LogOut,
  Receipt,
  Repeat,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { atLeastManager, type Role } from "@/lib/roles";
import { roleLabel } from "@/lib/labels";
import { signOutAction } from "@/lib/auth-actions";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const BASE: Item[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/timesheet", label: "Chấm công", icon: Clock },
];
const MANAGE: Item[] = [
  { href: "/manager/clients", label: "Khách hàng", icon: Building2 },
  { href: "/manager/approvals", label: "Duyệt công", icon: CheckSquare },
];
const REPORTS: Item[] = [
  { href: "/manager/reports/payout", label: "Chi trả CTV", icon: Wallet },
  { href: "/manager/reports/billing", label: "Doanh thu KH", icon: Receipt },
  { href: "/manager/reports/profitability", label: "Lợi nhuận", icon: TrendingUp },
];
const COSTS: Item[] = [
  { href: "/manager/expenses", label: "Chi phí", icon: CircleDollarSign },
  { href: "/manager/fixed-costs", label: "Chi phí cố định", icon: Repeat },
];
const ADMIN_ITEMS: Item[] = [{ href: "/admin/users", label: "Người dùng", icon: Users }];

function NavRow({ item }: { item: Item }) {
  const pathname = usePathname();
  const active =
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <Icon className="size-4" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroup({ label, items }: { label?: string; items: Item[] }) {
  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((it) => (
          <NavRow key={it.href} item={it} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export function AppSidebar({ user }: { user: { name: string; role: Role } }) {
  const isManager = atLeastManager(user.role);
  const isAdmin = user.role === "ADMIN";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  9s
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">9stimesheet</span>
                  <span className="truncate text-xs text-muted-foreground">Chấm công &amp; Chi phí</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup items={BASE} />
        {isManager ? <NavGroup label="Quản lý" items={MANAGE} /> : null}
        {isManager ? <NavGroup label="Báo cáo" items={REPORTS} /> : null}
        {isManager ? <NavGroup label="Chi phí" items={COSTS} /> : null}
        {isAdmin ? <NavGroup label="Quản trị" items={ADMIN_ITEMS} /> : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{roleLabel(user.role)}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-lg" side="right" align="end" sideOffset={4}>
                <DropdownMenuLabel className="font-normal">
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{roleLabel(user.role)}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full cursor-pointer">
                      <LogOut className="mr-2 size-4" />
                      Đăng xuất
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
