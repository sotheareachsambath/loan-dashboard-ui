"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useUsers, useLoanProducts } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import type { CreateLoanApplicationDto, Currency, RepaymentFrequency } from "@/lib/types";

export default function CreateLoanApplicationPage() {
    const t = useTranslations();
    const router = useRouter();

    // For simplicity, we just fetch the first page of users and products.
    // In a real app, this might be a searchable combobox.
    const { data: usersData } = useUsers({ role: "CUSTOMER", limit: 100 });
    const { data: products } = useLoanProducts({ isActive: true });

    const customers = usersData?.data ?? [];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<CreateLoanApplicationDto>({
        applicantId: "",
        loanProductId: "",
        requestedAmount: 0,
        interestRate: 0,
        termMonths: 0,
        repaymentFrequency: "MONTHLY",
        currency: "USD",
        gracePeriodDays: 0,
        purpose: "",
    });

    // When product changes, auto-fill some defaults
    const handleProductChange = (productId: string) => {
        const product = products?.find((p) => p.id === productId);
        if (!product) {
            setFormData(prev => ({ ...prev, loanProductId: productId }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            loanProductId: productId,
            interestRate: product.minInterestRate,
            requestedAmount: product.minAmount,
            termMonths: product.minTermMonths,
            currency: product.currency,
            gracePeriodDays: product.gracePeriodDays,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await api.post("/loan-applications", formData);
            router.push("/loan-applications");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Failed to create application");
            } else {
                setError("Failed to create application");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get selected product constraints
    const selectedProduct = products?.find((p) => p.id === formData.loanProductId);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/loan-applications" className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {t("loanApplications.createApplication")}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Enter applicant details and select a loan product</p>
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
                        {/* Applicant */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanApplications.applicant")} *
                            </label>
                            <select
                                required
                                value={formData.applicantId}
                                onChange={(e) => setFormData({ ...formData, applicantId: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="" disabled>Select Applicant...</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.firstName} {c.lastName} ({c.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Product */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanApplications.product")} *
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {products?.map((p) => (
                                    <label
                                        key={p.id}
                                        className={`relative flex cursor-pointer rounded-xl border bg-white p-4 shadow-sm focus:outline-none transition-all ${formData.loanProductId === p.id
                                            ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50/30"
                                            : "border-gray-300 hover:border-gray-400"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="loanProduct"
                                            value={p.id}
                                            className="sr-only"
                                            checked={formData.loanProductId === p.id}
                                            onChange={(e) => handleProductChange(e.target.value)}
                                        />
                                        <span className="flex flex-1">
                                            <span className="flex flex-col">
                                                <span className="block text-sm font-medium text-gray-900">
                                                    {p.name}
                                                </span>
                                                <span className="mt-1 flex items-center text-xs text-gray-500">
                                                    {p.minAmount} - {p.maxAmount} {p.currency}
                                                </span>
                                                <span className="mt-1 text-xs text-blue-600 font-medium">
                                                    {p.minInterestRate}% - {p.maxInterestRate}% {p.interestRateMethod === "FLAT_RATE" ? "Flat" : "Declining"}
                                                </span>
                                            </span>
                                        </span>
                                        {formData.loanProductId === p.id && (
                                            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanApplications.requestedAmount")} *
                                {selectedProduct && (
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                        ({selectedProduct.minAmount.toLocaleString()} - {selectedProduct.maxAmount.toLocaleString()} {selectedProduct.currency})
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <span className="text-gray-500 sm:text-sm">{formData.currency === "USD" ? "$" : "៛"}</span>
                                </div>
                                <input
                                    type="number"
                                    required
                                    min={selectedProduct?.minAmount ?? 1}
                                    max={selectedProduct?.maxAmount ?? undefined}
                                    value={formData.requestedAmount || ""}
                                    onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Interest */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanApplications.interestRate")} (%) *
                                {selectedProduct && (
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                        ({selectedProduct.minInterestRate}% - {selectedProduct.maxInterestRate}%)
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                required
                                min={selectedProduct?.minInterestRate ?? 0}
                                max={selectedProduct?.maxInterestRate ?? undefined}
                                step="0.01"
                                value={formData.interestRate || ""}
                                onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Term */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanApplications.termMonths")} *
                                {selectedProduct && (
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                        ({selectedProduct.minTermMonths} - {selectedProduct.maxTermMonths} months)
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                required
                                min={selectedProduct?.minTermMonths ?? 1}
                                max={selectedProduct?.maxTermMonths ?? undefined}
                                value={formData.termMonths || ""}
                                onChange={(e) => setFormData({ ...formData, termMonths: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanApplications.frequency")} *
                            </label>
                            <select
                                required
                                value={formData.repaymentFrequency}
                                onChange={(e) => setFormData({ ...formData, repaymentFrequency: e.target.value as RepaymentFrequency })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="DAILY">{t("loanApplications.frequencies.DAILY")}</option>
                                <option value="WEEKLY">{t("loanApplications.frequencies.WEEKLY")}</option>
                                <option value="MONTHLY">{t("loanApplications.frequencies.MONTHLY")}</option>
                            </select>
                        </div>

                        {/* Grace Period */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Grace Period (Days)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={formData.gracePeriodDays || ""}
                                onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Currency
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="USD">USD</option>
                                <option value="KHR">KHR</option>
                            </select>
                        </div>

                        {/* Purpose */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("loanApplications.purpose")}
                            </label>
                            <textarea
                                rows={3}
                                value={formData.purpose}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                placeholder="Enter the purpose of the loan..."
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Link
                            href="/loan-applications"
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            {t("common.cancel")}
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.applicantId || !formData.loanProductId}
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
