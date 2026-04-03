"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLoanProduct } from "@/lib/api/hooks";
import StatusBadge from "@/components/ui/status-badge";

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function LoanProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const t = useTranslations();
    const { data: product, isLoading, error } = useLoanProduct(id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="text-center py-20">
                <p className="text-sm text-red-500">{t("common.error")}</p>
                <Link href="/loan-products" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800">
                    {t("common.back")}
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/loan-products" className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
                            <StatusBadge status={product.isActive ? "ACTIVE" : "INACTIVE"} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Code: {product.code}</p>
                    </div>
                </div>
                <Link
                    href={`/loan-products/${id}/edit`}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
                >
                    {t("common.edit")}
                </Link>
            </div>

            {/* Details Card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.loanType")}</p>
                            <p className="text-sm font-medium text-gray-900">{t(`loanProducts.loanTypes.${product.loanType}`)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.interestRateMethod")}</p>
                            <p className="text-sm font-medium text-gray-900">{t(`loanProducts.interestMethods.${product.interestRateMethod}`)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.currency")}</p>
                            <p className="text-sm font-medium text-gray-900">{product.currency}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.interestRate")}</p>
                            <p className="text-sm font-medium text-gray-900">{product.minInterestRate}% — {product.maxInterestRate}%</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.amount")}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(product.minAmount, product.currency)} — {formatCurrency(product.maxAmount, product.currency)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.term")}</p>
                            <p className="text-sm font-medium text-gray-900">{product.minTermMonths} — {product.maxTermMonths} months</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.gracePeriod")}</p>
                            <p className="text-sm font-medium text-gray-900">{product.gracePeriodDays} days</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.penaltyRate")}</p>
                            <p className="text-sm font-medium text-gray-900">{product.penaltyRate}%</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("loanProducts.collateral")}</p>
                            <p className="text-sm font-medium text-gray-900">{product.requiresCollateral ? "Yes" : "No"}</p>
                        </div>
                    </div>

                    {product.description && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Description</p>
                            <p className="text-sm text-gray-700">{product.description}</p>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 flex gap-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Created</p>
                            <p className="text-sm text-gray-700">{new Date(product.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Updated</p>
                            <p className="text-sm text-gray-700">{new Date(product.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
