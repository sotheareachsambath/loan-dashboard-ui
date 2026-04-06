"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/fetcher";
import type { User, CreateUserDto, UpdateUserDto, UserRole, UserStatus } from "@/lib/types";

const ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "MANAGER", "LOAN_OFFICER", "TELLER", "CUSTOMER"];
const STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

interface CustomerProps {
  user?: User;
}

export default function CustomerForm({ user }: CustomerProps) {
  const t = useTranslations();
  const router = useRouter();
  const isEdit = !!user;

  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    password: "",
    phone: user?.phone ?? "",
    //ts-ignore
    roles: user?.roles ?? ["CUSTOMER" as UserRole],
    status: user?.status ?? ("ACTIVE" as UserStatus),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        const body: UpdateUserDto = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          roles: form.roles,
          status: form.status,
        };
        if (form.password) body.password = form.password;
        await api.patch(`/users/${user.id}`, body);
      } else {
        const body: CreateUserDto = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          roles: form.roles,
        };
        await api.post("/users", body);
      }
      router.push("/customers");
    } catch (err: unknown) {
      const e = err as { info?: { message?: string } };
      setError(e?.info?.message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("users.firstName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("users.lastName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("users.email")} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("users.password")} {!isEdit && <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          required={!isEdit}
          minLength={6}
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder={isEdit ? "Leave blank to keep current" : ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("users.phone")}
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+855123456789"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Role */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("users.role")}
          </label>
          <select
            value={form.roles[0]}
            onChange={(e) => update("roles", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`users.roles.${role}`)}
              </option>
            ))}
          </select>
        </div> */}

        {/* Status (edit only) */}
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("common.status")}
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`users.statuses.${status}`)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : isEdit ? t("common.save") : t("common.create")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/users")}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
