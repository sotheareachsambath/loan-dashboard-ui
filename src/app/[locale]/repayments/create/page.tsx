"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLoanApplications } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/fetcher";
import type { CreateRepaymentDto, RepaymentType } from "@/lib/types";

const REPAYMENT_TYPES: RepaymentType[] = ["REGULAR", "EARLY_REPAYMENT", "PREPAYMENT", "PENALTY"];
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHECK"];

function formatCurrency(amount: number, currency: string) {
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

    const { data: applicationsRaw } = useLoanApplications({ status: "DISBURSED", limit: 100 });
    const applications = applicationsRaw?.data ?? [];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<CreateRepaymentDto>({
        loanApplicationId: "",
        collectedById: user?.id ?? "",
        amount: 0,
        repaymentType: "REGULAR",
        paymentMethod: "CASH",
        referenceNumber: "",
        notes: "",
    });

    // Update collectedById when user loads
    const collectedById = formData.collectedById || user?.id || "";

    const selectedApp = applications.find((a) => a.id === formData.loanApplicationId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await api.post("/repayments", { ...formData, collectedById });
            router.push("/repayments");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Failed to record payment");
            } else {
                setError("Failed to record payment");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = formData.loanApplicationId && formData.amount > 0 && formData.paymentMethod;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/repayments" className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {t("repayments.recordPayment")}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Record a repayment against a disbursed loan</p>
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
                        {/* Loan Application */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Loan Application *
                            </label>
                            <select
                                required
                                value={formData.loanApplicationId}
                                onChange={(e) => setFormData({ ...formData, loanApplicationId: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="" disabled>Select a disbursed loan...</option>
                                {applications.map((app) => (
                                    <option key={app.id} value={app.id}>
                                        #{app.id.slice(0, 8)} — {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "Unknown"} — {formatCurrency(app.requestedAmount, app.currency)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Loan Summary */}
                        {selectedApp && (
                            <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Loan Amount</p>
                                        <p className="font-semibold text-gray-900">{formatCurrency(selectedApp.requestedAmount, selectedApp.currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Interest Rate</p>
                                        <p className="font-semibold text-gray-900">{selectedApp.interestRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Term</p>
                                        <p className="font-semibold text-gray-900">{selectedApp.termMonths} months</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Frequency</p>
                                        <p className="font-semibold text-gray-900">{t(`loanApplications.frequencies.${selectedApp.repaymentFrequency}`)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("repayments.amount")} *
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    step="0.01"
                                    value={formData.amount || ""}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Repayment Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("repayments.type")} *
                            </label>
                            <select
                                required
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
                                    <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
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
                                placeholder="e.g. TXN-12345"
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

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Link
                            href="/repayments"
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
                                t("repayments.recordPayment")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
