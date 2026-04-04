"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLoanProducts } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import type { LoanType } from "@/lib/types";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";

const LOAN_TYPES: LoanType[] = ["PERSONAL", "BUSINESS", "AGRICULTURAL", "GROUP_SOLIDARITY"];

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function LoanProductsPage() {
    const t = useTranslations();

    const [typeFilter, setTypeFilter] = useState<LoanType | "">("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data: products, error, isLoading, mutate } = useLoanProducts({
        loanType: typeFilter || undefined,
    });

    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/loan-products/${deleteId}`);
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
                    {t("loanProducts.title")}
                </h1>
                <Link
                    href="/loan-products/create"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
                >
                    + {t("loanProducts.createProduct")}
                </Link>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 bg-gray-50/50">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as LoanType | "")}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    <option value="">{t("loanProducts.loanType")} — {t("common.filter")}</option>
                    {LOAN_TYPES.map((lt) => (
                        <option key={lt} value={lt}>{t(`loanProducts.loanTypes.${lt}`)}</option>
                    ))}
                </select>

                {typeFilter && (
                    <button
                        onClick={() => setTypeFilter("")}
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
                                {t("loanProducts.name")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("loanProducts.loanType")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("loanProducts.interestRate")}
                            </th>
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                {t("loanProducts.amount")}
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
                        {!isLoading && !error && products?.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-500">{t("common.noData")}</p>
                                </td>
                            </tr>
                        )}
                        {products?.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                        <div className="text-xs text-gray-500">{product.code}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{t(`loanProducts.loanTypes.${product.loanType}`)}</div>
                                    <div className="text-xs text-gray-500">{t(`loanProducts.interestMethods.${product.interestRateMethod}`)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{product.minInterestRate}% - {product.maxInterestRate}%</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatCurrency(product.minAmount, product.currency)} - {formatCurrency(product.maxAmount, product.currency)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {product.hasFixedTerm === false
                                            ? "Open-ended (no fixed term)"
                                            : `${product.minTermMonths ?? 0} - ${product.maxTermMonths ?? 0} months`}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <StatusBadge status={product.isActive ? "ACTIVE" : "INACTIVE"} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link
                                            href={`/loan-products/${product.id}`}
                                            className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={`/loan-products/${product.id}/edit`}
                                            className="font-medium text-amber-600 hover:text-amber-800 transition-colors"
                                        >
                                            {t("common.edit")}
                                        </Link>
                                        <button
                                            onClick={() => setDeleteId(product.id)}
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
