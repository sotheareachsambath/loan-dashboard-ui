"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLoanApplications, useRepaymentSchedule, useRepaymentsByLoan } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/fetcher";
import StatusBadge from "@/components/ui/status-badge";
import type { CreateRepaymentDto, RepaymentType } from "@/lib/types";

const REPAYMENT_TYPES: RepaymentType[] = ["REGULAR", "EARLY_REPAYMENT", "PREPAYMENT", "PENALTY"];
// API only supports CASH and BANK_TRANSFER
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER"];

function formatCurrency(amount: number, currency: string = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function RecordRepaymentPage() {
    const t = useTranslations();
    const router = useRouter();
    const { user } = useAuth();

    // Only DISBURSED loans can accept payments
    const { data: applicationsRaw } = useLoanApplications({ status: "DISBURSED", limit: 100 });
    const applications = applicationsRaw?.data ?? [];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successInfo, setSuccessInfo] = useState<{
        principalPaid: number;
        interestPaid: number;
        penaltyPaid: number;
        schedulesAffected: number;
    } | null>(null);

    const [formData, setFormData] = useState<CreateRepaymentDto>({
        loanApplicationId: "",
        collectedById: user?.id ?? "",
        amount: 0,
        repaymentType: "REGULAR",
        paymentMethod: "CASH",
        referenceNumber: "",
        notes: "",
    });

    const collectedById = formData.collectedById || user?.id || "";
    const selectedApp = applications.find((a) => a.id === formData.loanApplicationId);
    const currency = selectedApp?.currency || "USD";
    const hasFixedTerm = selectedApp?.loanProduct?.hasFixedTerm !== false; // default true if not set

    // Fetch repayment schedule for the selected loan
    // API returns ScheduleSummaryResponse: { schedules, totalPaid, totalRemaining, ... }
    const { data: scheduleResponse, error: scheduleError, mutate: mutateSchedule } = useRepaymentSchedule(formData.loanApplicationId || null);
    const schedule = scheduleResponse?.schedules ?? [];
    const hasNoSchedule = !!formData.loanApplicationId && !scheduleResponse && !!scheduleError;

    // Generate schedule state
    const [generatingSchedule, setGeneratingSchedule] = useState(false);
    const [scheduleMethod, setScheduleMethod] = useState<"EMI" | "BALLOON">("EMI");

    async function handleGenerateSchedule() {
        if (!formData.loanApplicationId) return;
        setGeneratingSchedule(true);
        setError("");
        try {
            await api.post("/repayment-schedules/generate", {
                loanApplicationId: formData.loanApplicationId,
                method: scheduleMethod,
            });
            mutateSchedule();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to generate schedule";
            const infoMsg = (err as any)?.info?.message;
            setError(typeof infoMsg === "string" ? infoMsg : message);
        } finally {
            setGeneratingSchedule(false);
        }
    }

    // Fetch existing repayments for the selected loan
    // API returns RepaymentListResponse: { repayments, totalPaid, count }
    const { data: rawRepayments } = useRepaymentsByLoan(formData.loanApplicationId || null);
    const totalPaidSoFar = rawRepayments?.totalPaid ?? 0;

    // Calculate outstanding info from schedule
    const scheduleInfo = useMemo(() => {
        if (!schedule || schedule.length === 0) return null;

        const outstanding = schedule.filter((s: any) =>
            s.status === "PENDING" || s.status === "PARTIALLY_PAID" || s.status === "OVERDUE"
        );
        const paid = schedule.filter((s: any) => s.status === "PAID");

        const totalRemaining = outstanding.reduce((sum: number, s: any) => sum + Number(s.remainingAmount ?? (Number(s.totalAmount) - Number(s.paidAmount || 0))), 0);
        const totalScheduleAmount = schedule.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0);
        const overdueCount = outstanding.filter((s: any) => s.status === "OVERDUE").length;
        const nextDue = outstanding.length > 0 ? outstanding[0] : null;

        return {
            totalInstallments: schedule.length,
            paidInstallments: paid.length,
            outstandingInstallments: outstanding.length,
            overdueCount,
            totalRemaining: Math.round(totalRemaining * 100) / 100,
            totalScheduleAmount: Math.round(totalScheduleAmount * 100) / 100,
            nextDue,
            outstandingSchedules: outstanding,
        };
    }, [schedule]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessInfo(null);
        setIsSubmitting(true);

        try {
            const result = await api.post<{
                repayment: any;
                allocation: {
                    principalPaid: number;
                    interestPaid: number;
                    penaltyPaid: number;
                    totalPaid: number;
                    schedulesAffected: number;
                };
            }>("/repayments", { ...formData, collectedById });

            // Show allocation summary before redirecting
            if (result?.allocation) {
                setSuccessInfo(result.allocation);
                // Auto-redirect after showing success
                setTimeout(() => {
                    router.push("/repayments");
                }, 3000);
            } else {
                router.push("/repayments");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to record payment";
            const infoMsg = (err as any)?.info?.message;
            if (typeof infoMsg === "string" && infoMsg) {
                setError(infoMsg);
            } else if (Array.isArray(infoMsg) && infoMsg.length > 0) {
                setError(infoMsg.join(", "));
            } else {
                setError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = formData.loanApplicationId && formData.amount >= 0.01 && formData.paymentMethod && (!hasFixedTerm || (!hasNoSchedule && schedule.length > 0));

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/repayments" className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {t("repayments.recordPayment")}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Payment is auto-allocated to earliest unpaid installments: Penalty → Interest → Principal</p>
                </div>
            </div>

            {/* Success Allocation Summary */}
            {successInfo && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
                            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-emerald-900">Payment Recorded Successfully!</h3>
                            <p className="text-sm text-emerald-700">Redirecting to repayments list...</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium mb-1">Principal Paid</p>
                            <p className="text-lg font-bold text-emerald-900">{formatCurrency(successInfo.principalPaid, currency)}</p>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium mb-1">Interest Paid</p>
                            <p className="text-lg font-bold text-emerald-900">{formatCurrency(successInfo.interestPaid, currency)}</p>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium mb-1">Penalty Paid</p>
                            <p className="text-lg font-bold text-emerald-900">{formatCurrency(successInfo.penaltyPaid, currency)}</p>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium mb-1">Installments Affected</p>
                            <p className="text-lg font-bold text-emerald-900">{successInfo.schedulesAffected}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Loan Application */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Loan Application *
                            </label>
                            <select
                                required
                                value={formData.loanApplicationId}
                                onChange={(e) => {
                                    setFormData({ ...formData, loanApplicationId: e.target.value, amount: 0 });
                                    setSuccessInfo(null);
                                }}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="" disabled>Select a disbursed loan...</option>
                                {applications.map((app) => (
                                    <option key={app.id} value={app.id}>
                                        #{app.id.slice(0, 8)} — {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "Unknown"} — {formatCurrency(app.approvedAmount || app.requestedAmount, app.currency)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Loan Summary */}
                        {selectedApp && (
                            <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Approved Amount</p>
                                        <p className="font-semibold text-gray-900">{formatCurrency(selectedApp.approvedAmount || selectedApp.requestedAmount, currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Interest Rate</p>
                                        <p className="font-semibold text-gray-900">{selectedApp.interestRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Term</p>
                                        <p className="font-semibold text-gray-900">{selectedApp.termMonths} months ({t(`loanApplications.frequencies.${selectedApp.repaymentFrequency}`)})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Total Paid So Far</p>
                                        <p className="font-semibold text-emerald-700">{formatCurrency(totalPaidSoFar, currency)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Flexible-term loan info */}
                        {selectedApp && !hasFixedTerm && (
                            <div className="md:col-span-2 p-5 bg-indigo-50 rounded-xl border border-indigo-200">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h3 className="text-sm font-semibold text-indigo-800 mb-1">Flexible Term Loan</h3>
                                        <p className="text-sm text-indigo-700">
                                            This loan product has no fixed repayment schedule. You can record any payment amount directly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Schedule Warning + Generate Button */}
                        {selectedApp && hasFixedTerm && hasNoSchedule && (
                            <div className="md:col-span-2 p-5 bg-amber-50 rounded-xl border border-amber-200">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-amber-800 mb-1">No Repayment Schedule Found</h3>
                                        <p className="text-sm text-amber-700 mb-3">
                                            This loan does not have a repayment schedule yet. You need to generate one before recording payments.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={scheduleMethod}
                                                onChange={(e) => setScheduleMethod(e.target.value as "EMI" | "BALLOON")}
                                                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                            >
                                                <option value="EMI">EMI (Equal Installments)</option>
                                                <option value="BALLOON">Balloon (Interest-only + Lump Sum)</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleGenerateSchedule}
                                                disabled={generatingSchedule}
                                                className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                                            >
                                                {generatingSchedule ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                        Generating...
                                                    </span>
                                                ) : (
                                                    "Generate Schedule"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Outstanding Balance Card */}
                        {hasFixedTerm && scheduleInfo && (
                            <div className="md:col-span-2 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Outstanding Balance</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Total Remaining</p>
                                        <p className="font-bold text-lg text-gray-900">{formatCurrency(scheduleInfo.totalRemaining, currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Paid / Total</p>
                                        <p className="font-semibold text-gray-900">{scheduleInfo.paidInstallments} / {scheduleInfo.totalInstallments}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Outstanding</p>
                                        <p className="font-semibold text-gray-900">{scheduleInfo.outstandingInstallments} installments</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Overdue</p>
                                        <p className={`font-semibold ${scheduleInfo.overdueCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                                            {scheduleInfo.overdueCount > 0 ? `${scheduleInfo.overdueCount} overdue` : "None"}
                                        </p>
                                    </div>
                                    {scheduleInfo.nextDue && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Next Due</p>
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(Number(scheduleInfo.nextDue.remainingAmount ?? scheduleInfo.nextDue.totalAmount), currency)}
                                            </p>
                                            <p className="text-xs text-gray-500">{new Date(scheduleInfo.nextDue.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("repayments.amount")} *
                                {hasFixedTerm && scheduleInfo && (
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                        (max: {formatCurrency(scheduleInfo.totalRemaining, currency)})
                                    </span>
                                )}
                                {!hasFixedTerm && selectedApp && (
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                        (remaining: {formatCurrency(Math.max(0, (selectedApp.approvedAmount || selectedApp.requestedAmount) - totalPaidSoFar), currency)})
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <span className="text-gray-500 sm:text-sm">{currency === "USD" ? "$" : "៛"}</span>
                                </div>
                                <input
                                    type="number"
                                    required
                                    min={0.01}
                                    step="0.01"
                                    max={hasFixedTerm ? (scheduleInfo?.totalRemaining ?? undefined) : undefined}
                                    value={formData.amount || ""}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            {/* Quick-fill buttons */}
                            {hasFixedTerm && scheduleInfo && scheduleInfo.nextDue && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount: Number(scheduleInfo.nextDue!.remainingAmount ?? scheduleInfo.nextDue!.totalAmount) })}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                    >
                                        Next installment ({formatCurrency(Number(scheduleInfo.nextDue!.remainingAmount ?? scheduleInfo.nextDue!.totalAmount), currency)})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount: scheduleInfo.totalRemaining })}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                    >
                                        {t("repayments.fullBalance")} ({formatCurrency(scheduleInfo.totalRemaining, currency)})
                                    </button>
                                </div>
                            )}
                            {!hasFixedTerm && selectedApp && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount: Math.max(0, (selectedApp.approvedAmount || selectedApp.requestedAmount) - totalPaidSoFar) })}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                    >
                                        {t("repayments.fullBalance")} ({formatCurrency(Math.max(0, (selectedApp.approvedAmount || selectedApp.requestedAmount) - totalPaidSoFar), currency)})
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Repayment Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("repayments.type")}
                            </label>
                            <select
                                value={formData.repaymentType}
                                onChange={(e) => setFormData({ ...formData, repaymentType: e.target.value as RepaymentType })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                {REPAYMENT_TYPES.map((rt) => (
                                    <option key={rt} value={rt}>{t(`repayments.types.${rt}`)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("repayments.paymentMethod")} *
                            </label>
                            <select
                                required
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                {PAYMENT_METHODS.map((m) => (
                                    <option key={m} value={m}>{m === "CASH" ? "Cash" : "Bank Transfer"}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reference Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("repayments.reference")}
                            </label>
                            <input
                                type="text"
                                value={formData.referenceNumber}
                                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                placeholder="e.g. PAY-2026-001"
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Notes
                            </label>
                            <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>

                    {/* Outstanding Installments Preview */}
                    {hasFixedTerm && scheduleInfo && scheduleInfo.outstandingSchedules.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Installments (payment will be allocated in order)</h3>
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">No.</th>
                                            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                                            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Principal</th>
                                            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Interest</th>
                                            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
                                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {scheduleInfo.outstandingSchedules.slice(0, 6).map((s: any) => (
                                            <tr key={s.id || s.installmentNumber} className="text-sm">
                                                <td className="px-4 py-2.5 text-gray-900">{s.installmentNumber}</td>
                                                <td className="px-4 py-2.5 text-gray-500">{new Date(s.dueDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-2.5 text-right text-gray-900">{formatCurrency(Number(s.principalAmount), currency)}</td>
                                                <td className="px-4 py-2.5 text-right text-gray-900">{formatCurrency(Number(s.interestAmount), currency)}</td>
                                                <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(Number(s.totalAmount), currency)}</td>
                                                <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(Number(s.remainingAmount ?? s.totalAmount), currency)}</td>
                                                <td className="px-4 py-2.5 text-center"><StatusBadge status={s.status} /></td>
                                            </tr>
                                        ))}
                                        {scheduleInfo.outstandingSchedules.length > 6 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-2.5 text-center text-xs text-gray-400">
                                                    + {scheduleInfo.outstandingSchedules.length - 6} more installments
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Link
                            href="/repayments"
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            {t("common.cancel")}
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || !isValid || !!successInfo}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    {t("common.loading")}
                                </span>
                            ) : (
                                t("repayments.recordPayment")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
