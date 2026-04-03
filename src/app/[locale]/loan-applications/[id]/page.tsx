"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useLoanApplication, useApprovalHistory, useLoanDocuments, useUsers, useRepaymentSchedule, useRepaymentsByLoan } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import { useAuth } from "@/lib/auth/auth-context";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function LoanApplicationDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const t = useTranslations();
    const router = useRouter();
    const { user } = useAuth();

    const { data: application, isLoading, error, mutate } = useLoanApplication(id);
    const { data: history, mutate: mutateHistory } = useApprovalHistory(id);
    const { data: documents } = useLoanDocuments(id);
    const { data: officersData } = useUsers({ role: "LOAN_OFFICER", limit: 100 });
    const officers = officersData?.data ?? [];
    const { data: rawSchedule, mutate: mutateSchedule } = useRepaymentSchedule(id);
    const schedule = Array.isArray(rawSchedule) ? rawSchedule : ((rawSchedule as any)?.data ?? []);
    const { data: rawRepayments } = useRepaymentsByLoan(id);
    const loanRepayments = Array.isArray(rawRepayments) ? rawRepayments : ((rawRepayments as any)?.data ?? []);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionModal, setActionModal] = useState<"approve" | "reject" | "return" | "assign" | null>(null);
    const [actionComments, setActionComments] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [actionError, setActionError] = useState("");

    const getApprovalLevel = (role: string) => {
        if (role === "DIRECTOR") return "DIRECTOR";
        if (role === "MANAGER") return "MANAGER";
        return "OFFICER";
    };

    const handleAction = async () => {
        if (!application || !user) return;
        setIsSubmitting(true);
        setActionError("");
        try {
            if (actionModal === "assign") {
                await api.post(`/loan-applications/${id}/assign-officer`, {
                    loanOfficerId: assigneeId,
                });
            } else if (actionModal) {
                const actionMap: Record<string, string> = {
                    approve: "APPROVED",
                    reject: "REJECTED",
                    return: "RETURNED",
                };

                await api.post(`/loan-applications/${id}/approve`, {
                    approverId: user.id,
                    level: getApprovalLevel(user.role),
                    action: actionMap[actionModal],
                    comments: actionComments,
                });
            }

            setActionModal(null);
            setActionComments("");
            setActionError("");
            mutate();
            mutateHistory();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Failed to process action";
            const info = (err as { info?: { message?: string } })?.info?.message;
            setActionError(info || message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!application) return;
        setIsSubmitting(true);
        setActionError("");
        try {
            await api.post(`/loan-applications/${id}/submit`);
            mutate();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Failed to submit";
            const info = (err as { info?: { message?: string } })?.info?.message;
            setActionError(info || message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateSchedule = async () => {
        setIsSubmitting(true);
        setActionError("");
        try {
            await api.post(`/repayment-schedules/generate`, { loanApplicationId: id });
            mutateSchedule();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Failed to generate schedule";
            const info = (err as { info?: { message?: string } })?.info?.message;
            setActionError(info || message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !application) {
        return (
            <div className="flex h-64 flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200">
                <p className="text-red-500 font-medium mb-4">{t("common.error")}</p>
                <button onClick={() => router.back()} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
                    {t("common.back")}
                </button>
            </div>
        );
    }

    const isPending = application.status === "DRAFT";
    const canApprove = application.status === "SUBMITTED" || application.status === "UNDER_REVIEW" || application.status === "OFFICER_APPROVED" || application.status === "MANAGER_APPROVED";

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Action Error Banner */}
            {actionError && !actionModal && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-center justify-between">
                    <span>{actionError}</span>
                    <button onClick={() => setActionError("")} className="text-red-400 hover:text-red-600 ml-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <button onClick={() => router.push('/loan-applications')} className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Back to Applications
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-gray-900">Application #{application.id.slice(0, 8)}</h1>
                        <StatusBadge status={application.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Submitted on {new Date(application.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {isPending && (
                        <button
                            onClick={handleSubmitReview}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-gray-800 transition-colors"
                        >
                            {t("loanApplications.submitForReview")}
                        </button>
                    )}
                    {canApprove && user?.role !== "TELLER" && user?.role !== "CUSTOMER" && (
                        <>
                            <button
                                onClick={() => { setActionError(""); setActionModal("approve"); }}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                            >
                                {t("loanApplications.approve")}
                            </button>
                            <button
                                onClick={() => { setActionError(""); setActionModal("reject"); }}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-red-600/20 hover:bg-red-700 transition-colors"
                            >
                                {t("loanApplications.reject")}
                            </button>
                            <button
                                onClick={() => { setActionError(""); setActionModal("return"); }}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-colors"
                            >
                                {t("loanApplications.return")}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Applicant & Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-medium text-gray-900">Application Details</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Applicant</div>
                                    <div className="text-base text-gray-900 font-medium">
                                        {application.applicant ? `${application.applicant.firstName} ${application.applicant.lastName}` : "Unknown"}
                                    </div>
                                    <div className="text-sm text-gray-500">{application.applicant?.email}</div>
                                    <div className="text-sm text-gray-500">{application.applicant?.phone}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Product Details</div>
                                    <div className="text-base text-gray-900 font-medium">{application.loanProduct?.name || "Unknown Product"}</div>
                                    <div className="text-sm text-gray-500">{application.loanProduct?.loanType}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Requested Amount</div>
                                    <div className="text-2xl text-gray-900 font-semibold">{formatCurrency(application.requestedAmount, application.currency)}</div>
                                    {application.approvedAmount && application.approvedAmount !== application.requestedAmount && (
                                        <div className="text-sm text-emerald-600 font-medium mt-1">
                                            Approved: {formatCurrency(application.approvedAmount, application.currency)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Terms</div>
                                    <div className="text-sm text-gray-900">
                                        <span className="font-medium">{application.termMonths} Months</span> @ {application.interestRate}% interest
                                    </div>
                                    <div className="text-sm text-gray-900 mt-1">
                                        Frequency: {t(`loanApplications.frequencies.${application.repaymentFrequency}`)}
                                    </div>
                                </div>
                                {application.purpose && (
                                    <div className="col-span-full pt-4 border-t border-gray-100">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Purpose</div>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">{application.purpose}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                + Upload Document
                            </button>
                        </div>
                        <div className="p-6">
                            {documents && documents.length > 0 ? (
                                <ul className="space-y-3">
                                    {(documents as { type?: string }[]).map((doc, i: number) => (
                                        <li key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{doc.type}</p>
                                                    <p className="text-xs text-gray-500">Document {i + 1}</p>
                                                </div>
                                            </div>
                                            <button className="text-sm text-gray-500 hover:text-gray-900">Download</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Repayment Schedule */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">Repayment Schedule</h2>
                            {(!schedule || schedule.length === 0) && (
                                <button onClick={handleGenerateSchedule} disabled={isSubmitting} className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors">
                                    {isSubmitting ? "Generating..." : "+ Generate Schedule"}
                                </button>
                            )}
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {schedule && schedule.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">No.</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Principal</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Interest</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {schedule.map((installment: any) => (
                                            <tr key={installment.id || installment.installmentNumber} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{installment.installmentNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(installment.dueDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(installment.principalAmount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(installment.interestAmount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(installment.totalAmount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <StatusBadge status={installment.status || "PENDING"} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500">No repayment schedule generated yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">Payment History</h2>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {loanRepayments && loanRepayments.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loanRepayments.map((rep: any) => (
                                            <tr key={rep.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(rep.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(rep.amount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{rep.repaymentType}</span></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rep.paymentMethod}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.referenceNumber || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500">No payment history available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Assignment */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-base font-medium text-gray-900">Assignment</h2>
                            <button onClick={() => setActionModal("assign")} className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md">
                                Change
                            </button>
                        </div>
                        <div className="p-6">
                            {application.loanOfficer ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-violet-100 flex flex-shrink-0 items-center justify-center text-violet-600 font-medium">
                                        {application.loanOfficer.firstName?.[0] || ""}{application.loanOfficer.lastName?.[0] || ""}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{application.loanOfficer.firstName} {application.loanOfficer.lastName}</p>
                                        <p className="text-xs text-gray-500 truncate text-ellipsis">Loan Officer</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Unassigned</p>
                            )}
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-base font-medium text-gray-900">Activity History</h2>
                        </div>
                        <div className="p-6">
                            {history && history.length > 0 ? (
                                <div className="flow-root">
                                    <ul role="list" className="-mb-8">
                                        {(history as { action?: string; level?: string; comments?: string }[]).map((item, itemIdx: number) => (
                                            <li key={itemIdx}>
                                                <div className="relative pb-8">
                                                    {itemIdx !== history.length - 1 ? (
                                                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                    ) : null}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                                                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                            <div>
                                                                <p className="text-sm text-gray-500">
                                                                    <span className="font-medium text-gray-900">{item.action || "Updated"}</span> by {item.level || "System"}
                                                                </p>
                                                                {item.comments && (
                                                                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100">{item.comments}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No history available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            <Modal
                open={!!actionModal}
                onClose={() => setActionModal(null)}
                title={actionModal === "assign" ? "Assign Loan Officer" : `Confirm ${actionModal}`}
            >
                <div className="mb-6">
                    {actionError && (
                        <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                            {actionError}
                        </div>
                    )}
                    {actionModal === "assign" ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Officer</label>
                            <select
                                value={assigneeId}
                                onChange={e => setAssigneeId(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            >
                                <option value="" disabled>Select a loan officer...</option>
                                {officers.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.firstName} {o.lastName} ({o.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to <strong>{actionModal}</strong> this application? Add optional comments below.
                            </p>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                            <textarea
                                value={actionComments}
                                onChange={(e) => setActionComments(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 outline-none"
                                placeholder="Enter any necessary notes..."
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                    <button
                        onClick={() => setActionModal(null)}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={handleAction}
                        disabled={isSubmitting || (actionModal === "assign" && !assigneeId)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        {isSubmitting ? t("common.loading") : t("common.confirm")}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
