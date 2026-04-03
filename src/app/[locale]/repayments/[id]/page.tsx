"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRepayment } from "@/lib/api/hooks";

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

export default function RepaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const t = useTranslations();
    const { data: repayment, isLoading, error } = useRepayment(id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !repayment) {
        return (
            <div className="text-center py-20">
                <p className="text-sm text-red-500">{t("common.error")}</p>
                <Link href="/repayments" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800">
                    {t("common.back")}
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href="/repayments" className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-gray-900">Payment #{repayment.id.slice(0, 8)}</h1>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[repayment.repaymentType] || "bg-gray-100 text-gray-700"}`}>
                            {t(`repayments.types.${repayment.repaymentType}`)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Recorded on {new Date(repayment.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Details Card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    {/* Amount highlight */}
                    <div className="text-center pb-8 border-b border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Payment Amount</p>
                        <p className="text-4xl font-bold text-gray-900">{formatCurrency(repayment.amount)}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Loan Application</p>
                            <Link
                                href={`/loan-applications/${repayment.loanApplicationId}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                #{repayment.loanApplicationId.slice(0, 8)}
                            </Link>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("repayments.type")}</p>
                            <p className="text-sm font-medium text-gray-900">{t(`repayments.types.${repayment.repaymentType}`)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("repayments.paymentMethod")}</p>
                            <p className="text-sm font-medium text-gray-900">{repayment.paymentMethod.replace(/_/g, " ")}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{t("repayments.reference")}</p>
                            <p className="text-sm font-medium text-gray-900">{repayment.referenceNumber || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Collected By</p>
                            <p className="text-sm font-medium text-gray-900">{repayment.collectedById.slice(0, 8)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Date</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(repayment.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    {repayment.notes && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Notes</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">{repayment.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
