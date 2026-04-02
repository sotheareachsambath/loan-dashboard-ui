import { API_BASE_URL } from "./fetcher";

type QueryValue = string | number | boolean | undefined | null;

function buildKey(path: string, params?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

// ── SWR key builders ───────────────────────────────────

export const endpoints = {
  // Users
  users: (params?: Record<string, QueryValue>) => buildKey("/users", params),
  user: (id: string) => buildKey(`/users/${id}`),

  // Loan Products
  loanProducts: (params?: Record<string, QueryValue>) =>
    buildKey("/loan-products", params),
  loanProduct: (id: string) => buildKey(`/loan-products/${id}`),

  // Loan Applications
  loanApplications: (params?: Record<string, QueryValue>) =>
    buildKey("/loan-applications", params),
  loanApplication: (id: string) => buildKey(`/loan-applications/${id}`),
  approvalHistory: (id: string) =>
    buildKey(`/loan-applications/${id}/approval-history`),
  loanDocuments: (id: string) =>
    buildKey(`/loan-applications/${id}/documents`),

  // Repayment Schedules
  repaymentSchedule: (loanId: string) =>
    buildKey(`/repayment-schedules/loan/${loanId}`),

  // Disbursements
  disbursementsByLoan: (loanId: string) =>
    buildKey(`/disbursements/loan/${loanId}`),
  disbursement: (id: string) => buildKey(`/disbursements/${id}`),

  // Repayments
  repaymentsByLoan: (loanId: string) =>
    buildKey(`/repayments/loan/${loanId}`),
  parReport: () => buildKey("/repayments/reports/par"),
};
