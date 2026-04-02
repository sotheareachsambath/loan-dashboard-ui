"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useUsers } from "@/lib/api/hooks";
import { api } from "@/lib/api/fetcher";
import type { UserRole, UserStatus } from "@/lib/types";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";
import LocaleSwitcher from "@/components/locale-switcher";

const ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "MANAGER", "LOAN_OFFICER", "TELLER", "CUSTOMER"];
const STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function UsersPage() {
  const t = useTranslations();

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: raw, error, isLoading, mutate } = useUsers({
    page,
    limit: 10,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const users = raw?.data ?? [];
  const total = raw?.meta?.total ?? 0;
  const totalPages = raw?.meta?.totalPages ?? 0;

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      mutate();
    } catch {
      // error handling
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                {t("common.appName")}
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600">{t("nav.users")}</span>
            </div>
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Title + Create Button */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("users.title")}
          </h1>
          <Link
            href="/users/create"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + {t("users.createUser")}
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as UserRole | ""); setPage(1); }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">{t("users.role")} — {t("common.filter")}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{t(`users.roles.${r}`)}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ""); setPage(1); }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">{t("common.status")} — {t("common.filter")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`users.statuses.${s}`)}</option>
            ))}
          </select>

          {(roleFilter || statusFilter) && (
            <button
              onClick={() => { setRoleFilter(""); setStatusFilter(""); setPage(1); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("users.firstName")} / {t("users.lastName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("users.email")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("users.phone")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("users.role")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("common.status")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      {t("common.loading")}
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
                {!isLoading && !error && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      {t("common.noData")}
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {t(`users.roles.${user.role}`)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <Link
                        href={`/users/${user.id}/edit`}
                        className="mr-3 font-medium text-blue-600 hover:text-blue-800"
                      >
                        {t("common.edit")}
                      </Link>
                      <button
                        onClick={() => setDeleteId(user.id)}
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
              <p className="text-sm text-gray-600">
                {t("common.showing")} {users.length} {t("common.of")} {total} {t("common.entries")}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  &laquo;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-md border px-3 py-1 text-sm ${
                      p === page
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t("common.confirm")}
      >
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? t("common.loading") : t("common.delete")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
