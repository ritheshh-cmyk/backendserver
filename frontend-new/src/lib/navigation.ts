import {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  Receipt,
  TrendingUp,
  FileText,
  Settings,
} from "lucide-react";
import { UserRole } from "@/hooks/use-role";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  exact?: boolean;
  allowedRoles: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    name: "dashboard",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
    allowedRoles: ["admin"],
  },
  {
    name: "home",
    href: "/worker",
    icon: LayoutDashboard,
    exact: true,
    allowedRoles: ["worker"],
  },
  {
    name: "transactions",
    href: "/transactions",
    icon: CreditCard,
    allowedRoles: ["admin", "worker"],
  },
  {
    name: "inventory",
    href: "/inventory",
    icon: Package,
    allowedRoles: ["admin"],
  },
  {
    name: "suppliers",
    href: "/suppliers",
    icon: Users,
    allowedRoles: ["admin", "worker"],
  },
  {
    name: "expenditures",
    href: "/expenditures",
    icon: TrendingUp,
    allowedRoles: ["admin"],
  },
  {
    name: "bills",
    href: "/bills",
    icon: Receipt,
    allowedRoles: ["admin", "worker"],
  },
  {
    name: "reports",
    href: "/reports",
    icon: FileText,
    allowedRoles: ["admin"],
  },
  {
    name: "settings",
    href: "/settings",
    icon: Settings,
    allowedRoles: ["admin"],
  },
];

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  return navigationItems.filter((item) => item.allowedRoles.includes(role));
} 