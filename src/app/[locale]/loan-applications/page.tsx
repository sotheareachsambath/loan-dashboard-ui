"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLoanApplications } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import type { LoanApplicationStatus } from "@/lib/types";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";

const STATUSES: LoanApplicationStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "OFFICER_APPROVED",
    "MANAGER_APPROVED",
    "DIRECTOR_APPROVED",
    "APPROVED",
    "REJECTED",
    "DISBURSED",
    "CLOSED"
];

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function LoanApplicationsPage() {
    const t = useTranslations();

    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<LoanApplicationStatus | "">("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data: raw, error, isLoading, mutate } = useLoanApplications({
        page,
        limit: 10,
        status: statusFilter || undefined,
    });

    const applications = raw?.data ?? [];
    const total = raw?.meta?.total ?? 0;
    const totalPages = raw?.meta?.totalPages ?? 0;

    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/loan-applications/${deleteId}`);
            setDeleteId(null);
            mutate();
        } catch {
            // error handling
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200">
            {/* Title + Create Button */}
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                    {t("loanApplications.title")}
                </h1>
                <Link
                    href="/loan-applications/create"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
                >
                    + {t("loanApplications.createApplication")}
                </Link>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 bg-gray-50/50">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as LoanApplicationStatus | ""); setPage(1); }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    <option value="">{t("common.status")} — {t("common.filter")}</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>{t(`loanApplications.statuses.${s}`)}</option>
                    ))}
                </select>

                {statusFilter && (
                    <button
                        onClick={() => { setStatusFilter(""); setPage(1); }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none transition-colors"
                    >
                        {t("common.clear")}
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("loanApplications.applicant")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("loanApplications.product")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("loanApplications.requestedAmount")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("loanApplications.termMonths")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("common.status")}
                            </th>
                            <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("common.actions")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {isLoading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center">
                                    <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                                </td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-red-500">
                                    {t("common.error")}
                                </td>
                            </tr>
                        )}
                        {!isLoading && !error && applications.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-500">{t("common.noData")}</p>
                                </td>
                            </tr>
                        )}
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                            {app.applicant?.firstName?.[0] || ""}{app.applicant?.lastName?.[0] || ""}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "Unknown"}
                                            </div>
                                            <div className="text-xs text-gray-500">{app.applicant?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{app.loanProduct?.name || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{app.interestRate}% {t(`loanApplications.frequencies.${app.repaymentFrequency}`)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{formatCurrency(app.requestedAmount, app.currency)}</div>
                                    {app.approvedAmount && app.approvedAmount !== app.requestedAmount && (
                                        <div className="text-xs text-emerald-600">Approved: {formatCurrency(app.approvedAmount, app.currency)}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {app.termMonths} months
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <StatusBadge status={app.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link
                                            href={`/loan-applications/${app.id}`}
                                            className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                        <button
                                            onClick={() => setDeleteId(app.id)}
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
                        {t("common.showing")} {applications.length} {t("common.of")} {total} {t("common.entries")}
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
    );
}
