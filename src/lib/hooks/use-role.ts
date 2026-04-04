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

export function useRole() {
  const { user } = useAuth();
  const role = (user?.role as UserRole) || "CUSTOMER";

  return {
    role,
    isStaff: STAFF_ROLES.includes(role),
    isAdmin: role === "ADMIN",
    isDirector: role === "DIRECTOR",
    isManager: role === "MANAGER",
    isLoanOfficer: role === "LOAN_OFFICER",
    isTeller: role === "TELLER",
    isCustomer: role === "CUSTOMER",

    canApprove: APPROVAL_ROLES.includes(role),
    canManageUsers: USER_MANAGEMENT_ROLES.includes(role),
    canManageProducts: PRODUCT_MANAGEMENT_ROLES.includes(role),
    canDisburse: DISBURSEMENT_ROLES.includes(role),
    canCollect: COLLECTION_ROLES.includes(role),

    hasRoleLevel: (minRole: UserRole) => ROLE_LEVELS[role] >= ROLE_LEVELS[minRole],
  };
}
