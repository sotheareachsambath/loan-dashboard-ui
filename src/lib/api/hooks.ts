import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "./fetcher";
import { endpoints } from "./endpoints";
import type {
  User,
  LoanProduct,
  LoanApplication,
  RepaymentSchedule,
  Disbursement,
  Repayment,
  PaginatedResponse,
  UserQueryParams,
  LoanProductQueryParams,
  LoanApplicationQueryParams,
} from "../types";

function useAPI<T>(key: string | null, config?: SWRConfiguration) {
  return useSWR<T>(key, fetcher, config);
}

// ── Users ──────────────────────────────────────────────

export function useUsers(params?: UserQueryParams) {
  return useAPI<PaginatedResponse<User>>(endpoints.users(params && { ...params }));
}

export function useUser(id: string | null) {
  return useAPI<User>(id ? endpoints.user(id) : null);
}

// ── Loan Products ──────────────────────────────────────

export function useLoanProducts(params?: LoanProductQueryParams) {
  return useAPI<LoanProduct[]>(endpoints.loanProducts(params && { ...params }));
}

export function useLoanProduct(id: string | null) {
  return useAPI<LoanProduct>(id ? endpoints.loanProduct(id) : null);
}

// ── Loan Applications ──────────────────────────────────

export function useLoanApplications(params?: LoanApplicationQueryParams) {
  return useAPI<PaginatedResponse<LoanApplication>>(
    endpoints.loanApplications(params && { ...params })
  );
}

export function useLoanApplication(id: string | null) {
  return useAPI<LoanApplication>(id ? endpoints.loanApplication(id) : null);
}

export function useApprovalHistory(loanId: string | null) {
  return useAPI<unknown[]>(loanId ? endpoints.approvalHistory(loanId) : null);
}

export function useLoanDocuments(loanId: string | null) {
  return useAPI<unknown[]>(loanId ? endpoints.loanDocuments(loanId) : null);
}

// ── Repayment Schedules ────────────────────────────────

export function useRepaymentSchedule(loanId: string | null) {
  return useAPI<RepaymentSchedule[]>(
    loanId ? endpoints.repaymentSchedule(loanId) : null
  );
}

// ── Disbursements ──────────────────────────────────────

export function useDisbursementsByLoan(loanId: string | null) {
  return useAPI<Disbursement[]>(
    loanId ? endpoints.disbursementsByLoan(loanId) : null
  );
}

export function useDisbursement(id: string | null) {
  return useAPI<Disbursement>(id ? endpoints.disbursement(id) : null);
}

// ── Repayments ─────────────────────────────────────────

export function useRepaymentsByLoan(loanId: string | null) {
  return useAPI<Repayment[]>(
    loanId ? endpoints.repaymentsByLoan(loanId) : null
  );
}

export function useParReport() {
  return useAPI<unknown>(endpoints.parReport());
}
