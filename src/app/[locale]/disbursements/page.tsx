"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDisbursements } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function DisbursementsPage() {
    const t = useTranslations();

    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [canceling, setCanceling] = useState(false);

    const { data: raw, error, isLoading, mutate } = useDisbursements({
        page,
        limit: 10,
    });

    const disbursements: any[] = (raw as any)?.disbursements ?? raw?.data ?? [];
    const total = (raw as any)?.count ?? raw?.meta?.total ?? 0;
    const totalPages = raw?.meta?.totalPages ?? (total > 0 ? Math.ceil(total / 10) : 0);

    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/disbursements/${deleteId}`);
            setDeleteId(null);
            mutate();
        } catch {
            // error handling
        } finally {
            setDeleting(false);
        }
    }

    async function handleCancel() {
        if (!cancelId) return;
        setCanceling(true);
        try {
            await api.patch(`/disbursements/${cancelId}/cancel`);
            setCancelId(null);
            mutate();
        } catch {
            // error handling
        } finally {
            setCanceling(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200">
            {/* Title + Create Button */}
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                    {t("disbursements.title")}
                </h1>
                <Link
                    href="/disbursements/create"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
                >
                    + {t("disbursements.createDisbursement")}
                </Link>
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
                                {t("disbursements.amount")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("disbursements.method")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("disbursements.reference")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("common.status")}
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
                        {!isLoading && !error && disbursements.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-500">{t("common.noData")}</p>
                                </td>
                            </tr>
                        )}
                        {disbursements.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link
                                        href={`/loan-applications/${d.loanApplicationId}`}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        #{d.loanApplicationId.slice(0, 8)}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(d.amount)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${d.method === "CASH"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-blue-100 text-blue-700"
                                        }`}>
                                        {t(`disbursements.methods.${d.method}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {d.referenceNumber || "—"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <StatusBadge status={d.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(d.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link
                                            href={`/disbursements/${d.id}`}
                                            className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            View
                                        </Link>
                                        {d.status === "PENDING" && (
                                            <button
                                                onClick={() => setCancelId(d.id)}
                                                className="font-medium text-orange-500 hover:text-orange-700 transition-colors"
                                            >
                                                {t("common.cancel")}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDeleteId(d.id)}
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
                        {t("common.showing")} {disbursements.length} {t("common.of")} {total} {t("common.entries")}
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

            {/* Cancel Confirmation Modal */}
            <Modal
                open={!!cancelId}
                onClose={() => setCancelId(null)}
                title={t("common.confirm")}
            >
                <p className="mb-6 text-sm text-gray-600">
                    Are you sure you want to cancel this disbursement? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setCancelId(null)}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={canceling}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-lg shadow-orange-500/20"
                    >
                        {canceling ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                {t("common.loading")}
                            </span>
                        ) : "Confirm Cancel"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
