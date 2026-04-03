"use client";

import { use, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLoanProduct } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import type { UpdateLoanProductDto, LoanType, InterestRateMethod, Currency } from "@/lib/types";

const LOAN_TYPES: LoanType[] = ["PERSONAL", "BUSINESS", "AGRICULTURAL", "GROUP_SOLIDARITY"];
const INTEREST_METHODS: InterestRateMethod[] = ["FLAT_RATE", "DECLINING_BALANCE"];

export default function EditLoanProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const t = useTranslations();
    const router = useRouter();

    const { data: product, isLoading: loadingProduct } = useLoanProduct(id);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<UpdateLoanProductDto>({});

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                code: product.code,
                loanType: product.loanType,
                description: product.description || "",
                interestRateMethod: product.interestRateMethod,
                minInterestRate: product.minInterestRate,
                maxInterestRate: product.maxInterestRate,
                minAmount: product.minAmount,
                maxAmount: product.maxAmount,
                minTermMonths: product.minTermMonths,
                maxTermMonths: product.maxTermMonths,
                currency: product.currency,
                gracePeriodDays: product.gracePeriodDays,
                penaltyRate: product.penaltyRate,
                requiresCollateral: product.requiresCollateral,
                isActive: product.isActive,
            });
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await api.patch(`/loan-products/${id}`, formData);
            router.push(`/loan-products/${id}`);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Failed to update product");
            } else {
                setError("Failed to update product");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingProduct) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const isValid = formData.name && formData.code;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href={`/loan-products/${id}`} className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Edit: {product?.name}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Update loan product settings</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanProducts.name")} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Product Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanProducts.code")} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.code || ""}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Loan Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanProducts.loanType")} *
                            </label>
                            <select
                                required
                                value={formData.loanType || ""}
                                onChange={(e) => setFormData({ ...formData, loanType: e.target.value as LoanType })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                {LOAN_TYPES.map((lt) => (
                                    <option key={lt} value={lt}>{t(`loanProducts.loanTypes.${lt}`)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Interest Rate Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanProducts.interestRateMethod")} *
                            </label>
                            <select
                                required
                                value={formData.interestRateMethod || ""}
                                onChange={(e) => setFormData({ ...formData, interestRateMethod: e.target.value as InterestRateMethod })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                {INTEREST_METHODS.map((m) => (
                                    <option key={m} value={m}>{t(`loanProducts.interestMethods.${m}`)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Min Interest Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Min {t("loanProducts.interestRate")} (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                step="0.01"
                                value={formData.minInterestRate ?? ""}
                                onChange={(e) => setFormData({ ...formData, minInterestRate: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Max Interest Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Max {t("loanProducts.interestRate")} (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                step="0.01"
                                value={formData.maxInterestRate ?? ""}
                                onChange={(e) => setFormData({ ...formData, maxInterestRate: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Min Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Min {t("loanProducts.amount")} *
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.minAmount ?? ""}
                                onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Max Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Max {t("loanProducts.amount")} *
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={formData.maxAmount ?? ""}
                                onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Min Term */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Min {t("loanProducts.term")} *
                            </label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={formData.minTermMonths ?? ""}
                                onChange={(e) => setFormData({ ...formData, minTermMonths: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Max Term */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Max {t("loanProducts.term")} *
                            </label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={formData.maxTermMonths ?? ""}
                                onChange={(e) => setFormData({ ...formData, maxTermMonths: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanProducts.currency")}
                            </label>
                            <select
                                value={formData.currency || "USD"}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="USD">USD</option>
                                <option value="KHR">KHR</option>
                            </select>
                        </div>

                        {/* Grace Period */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanProducts.gracePeriod")}
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={formData.gracePeriodDays ?? ""}
                                onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Penalty Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanProducts.penaltyRate")} (%)
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={formData.penaltyRate ?? ""}
                                onChange={(e) => setFormData({ ...formData, penaltyRate: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center gap-3 pt-6">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive ?? true}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                                Active
                            </label>
                        </div>

                        {/* Requires Collateral */}
                        <div className="flex items-center gap-3 pt-6">
                            <input
                                type="checkbox"
                                id="requiresCollateral"
                                checked={formData.requiresCollateral ?? false}
                                onChange={(e) => setFormData({ ...formData, requiresCollateral: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="requiresCollateral" className="text-sm font-medium text-gray-900">
                                {t("loanProducts.collateral")}
                            </label>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={formData.description || ""}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                placeholder="Describe this loan product..."
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Link
                            href={`/loan-products/${id}`}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            {t("common.cancel")}
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    {t("common.loading")}
                                </span>
                            ) : (
                                t("common.save")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
