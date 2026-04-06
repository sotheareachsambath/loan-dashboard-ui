"use client";

import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/types";

// Role hierarchy for permission checks
const ROLE_LEVELS: Record<UserRole, number> = {
  CUSTOMER: 0,
  TELLER: 1,
  LOAN_OFFICER: 2,
  MANAGER: 3,
  DIRECTOR: 4,
  ADMIN: 5,
};

// Staff roles (not customers)
const STAFF_ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "MANAGER", "LOAN_OFFICER", "TELLER"];

// Roles that can approve loans
const APPROVAL_ROLES: UserRole[] = ["LOAN_OFFICER", "MANAGER", "DIRECTOR", "ADMIN"];

// Roles that can manage users
const USER_MANAGEMENT_ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "MANAGER"];

// Roles that can manage loan products
const PRODUCT_MANAGEMENT_ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "MANAGER"];

// Roles that can disburse
const DISBURSEMENT_ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "MANAGER", "LOAN_OFFICER", "TELLER"];

// Roles that can collect repayments
const COLLECTION_ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "MANAGER", "LOAN_OFFICER", "TELLER"];

function hasAny(userRoles: UserRole[], allowed: UserRole[]): boolean {
  return userRoles.some((r) => allowed.includes(r));
}

function highestLevel(userRoles: UserRole[]): number {
  return Math.max(0, ...userRoles.map((r) => ROLE_LEVELS[r] ?? 0));
}

export function useRole() {
  const { user } = useAuth();
  const roles = ((user?.roles as UserRole[]) ?? []).length > 0
    ? (user!.roles as UserRole[])
    : ["CUSTOMER" as UserRole];

  // Highest role for level-based checks
  const primaryRole = roles.reduce<UserRole>((best, r) =>
    (ROLE_LEVELS[r] ?? 0) > (ROLE_LEVELS[best] ?? 0) ? r : best,
    roles[0]
  );

  return {
    roles,
    role: primaryRole, // backward compat: highest role
    isStaff: hasAny(roles, STAFF_ROLES),
    isAdmin: roles.includes("ADMIN"),
    isDirector: roles.includes("DIRECTOR"),
    isManager: roles.includes("MANAGER"),
    isLoanOfficer: roles.includes("LOAN_OFFICER"),
    isTeller: roles.includes("TELLER"),
    isCustomer: roles.includes("CUSTOMER"),

    canApprove: hasAny(roles, APPROVAL_ROLES),
    canManageUsers: hasAny(roles, USER_MANAGEMENT_ROLES),
    canManageProducts: hasAny(roles, PRODUCT_MANAGEMENT_ROLES),
    canDisburse: hasAny(roles, DISBURSEMENT_ROLES),
    canCollect: hasAny(roles, COLLECTION_ROLES),

    hasRole: (r: UserRole) => roles.includes(r),
    hasAnyRole: (allowed: UserRole[]) => hasAny(roles, allowed),
    hasRoleLevel: (minRole: UserRole) => highestLevel(roles) >= ROLE_LEVELS[minRole],
  };
}
