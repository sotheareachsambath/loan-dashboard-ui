// ── Enums ──────────────────────────────────────────────

export type UserRole =
  | "ADMIN"
  | "DIRECTOR"
  | "MANAGER"
  | "LOAN_OFFICER"
  | "TELLER"
  | "CUSTOMER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type LoanType = "PERSONAL" | "BUSINESS" | "AGRICULTURAL" | "GROUP_SOLIDARITY";

export type InterestRateMethod = "FLAT_RATE" | "DECLINING_BALANCE";

export type Currency = "USD" | "KHR";

export type LoanApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "OFFICER_APPROVED"
  | "MANAGER_APPROVED"
  | "DIRECTOR_APPROVED"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED"
  | "CLOSED";

export type RepaymentFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export type ApprovalLevel = "OFFICER" | "MANAGER" | "DIRECTOR";

export type ApprovalAction = "APPROVED" | "REJECTED" | "RETURNED";

export type DocumentType = "ID" | "COLLATERAL" | "INCOME_PROOF" | "OTHER";

export type DisbursementMethod = "CASH" | "BANK_TRANSFER";

export type RepaymentType = "REGULAR" | "EARLY_REPAYMENT" | "PREPAYMENT" | "PENALTY";

export type ScheduleMethod = "EMI" | "BALLOON";

// ── Users ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  avatar?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  avatar?: string;
  status?: UserStatus;
}

// ── Loan Products ──────────────────────────────────────

export interface LoanProduct {
  id: string;
  name: string;
  code: string;
  loanType: LoanType;
  description?: string;
  interestRateMethod: InterestRateMethod;
  minInterestRate: number;
  maxInterestRate: number;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  currency: Currency;
  gracePeriodDays: number;
  penaltyRate: number;
  requiresCollateral: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanProductDto {
  name: string;
  code: string;
  loanType: LoanType;
  description?: string;
  interestRateMethod: InterestRateMethod;
  minInterestRate: number;
  maxInterestRate: number;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  currency?: Currency;
  gracePeriodDays?: number;
  penaltyRate?: number;
  requiresCollateral?: boolean;
}

export interface UpdateLoanProductDto extends Partial<CreateLoanProductDto> {
  isActive?: boolean;
}

// ── Loan Applications ──────────────────────────────────

export interface LoanApplication {
  id: string;
  applicantId: string;
  loanProductId: string;
  loanOfficerId?: string;
  requestedAmount: number;
  approvedAmount?: number;
  interestRate: number;
  termMonths: number;
  repaymentFrequency: RepaymentFrequency;
  currency: Currency;
  purpose?: string;
  gracePeriodDays: number;
  status: LoanApplicationStatus;
  applicant?: User;
  loanProduct?: LoanProduct;
  loanOfficer?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanApplicationDto {
  applicantId: string;
  loanProductId: string;
  requestedAmount: number;
  interestRate: number;
  termMonths: number;
  repaymentFrequency?: RepaymentFrequency;
  currency?: Currency;
  purpose?: string;
  gracePeriodDays?: number;
}

export interface UpdateLoanApplicationDto extends Partial<CreateLoanApplicationDto> {
  loanOfficerId?: string;
  approvedAmount?: number;
}

export interface ApprovalActionDto {
  approverId: string;
  level: ApprovalLevel;
  action: ApprovalAction;
  comments?: string;
}

// ── Repayment Schedules ────────────────────────────────

export interface GenerateScheduleDto {
  loanApplicationId: string;
  method?: ScheduleMethod;
}

export interface RepaymentSchedule {
  id: string;
  loanApplicationId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  status: string;
}

// ── Disbursements ──────────────────────────────────────

export interface Disbursement {
  id: string;
  loanApplicationId: string;
  disbursedById: string;
  amount: number;
  method: DisbursementMethod;
  bankName?: string;
  accountNumber?: string;
  referenceNumber?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface CreateDisbursementDto {
  loanApplicationId: string;
  disbursedById: string;
  amount: number;
  method: DisbursementMethod;
  bankName?: string;
  accountNumber?: string;
  referenceNumber?: string;
  notes?: string;
}

// ── Repayments ─────────────────────────────────────────

export interface Repayment {
  id: string;
  loanApplicationId: string;
  collectedById: string;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  penaltyPortion: number;
  repaymentType: RepaymentType;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  collectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  loanApplication?: {
    id: string;
    applicationNumber?: string;
    status: string;
    currency: Currency;
  };
}

export interface RepaymentAllocation {
  principalPaid: number;
  interestPaid: number;
  penaltyPaid: number;
  totalPaid: number;
  schedulesAffected: number;
}

export interface RepaymentCreateResponse {
  repayment: Repayment;
  allocation: RepaymentAllocation;
}

export interface RepaymentListResponse {
  repayments: Repayment[];
  totalPaid: number;
  count: number;
}

export interface ParReportResponse {
  reportDate: string;
  portfolio: {
    totalOutstanding: number;
    totalActiveLoans: number;
  };
  par: {
    below30: { count: number; amount: number; loans: ParLoan[] };
    par30: { count: number; amount: number; ratio: number; loans: ParLoan[] };
    par60: { count: number; amount: number; ratio: number; loans: ParLoan[] };
    par90: { count: number; amount: number; ratio: number; loans: ParLoan[] };
  };
  summary: {
    totalOverdueLoans: number;
    par30PlusRate: string;
  };
}

export interface ParLoan {
  loanApplicationId: string;
  applicationNumber?: string;
  applicant?: { id: string; firstName: string; lastName: string };
  outstandingAmount: number;
  currency: Currency;
  daysPastDue: number;
  overdueAmount: number;
}

export interface ScheduleSummaryResponse {
  loanApplicationId: string;
  totalInstallments: number;
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  schedules: RepaymentSchedule[];
}

export interface CreateRepaymentDto {
  loanApplicationId: string;
  collectedById: string;
  amount: number;
  repaymentType?: RepaymentType;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

// ── Paginated Response ─────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Query Params ───────────────────────────────────────

export interface UserQueryParams {
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface LoanProductQueryParams {
  loanType?: LoanType;
  currency?: Currency;
  isActive?: boolean;
}

export interface LoanApplicationQueryParams {
  status?: LoanApplicationStatus;
  loanOfficerId?: string;
  applicantId?: string;
  page?: number;
  limit?: number;
}
