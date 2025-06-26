import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export type UserRole = "admin" | "worker";

export interface RolePermissions {
  canAccessSettings: boolean;
  canAccessReports: boolean;
  canAccessExpenditures: boolean;
  canEditInventory: boolean;
  canDeleteTransactions: boolean;
  canDeleteWithinHours: number | null; // null means unlimited, number means hours limit
  canViewProfits: boolean;
  maxTransactionsView: number | null; // null means unlimited
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessSettings: true,
    canAccessReports: true,
    canAccessExpenditures: true,
    canEditInventory: true,
    canDeleteTransactions: true,
    canDeleteWithinHours: null, // unlimited
    canViewProfits: true,
    maxTransactionsView: null,
  },
  worker: {
    canAccessSettings: false,
    canAccessReports: false,
    canAccessExpenditures: false,
    canEditInventory: false,
    canDeleteTransactions: true, // workers can delete but with time limit
    canDeleteWithinHours: 24, // can only delete within 24 hours
    canViewProfits: false,
    maxTransactionsView: 10,
  },
};

export function useRole() {
  // Fallback to empty object if context is not available
  const context = useContext(AuthContext) || {};
  const user = (context as any).user || null;
  const [role, setRole] = useState<UserRole>("worker");
  const [permissions, setPermissions] = useState<RolePermissions>(rolePermissions.worker);

  useEffect(() => {
    // Prefer role from AuthContext, fallback to localStorage
    let userRole: UserRole = "worker";
    if (user && (user.role === "admin" || user.role === "worker")) {
      userRole = user.role;
    } else {
      const storedRole = localStorage.getItem("role") as UserRole;
      if (storedRole === "admin" || storedRole === "worker") {
        userRole = storedRole;
      }
    }
    setRole(userRole);
    setPermissions(rolePermissions[userRole]);
  }, [user]);

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return Boolean(permissions[permission]);
  };

  const canDeleteTransaction = (transactionDate: Date): boolean => {
    if (!permissions.canDeleteTransactions) return false;
    if (permissions.canDeleteWithinHours === null) return true; // unlimited for admin
    const now = new Date();
    const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= permissions.canDeleteWithinHours;
  };

  const isAdmin = role === "admin";
  const isWorker = role === "worker";

  return {
    role,
    permissions,
    hasPermission,
    canDeleteTransaction,
    isAdmin,
    isWorker,
  };
} 