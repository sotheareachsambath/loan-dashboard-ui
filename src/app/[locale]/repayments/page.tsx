"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRepayments, useParReport } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import Modal from "@/components/ui/modal";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

const TYPE_COLORS: Record<string, string> = {
    REGULAR: "bg-blue-100 text-blue-700",
    EARLY_REPAYMENT: "bg-emerald-100 text-emerald-700",
    PREPAYMENT: "bg-violet-100 text-violet-700",
    PENALTY: "bg-red-100 text-red-700",
};

export default function RepaymentsPage() {
    const t = useTranslations();

    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data: raw, error, isLoading, mutate } = useRepayments({
        page,
        limit: 10,
    });

    const repayments: any[] = (raw as any)?.repayments ?? raw?.data ?? [];
    const total = (raw as any)?.count ?? raw?.meta?.total ?? 0;
    const totalPages = raw?.meta?.totalPages ?? (total > 0 ? Math.ceil(total / 10) : 0);

    const { data: parReport } = useParReport();
    const [updatingOverdue, setUpdatingOverdue] = useState(false);

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

    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/repayments/${deleteId}`);
            setDeleteId(null);
            mutate();
        } catch {
            // error handling
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex flex-col h-full gap-6">
            {/* PAR Report Summary (Optional) */}
            {(parReport && typeof parReport === "object" && Object.keys(parReport as object).length > 0) ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio at Risk (PAR) Report</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(parReport as Record<string, any>).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {typeof value === "number" && (key.toLowerCase().includes("amount") || key.toLowerCase().includes("total"))
                                        ? formatCurrency(value)
                                        : String(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm border border-gray-200">
                {/* Title + Create Button */}
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {t("repayments.title")}
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleUpdateOverdue}
                            disabled={updatingOverdue}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            {updatingOverdue ? "Updating..." : "Update Overdue Status"}
                        </button>
                        <Link
                            href="/repayments/create"
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
                        >
                            + {t("repayments.recordPayment")}
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Loan Application
                                </th>
                                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("repayments.amount")}
                                </th>
                                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("repayments.type")}
                                </th>
                                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("repayments.paymentMethod")}
                                </th>
                                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("repayments.reference")}
                                </th>
                                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {t("common.actions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center">
                                        <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-red-500">
                                        {t("common.error")}
                                    </td>
                                </tr>
                            )}
                            {!isLoading && !error && repayments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-500">{t("common.noData")}</p>
                                    </td>
                                </tr>
                            )}
                            {repayments.map((repayment) => (
                                <tr key={repayment.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/loan-applications/${repayment.loanApplicationId}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            #{repayment.loanApplicationId.slice(0, 8)}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(repayment.amount)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[repayment.repaymentType] || "bg-gray-100 text-gray-700"}`}>
                                            {t(`repayments.types.${repayment.repaymentType}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {repayment.paymentMethod}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {repayment.referenceNumber || "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(repayment.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={`/repayments/${repayment.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(repayment.id)}
                                                className="font-medium text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                {t("common.delete")}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50 rounded-b-2xl">
                        <p className="text-xs text-gray-500 font-medium">
                            {t("common.showing")} {repayments.length} {t("common.of")} {total} {t("common.entries")}
                        </p>
                        <div className="flex gap-1.5">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-medium transition-colors ${p === page
                                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <Modal
                    open={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    title={t("common.confirm")}
                >
                    <p className="mb-6 text-sm text-gray-600">
                        {t("common.deleteConfirm")}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteId(null)}
                            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/20"
                        >
                            {deleting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    {t("common.loading")}
                                </span>
                            ) : t("common.delete")}
                        </button>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
