"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRepayments, useParReport } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";

function formatCurrency(amount: number, currency: string = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatPaymentMethod(method: string) {
    if (method === "CASH") return "Cash";
    if (method === "BANK_TRANSFER") return "Bank Transfer";
    return method.replace(/_/g, " ");
}

const TYPE_COLORS: Record<string, string> = {
    REGULAR: "bg-blue-100 text-blue-700",
    EARLY_REPAYMENT: "bg-emerald-100 text-emerald-700",
    PREPAYMENT: "bg-violet-100 text-violet-700",
    PENALTY: "bg-red-100 text-red-700",
};

const PAR_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    below30: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" },
    par30: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
    par60: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
    par90: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" },
};

const PAR_LABELS: Record<string, string> = {
    below30: "Current (< 30 days)",
    par30: "PAR 30+ days",
    par60: "PAR 60+ days",
    par90: "PAR 90+ days",
};

export default function RepaymentsPage() {
    const t = useTranslations();

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [updatingOverdue, setUpdatingOverdue] = useState(false);

    // API returns { repayments, totalPaid, count } — NOT paginated
    const { data: raw, error, isLoading, mutate } = useRepayments();
    const repayments = raw?.repayments ?? [];
    const totalPaid = raw?.totalPaid ?? 0;
    const count = raw?.count ?? 0;

    const { data: parReport } = useParReport();

    // Client-side filtering
    const filtered = repayments.filter((r) => {
        const matchesSearch =
            !searchTerm ||
            r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.loanApplicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.loanApplication?.applicationNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.referenceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.collectedBy ? `${r.collectedBy.firstName} ${r.collectedBy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) : false);
        const matchesType = !typeFilter || r.repaymentType === typeFilter;
        return matchesSearch && matchesType;
    });

    async function handleUpdateOverdue() {
        setUpdatingOverdue(true);
        try {
            await api.patch(`/repayments/overdue/update`);
            mutate();
        } catch {
            // error handling
        } finally {
            setUpdatingOverdue(false);
        }
    }

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Total Collections</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-gray-500 mt-1">{count} payment{count !== 1 ? "s" : ""} recorded</p>
                </div>
                {parReport?.portfolio && (
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Outstanding Portfolio</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(parReport.portfolio.totalOutstanding)}</p>
                            <p className="text-xs text-gray-500 mt-1">{parReport.portfolio.totalActiveLoans} active loan{parReport.portfolio.totalActiveLoans !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">PAR 30+ Rate</p>
                            <p className={`text-2xl font-bold ${parseFloat(parReport.summary?.par30PlusRate || "0") > 5 ? "text-red-600" : "text-green-600"}`}>
                                {parReport.summary?.par30PlusRate || "0%"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{parReport.summary?.totalOverdueLoans || 0} overdue loan{(parReport.summary?.totalOverdueLoans || 0) !== 1 ? "s" : ""}</p>
                        </div>
                    </>
                )}
            </div>

            {/* PAR Report Breakdown */}
            {parReport?.par && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900">Portfolio at Risk (PAR) Breakdown</h2>
                        <span className="text-xs text-gray-400">as of {parReport.reportDate ? new Date(parReport.reportDate).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(["below30", "par30", "par60", "par90"] as const).map((bucket) => {
                            const data = parReport.par[bucket];
                            const colors = PAR_COLORS[bucket];
                            if (!data) return null;
                            return (
                                <div key={bucket} className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.badge}`}>
                                            {PAR_LABELS[bucket]}
                                        </span>
                                    </div>
                                    <p className={`text-lg font-bold ${colors.text}`}>{formatCurrency(data.amount)}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {data.count} loan{data.count !== 1 ? "s" : ""}
                                        {"ratio" in data && data.ratio != null && ` · ${(data.ratio * 100).toFixed(1)}%`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Repayments Table */}
            <div className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm border border-gray-200">
                {/* Title + Filters + Actions */}
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {t("repayments.title")}
                        </h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleUpdateOverdue}
                                disabled={updatingOverdue}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                {updatingOverdue ? "Updating..." : "Update Overdue"}
                            </button>
                            <Link
                                href="/repayments/create"
                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
                            >
                                + {t("repayments.recordPayment")}
                            </Link>
                        </div>
                    </div>
                    {/* Search & Filter Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by loan #, reference, collector..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">All Types</option>
                            <option value="REGULAR">Regular</option>
                            <option value="EARLY_REPAYMENT">Early Repayment</option>
                            <option value="PREPAYMENT">Prepayment</option>
                            <option value="PENALTY">Penalty</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/80 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Loan
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("repayments.amount")}
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Allocation
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("repayments.type")}
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("repayments.paymentMethod")}
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Collected By
                                </th>
                                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("common.actions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {isLoading && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center">
                                        <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-red-500">
                                        {t("common.error")}
                                    </td>
                                </tr>
                            )}
                            {!isLoading && !error && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-500">{t("common.noData")}</p>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((repayment) => {
                                const currency = repayment.loanApplication?.currency || "USD";
                                const collectorName = repayment.collectedBy
                                    ? `${repayment.collectedBy.firstName} ${repayment.collectedBy.lastName}`
                                    : repayment.collectedById?.slice(0, 8) || "—";
                                const loanLabel = repayment.loanApplication?.applicationNumber
                                    ? `#${repayment.loanApplication.applicationNumber}`
                                    : `#${repayment.loanApplicationId.slice(0, 8)}`;

                                return (
                                    <tr key={repayment.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                href={`/loan-applications/${repayment.loanApplicationId}`}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                {loanLabel}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(repayment.amount, currency)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span title="Principal" className="text-blue-600 font-medium">
                                                    P:{formatCurrency(repayment.principalPortion || 0, currency)}
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span title="Interest" className="text-amber-600 font-medium">
                                                    I:{formatCurrency(repayment.interestPortion || 0, currency)}
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span title="Penalty" className="text-red-500 font-medium">
                                                    Pn:{formatCurrency(repayment.penaltyPortion || 0, currency)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[repayment.repaymentType] || "bg-gray-100 text-gray-700"}`}>
                                                {t(`repayments.types.${repayment.repaymentType}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {formatPaymentMethod(repayment.paymentMethod)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {collectorName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(repayment.paidAt || repayment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Link
                                                href={`/repayments/${repayment.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer summary */}
                {!isLoading && !error && filtered.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50 rounded-b-2xl">
                        <p className="text-xs text-gray-500 font-medium">
                            Showing {filtered.length} of {count} payments
                        </p>
                        <p className="text-xs font-semibold text-gray-700">
                            Total collected: {formatCurrency(totalPaid)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
