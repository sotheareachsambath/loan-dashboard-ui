"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/locale-switcher";
import { useUsers } from "@/lib/api/hooks";
import { useLoanApplications } from "@/lib/api/hooks";

export default function DashboardPage() {
  const t = useTranslations();

  const { data: usersData } = useUsers({ page: 1, limit: 1 });
  const { data: allLoans } = useLoanApplications({ page: 1, limit: 1 });
  const { data: pendingLoans } = useLoanApplications({ status: "SUBMITTED", page: 1, limit: 1 });
  const { data: disbursedLoans } = useLoanApplications({ status: "DISBURSED", page: 1, limit: 1 });

  const totalUsers = usersData?.meta?.total ?? 0;
  const activeLoans = allLoans?.meta?.total ?? 0;
  const pendingApplications = pendingLoans?.meta?.total ?? 0;
  const totalDisbursed = disbursedLoans?.meta?.total ?? 0;

  const navItems = [
    { href: "/users", label: t("nav.users") },
    { href: "/loan-products", label: t("nav.loanProducts") },
    { href: "/loan-applications", label: t("nav.loanApplications") },
    { href: "/disbursements", label: t("nav.disbursements") },
    { href: "/repayments", label: t("nav.repayments") },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              {t("common.appName")}
            </h1>
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {t("dashboard.title")}
        </h2>
        <p className="text-gray-600 mb-8">{t("dashboard.welcome")}</p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {[
            { label: t("dashboard.totalUsers"), value: totalUsers, color: "bg-blue-500" },
            { label: t("dashboard.activeLoans"), value: activeLoans, color: "bg-green-500" },
            { label: t("dashboard.pendingApplications"), value: pendingApplications, color: "bg-yellow-500" },
            { label: t("dashboard.totalDisbursed"), value: totalDisbursed, color: "bg-purple-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`rounded-md ${stat.color} p-3`}>
                    <div className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500 truncate">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Cards */}
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("nav.dashboard")}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <h4 className="text-base font-semibold text-gray-900">
                {item.label}
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {t("common.actions")} &rarr;
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
