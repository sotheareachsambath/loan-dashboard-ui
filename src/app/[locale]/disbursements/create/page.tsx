"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLoanApplications } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/fetcher";
import type { CreateDisbursementDto, DisbursementMethod } from "@/lib/types";

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function CreateDisbursementPage() {
    const t = useTranslations();
    const router = useRouter();
    const { user } = useAuth();

    // Fetch approved applications eligible for disbursement
    const { data: applicationsRaw } = useLoanApplications({ status: "APPROVED", limit: 100 });
    const applications = applicationsRaw?.data ?? [];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<CreateDisbursementDto>({
        loanApplicationId: "",
        disbursedById: user?.id ?? "",
        amount: 0,
        method: "CASH",
        bankName: "",
        accountNumber: "",
        referenceNumber: "",
        notes: "",
    });

    const disbursedById = formData.disbursedById || user?.id || "";
    const selectedApp = applications.find((a) => a.id === formData.loanApplicationId);

    // Auto-fill amount when selecting an application
    const handleApplicationChange = (appId: string) => {
        const app = applications.find((a) => a.id === appId);
        setFormData((prev) => ({
            ...prev,
            loanApplicationId: appId,
            amount: app?.approvedAmount || app?.requestedAmount || prev.amount,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await api.post("/disbursements", { ...formData, disbursedById });
            router.push("/disbursements");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Failed to create disbursement");
            } else {
                setError("Failed to create disbursement");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = formData.loanApplicationId && formData.amount > 0 && formData.method;
    const showBankFields = formData.method === "BANK_TRANSFER";

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/disbursements" className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {t("disbursements.createDisbursement")}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Disburse funds for an approved loan application</p>
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
                                onChange={(e) => handleApplicationChange(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="" disabled>Select an approved loan...</option>
                                {applications.map((app) => (
                                    <option key={app.id} value={app.id}>
                                        #{app.id.slice(0, 8)} — {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : "Unknown"} — {formatCurrency(app.approvedAmount || app.requestedAmount, app.currency)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Loan Summary */}
                        {selectedApp && (
                            <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Requested</p>
                                        <p className="font-semibold text-gray-900">{formatCurrency(selectedApp.requestedAmount, selectedApp.currency)}</p>
                                    </div>
                                    {selectedApp.approvedAmount && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Approved</p>
                                            <p className="font-semibold text-emerald-700">{formatCurrency(selectedApp.approvedAmount, selectedApp.currency)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Interest Rate</p>
                                        <p className="font-semibold text-gray-900">{selectedApp.interestRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Term</p>
                                        <p className="font-semibold text-gray-900">{selectedApp.termMonths} months</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("disbursements.amount")} *
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

                        {/* Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("disbursements.method")} *
                            </label>
                            <select
                                required
                                value={formData.method}
                                onChange={(e) => setFormData({ ...formData, method: e.target.value as DisbursementMethod })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="CASH">{t("disbursements.methods.CASH")}</option>
                                <option value="BANK_TRANSFER">{t("disbursements.methods.BANK_TRANSFER")}</option>
                            </select>
                        </div>

                        {/* Bank Name (conditional) */}
                        {showBankFields && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        {t("disbursements.bankName")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                        placeholder="e.g. ABA Bank"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        {t("disbursements.accountNumber")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                        placeholder="e.g. 001234567"
                                    />
                                </div>
                            </>
                        )}

                        {/* Reference Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("disbursements.reference")}
                            </label>
                            <input
                                type="text"
                                value={formData.referenceNumber}
                                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                placeholder="e.g. DSB-12345"
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                {t("disbursements.notes")}
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
                            href="/disbursements"
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
                                t("disbursements.createDisbursement")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
