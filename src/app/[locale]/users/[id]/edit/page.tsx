"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useUser } from "@/lib/api/hooks";
import UserForm from "@/components/users/user-form";
import LocaleSwitcher from "@/components/locale-switcher";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations();
  const { data: user, isLoading, error } = useUser(id);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">{t("common.appName")}</span>
                <span className="sm:hidden">LMS</span>
              </Link>
              <span className="text-gray-300">/</span>
              <Link href="/users" className="text-gray-600 hover:text-gray-900">
                {t("nav.users")}
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600">{t("common.edit")}</span>
            </div>
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          {t("users.editUser")}
        </h1>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          {isLoading && (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          )}
          {error && (
            <p className="text-sm text-red-500">{t("common.error")}</p>
          )}
          {user && <UserForm user={user} />}
        </div>
      </main>
    </div>
  );
}
