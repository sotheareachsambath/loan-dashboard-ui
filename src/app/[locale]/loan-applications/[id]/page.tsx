"use client";

import { use, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useLoanApplication, useApprovalHistory, useLoanDocuments, useUsers, useRepaymentSchedule, useRepaymentsByLoan, useDisbursementsByLoan } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import { useAuth } from "@/lib/auth/auth-context";
import { useRole } from "@/lib/hooks/use-role";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";
import type {
    UpdateLoanApplicationDto,
    DocumentType,
    LoanDocument,
    Disbursement,
    RepaymentSchedule,
    Repayment,
    RepaymentFrequency,
} from "@/lib/types";

type UploadedAsset = {
    id: string;
    key: string;
    fileName: string;
    url: string;
    publicUrl?: string;
    signedUrl?: string;
    mimeType: string;
    fileSize: number;
};

type LoanDisbursementListResponse = {
    disbursements?: Disbursement[];
    data?: Disbursement[];
};

type DocumentPreviewState = {
    name: string;
    url: string;
    mimeType?: string;
};

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
    const { isStaff } = useRole();

    const { data: application, isLoading, error, mutate } = useLoanApplication(id);
    const { data: history, mutate: mutateHistory } = useApprovalHistory(id);
    const { data: documents, mutate: mutateDocs } = useLoanDocuments(id);
    const { data: officersData } = useUsers({ role: "LOAN_OFFICER", limit: 100 });
    const officers = officersData?.data ?? [];
    const { data: rawSchedule, mutate: mutateSchedule } = useRepaymentSchedule(id);
    const schedule = rawSchedule?.schedules ?? [];
    const { data: rawRepayments } = useRepaymentsByLoan(id);
    const loanRepayments = rawRepayments?.repayments ?? [];
    const { data: rawDisbursements } = useDisbursementsByLoan(id);
    const disbursementResponse = rawDisbursements as Disbursement[] | LoanDisbursementListResponse | undefined;
    const loanDisbursements = Array.isArray(disbursementResponse)
        ? disbursementResponse
        : (disbursementResponse?.disbursements ?? disbursementResponse?.data ?? []);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionModal, setActionModal] = useState<"approve" | "reject" | "return" | "assign" | "edit" | null>(null);
    const [actionComments, setActionComments] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [actionError, setActionError] = useState("");
    const [scheduleMethod, setScheduleMethod] = useState<"EMI" | "BALLOON">("EMI");

    // Document upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>("OTHER");
    const [previewDocument, setPreviewDocument] = useState<DocumentPreviewState | null>(null);
    const [previewZoom, setPreviewZoom] = useState(1);

    // Edit form state
    const [editForm, setEditForm] = useState<UpdateLoanApplicationDto>({});

    // API maps: LOAN_OFFICER → OFFICER, MANAGER → MANAGER, DIRECTOR → DIRECTOR
    // ADMIN is NOT in the roleToLevel map, so ADMIN cannot approve
    const ROLE_TO_LEVEL: Record<string, string> = {
        LOAN_OFFICER: "OFFICER",
        MANAGER: "MANAGER",
        DIRECTOR: "DIRECTOR",
    };

    // API valid transitions: status → which approval level is allowed
    const STATUS_TO_REQUIRED_LEVEL: Record<string, string> = {
        UNDER_REVIEW: "OFFICER",        // LOAN_OFFICER approves
        OFFICER_APPROVED: "MANAGER",     // MANAGER approves
        MANAGER_APPROVED: "DIRECTOR",    // DIRECTOR approves
    };

    const STATUS_TO_REQUIRED_ROLE: Record<string, string> = {
        UNDER_REVIEW: "Loan Officer",
        OFFICER_APPROVED: "Manager",
        MANAGER_APPROVED: "Director",
    };

    const getApprovalLevel = (role: string) => {
        return ROLE_TO_LEVEL[role] || "OFFICER";
    };

    const canUserApproveAtCurrentLevel = () => {
        if (!application || !user) return false;
        const status = application.status;
        const requiredLevel = STATUS_TO_REQUIRED_LEVEL[status];
        if (!requiredLevel) return false; // status not in approval flow
        return user.roles?.some((r: string) => ROLE_TO_LEVEL[r] === requiredLevel) ?? false;
    };

    // What role is needed to approve at the current status?
    const requiredRoleForApproval = application ? STATUS_TO_REQUIRED_ROLE[application.status] : null;
    // Is the current status in the approval flow but user doesn't have the right role?
    const isInApprovalFlow = application ? !!STATUS_TO_REQUIRED_LEVEL[application.status] : false;

    const handleAction = async () => {
        if (!application || !user) return;
        setIsSubmitting(true);
        setActionError("");
        try {
            if (actionModal === "assign") {
                await api.post(`/loan-applications/${id}/assign-officer`, {
                    loanOfficerId: assigneeId,
                });
            } else if (actionModal === "edit") {
                await api.patch(`/loan-applications/${id}`, editForm);
            } else if (actionModal) {
                const actionMap: Record<string, string> = {
                    approve: "APPROVED",
                    reject: "REJECTED",
                    return: "RETURNED",
                };

                await api.post(`/loan-applications/${id}/approve`, {
                    approverId: user.id,
                    level: STATUS_TO_REQUIRED_LEVEL[application.status] || getApprovalLevel(user.roles?.[0] || ""),
                    action: actionMap[actionModal],
                    comments: actionComments,
                });
            }

            setActionModal(null);
            setActionComments("");
            setActionError("");
            setEditForm({});
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
            await api.post(`/repayment-schedules/generate`, { loanApplicationId: id, method: scheduleMethod });
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

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        setActionError("");
        try {
            const uploadedAssets = await Promise.all(
                Array.from(files).map(async (file) => {
                    const formData = new FormData();
                    formData.append("folder", "documents");
                    formData.append("file", file);
                    return api.postForm<UploadedAsset>("/assets/upload", formData);
                })
            );

            await Promise.all(uploadedAssets.map((asset) =>
                api.post(`/loan-applications/${id}/documents`, {
                    filePath: asset.publicUrl || asset.url,
                    documentType: selectedDocumentType,
                    fileName: asset.fileName,
                    originalName: asset.fileName,
                    mimeType: asset.mimeType,
                    fileSize: asset.fileSize,
                })
            ));

            await Promise.all([
                mutateDocs(),
                mutate(),
            ]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed";
            const info = (err as { info?: { message?: string } })?.info?.message;
            setActionError(info || message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const getDocumentViewUrl = (doc: LoanDocument) => {
        if (doc.signedUrl) return doc.signedUrl;
        if (doc.url?.startsWith("http")) return doc.url;
        if (doc.filePath.startsWith("http")) return doc.filePath;
        return null;
    };

    const formatDocumentTypeLabel = (type: string) => {
        return type.toLowerCase().replace(/_/g, " ");
    };

    const isPreviewableDocument = (doc: LoanDocument) => {
        return doc.mimeType?.startsWith("image/") || doc.mimeType === "application/pdf";
    };

    const clampZoom = (value: number) => Math.min(4, Math.max(0.5, Number(value.toFixed(2))));

    const changePreviewZoom = (delta: number) => {
        setPreviewZoom((current) => clampZoom(current + delta));
    };

    const resetPreviewZoom = () => {
        setPreviewZoom(1);
    };

    const documentsList = Array.isArray(documents)
        ? documents
        : Array.isArray(application?.documents)
            ? application.documents
            : [];

    const handleDeleteDocument = async (documentId: string) => {
        try {
            await api.delete(`/loan-applications/${id}/documents/${documentId}`);
            mutateDocs();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete document";
            setActionError(message);
        }
    };

    const openEditModal = () => {
        if (!application) return;
        setEditForm({
            requestedAmount: application.requestedAmount,
            interestRate: application.interestRate,
            termMonths: application.termMonths,
            repaymentFrequency: application.repaymentFrequency,
            purpose: application.purpose || "",
            gracePeriodDays: application.gracePeriodDays,
        });
        setActionError("");
        setActionModal("edit");
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

    const isDraft = application.status === "DRAFT";
    const isSubmitted = application.status === "SUBMITTED";
    const isEditable = isDraft || isSubmitted;
    const showApprovalActions = canUserApproveAtCurrentLevel();
    const showAssign = isSubmitted && isStaff;
    const canGenerateSchedule = application.status === "APPROVED" || application.status === "DISBURSED";
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
                    <p className="text-sm text-gray-500 mt-1">Created on {new Date(application.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isEditable && (
                        <button
                            onClick={openEditModal}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {t("common.edit")}
                        </button>
                    )}
                    {isDraft && (
                        <button
                            onClick={handleSubmitReview}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-gray-800 transition-colors"
                        >
                            {t("loanApplications.submitForReview")}
                        </button>
                    )}
                    {showApprovalActions && (
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
                    {/* Info badge: show who needs to act when current user can't */}
                    {isInApprovalFlow && !showApprovalActions && requiredRoleForApproval && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                            </svg>
                            Waiting for {requiredRoleForApproval} approval
                        </span>
                    )}
                </div>
            </div>

            {/* Approval Flow Status Info */}
            {isInApprovalFlow && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Approval Workflow</h3>
                            <div className="flex items-center gap-2 text-xs">
                                {[
                                    { status: "UNDER_REVIEW", label: "Loan Officer", level: "OFFICER" },
                                    { status: "OFFICER_APPROVED", label: "Manager", level: "MANAGER" },
                                    { status: "MANAGER_APPROVED", label: "Director", level: "DIRECTOR" },
                                ].map((step, i) => {
                                        const isCompleted = application.approvalWorkflows?.some(
                                            (w) => w.level === step.level && w.action === "APPROVED"
                                        );
                                    const isCurrent = application.status === step.status;
                                    const isRejected = application.status === "REJECTED";
                                    return (
                                        <div key={step.level} className="flex items-center gap-2">
                                            {i > 0 && <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>}
                                            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium ${isCompleted ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                                    isCurrent ? "bg-blue-50 text-blue-700 border border-blue-200 ring-2 ring-blue-100" :
                                                        isRejected ? "bg-red-50 text-red-500 border border-red-200" :
                                                            "bg-gray-50 text-gray-400 border border-gray-200"
                                                }`}>
                                                {isCompleted && <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>}
                                                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                                {application.status === "APPROVED" && (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                            Fully Approved
                                        </span>
                                    </div>
                                )}
                            </div>
                            {requiredRoleForApproval && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {showApprovalActions
                                        ? `You can approve, reject, or return this application as ${requiredRoleForApproval}.`
                                        : `A ${requiredRoleForApproval} needs to review this application. Actions: Approve, Reject, or Return for rework.`
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                    <div className="text-sm text-gray-500">{application.loanProduct?.loanType?.replace(/_/g, " ")}</div>
                                    <div className="text-sm text-gray-500">{application.loanProduct?.interestRateMethod === "FLAT_RATE" ? "Flat Rate" : "Declining Balance"}</div>
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
                                    {application.gracePeriodDays > 0 && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            Grace period: {application.gracePeriodDays} days
                                        </div>
                                    )}
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
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedDocumentType}
                                    onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType)}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    <option value="ID">ID</option>
                                    <option value="COLLATERAL">Collateral</option>
                                    <option value="INCOME_PROOF">Income Proof</option>
                                    <option value="OTHER">Other</option>
                                </select>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={handleDocumentUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                    {uploading ? "Uploading..." : "+ Upload Document"}
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {documentsList.length > 0 ? (
                                <ul className="space-y-3">
                                    {documentsList.map((doc, i) => {
                                        const viewUrl = getDocumentViewUrl(doc);
                                        const isImage = doc.mimeType?.startsWith("image/") ||
                                            /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.originalName || doc.fileName || "");

                                        return (
                                            <li key={doc.id || i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                                <div className="flex items-center gap-3">
                                                    {isImage && viewUrl ? (
                                                        <img src={viewUrl} alt={doc.originalName || "Document"} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                                    ) : (
                                                        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{doc.originalName || doc.fileName || `Document ${i + 1}`}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {doc.documentType && <span className="capitalize">{formatDocumentTypeLabel(doc.documentType)}</span>}
                                                            {doc.fileSize && <span className="ml-2">{(doc.fileSize / 1024).toFixed(1)} KB</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {viewUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                {
                                                                    setPreviewZoom(1);
                                                                    setPreviewDocument({
                                                                        name: doc.originalName || doc.fileName || `Document ${i + 1}`,
                                                                        url: viewUrl,
                                                                        mimeType: doc.mimeType,
                                                                    });
                                                                }
                                                            }
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                        >
                                                            {isPreviewableDocument(doc) ? "Preview" : "Open"}
                                                        </button>
                                                    )}
                                                    {doc.id && (
                                                        <button
                                                            onClick={() => handleDeleteDocument(doc.id!)}
                                                            className="text-sm text-red-500 hover:text-red-700"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Modal
                        open={!!previewDocument}
                        onClose={() => {
                            setPreviewDocument(null);
                            setPreviewZoom(1);
                        }}
                        title={previewDocument?.name || "Document Preview"}
                        maxWidthClassName="max-w-5xl"
                    >
                        {previewDocument && (
                            <div className="space-y-4">
                                {previewDocument.mimeType?.startsWith("image/") ? (
                                    <>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm text-gray-500">Use mouse wheel to zoom</p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => changePreviewZoom(-0.25)}
                                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    -
                                                </button>
                                                <span className="min-w-16 text-center text-sm font-medium text-gray-700">
                                                    {Math.round(previewZoom * 100)}%
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => changePreviewZoom(0.25)}
                                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={resetPreviewZoom}
                                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                        <div
                                            className="max-h-[75vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4"
                                            onWheel={(e) => {
                                                e.preventDefault();
                                                changePreviewZoom(e.deltaY < 0 ? 0.1 : -0.1);
                                            }}
                                        >
                                            <img
                                                src={previewDocument.url}
                                                alt={previewDocument.name}
                                                className="mx-auto rounded-lg object-contain"
                                                style={{
                                                    maxHeight: "70vh",
                                                    width: "auto",
                                                    maxWidth: "none",
                                                    transform: `scale(${previewZoom})`,
                                                    transformOrigin: "center center",
                                                }}
                                            />
                                        </div>
                                    </>
                                ) : previewDocument.mimeType === "application/pdf" ? (
                                    <iframe
                                        src={previewDocument.url}
                                        title={previewDocument.name}
                                        className="h-[75vh] w-full rounded-lg border border-gray-200"
                                    />
                                ) : (
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                                        Preview is not available for this file type.
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <a
                                        href={previewDocument.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        Open in new tab
                                    </a>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* Disbursements for this loan */}
                    {loanDisbursements.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <h2 className="text-lg font-medium text-gray-900">Disbursements</h2>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loanDisbursements.map((d: Disbursement & { disbursedAt?: string }) => (
                                            <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(d.disbursedAt || d.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(d.amount, application.currency)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.method?.replace(/_/g, " ")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center"><StatusBadge status={d.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Repayment Schedule */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">Repayment Schedule</h2>
                            {(!schedule || schedule.length === 0) && canGenerateSchedule && (
                                <div className="flex items-center gap-3">
                                    <select
                                        value={scheduleMethod}
                                        onChange={(e) => setScheduleMethod(e.target.value as "EMI" | "BALLOON")}
                                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs"
                                    >
                                        <option value="EMI">EMI</option>
                                        <option value="BALLOON">Balloon</option>
                                    </select>
                                    <button onClick={handleGenerateSchedule} disabled={isSubmitting} className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors">
                                        {isSubmitting ? "Generating..." : "+ Generate Schedule"}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {schedule && schedule.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">No.</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Principal</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Interest</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {schedule.map((installment: RepaymentSchedule) => (
                                            <tr key={installment.id || installment.installmentNumber} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{installment.installmentNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(installment.dueDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(installment.principalAmount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(installment.interestAmount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(installment.totalAmount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(installment.paidAmount || 0, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <StatusBadge status={installment.status || "PENDING"} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500">
                                        {canGenerateSchedule ? "No repayment schedule generated yet. Click the button above to generate one." : "Repayment schedule will be available after the loan is approved."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
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
                                        {loanRepayments.map((rep: Repayment) => (
                                            <tr key={rep.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(rep.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(rep.amount, application.currency || "USD")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{rep.repaymentType?.replace(/_/g, " ")}</span></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rep.paymentMethod?.replace(/_/g, " ")}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.referenceNumber || "\u2014"}</td>
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
                            {showAssign && (
                                <button onClick={() => setActionModal("assign")} className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md">
                                    {application.loanOfficer ? "Change" : "Assign"}
                                </button>
                            )}
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
                                        {(history as { action?: string; level?: string; comments?: string; approver?: { firstName?: string; lastName?: string }; createdAt?: string }[]).map((item, itemIdx: number) => (
                                            <li key={itemIdx}>
                                                <div className="relative pb-8">
                                                    {itemIdx !== history.length - 1 ? (
                                                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                    ) : null}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${item.action === "APPROVED" ? "bg-emerald-100" : item.action === "REJECTED" ? "bg-red-100" : "bg-gray-100"}`}>
                                                                <svg className={`h-4 w-4 ${item.action === "APPROVED" ? "text-emerald-600" : item.action === "REJECTED" ? "text-red-600" : "text-gray-500"}`} viewBox="0 0 20 20" fill="currentColor">
                                                                    {item.action === "REJECTED" ? (
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    ) : (
                                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                                    )}
                                                                </svg>
                                                            </span>
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                            <div>
                                                                <p className="text-sm text-gray-500">
                                                                    <span className="font-medium text-gray-900">{item.action || "Updated"}</span> by{" "}
                                                                    {item.approver ? `${item.approver.firstName} ${item.approver.lastName}` : item.level || "System"}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-0.5">{item.level} level</p>
                                                                {item.comments && (
                                                                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100">{item.comments}</p>
                                                                )}
                                                            </div>
                                                            {item.createdAt && (
                                                                <div className="whitespace-nowrap text-right text-xs text-gray-400">
                                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                                </div>
                                                            )}
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
                onClose={() => { setActionModal(null); setActionError(""); }}
                title={
                    actionModal === "assign" ? "Assign Loan Officer" :
                        actionModal === "edit" ? "Edit Application" :
                            `Confirm ${actionModal}`
                }
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
                    ) : actionModal === "edit" ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editForm.requestedAmount || ""}
                                    onChange={(e) => setEditForm({ ...editForm, requestedAmount: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editForm.interestRate || ""}
                                    onChange={(e) => setEditForm({ ...editForm, interestRate: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editForm.termMonths || ""}
                                    onChange={(e) => setEditForm({ ...editForm, termMonths: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Frequency</label>
                                <select
                                    value={editForm.repaymentFrequency || "MONTHLY"}
                                    onChange={(e) => setEditForm({ ...editForm, repaymentFrequency: e.target.value as RepaymentFrequency })}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                                <textarea
                                    rows={2}
                                    value={editForm.purpose || ""}
                                    onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
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
                        onClick={() => { setActionModal(null); setActionError(""); }}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={handleAction}
                        disabled={isSubmitting || (actionModal === "assign" && !assigneeId)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        {isSubmitting ? t("common.loading") : actionModal === "edit" ? t("common.save") : t("common.confirm")}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
