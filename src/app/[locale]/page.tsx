"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useUsers, useLoanApplications } from "@/lib/api/hooks";

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ProductsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const ApplicationsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const DisbursementsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const RepaymentsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", wash: "bg-blue-500" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-600", wash: "bg-emerald-500" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", wash: "bg-amber-500" },
  purple: { bg: "bg-violet-50", icon: "text-violet-600", wash: "bg-violet-500" },
};

interface StatCardProps {
  label: string;
  value: number;
  change: string;
  changeType: "up" | "neutral";
  color: keyof typeof colorMap;
  icon: React.ReactNode;
}

function StatCard({ label, value, change, changeType, color, icon }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-black/[0.07] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] cursor-default">
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${c.wash} opacity-[0.07]`} />
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${c.bg} ${c.icon} mb-3`}>
        {icon}
      </div>
      <p className="text-[11px] font-medium tracking-widest text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 leading-none">{value.toLocaleString()}</p>
      <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${changeType === "up" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
        }`}>
        {change}
      </span>
    </div>
  );
}

interface NavCardProps {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
  meta: string;
  metaHighlight?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function NavCard({ href, title, description, actionLabel, meta, metaHighlight, icon, iconBg, iconColor }: NavCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-xl bg-white border border-black/[0.07] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.15] hover:shadow-lg hover:shadow-black/[0.06]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <span className="text-gray-400 transition-transform duration-200 group-hover:translate-x-1">
          <ArrowIcon />
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/[0.06]">
        <span className="text-xs font-medium text-blue-600">{actionLabel}</span>
        <span className={`text-xs font-medium ${metaHighlight ? "text-amber-600" : "text-gray-400"}`}>{meta}</span>
      </div>
    </Link>
  );
}

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

  const stats: StatCardProps[] = [
    { label: t("dashboard.totalUsers"), value: totalUsers, change: "↑ 12% this month", changeType: "up", color: "blue", icon: <UsersIcon /> },
    { label: t("dashboard.activeLoans"), value: activeLoans, change: "↑ 8% this month", changeType: "up", color: "green", icon: <DisbursementsIcon /> },
    { label: t("dashboard.pendingApplications"), value: pendingApplications, change: "Awaiting review", changeType: "neutral", color: "amber", icon: <ApplicationsIcon /> },
    { label: t("dashboard.totalDisbursed"), value: totalDisbursed, change: "↑ 5% this month", changeType: "up", color: "purple", icon: <DisbursementsIcon /> },
  ];

  return (
    <>
      {/* Page heading */}
      <div className="mb-10">
        <p className="text-[11px] font-medium tracking-widest uppercase text-gray-400 mb-2">Overview</p>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">{t("dashboard.title")}</h2>
        <p className="text-sm text-gray-500">
          <span className="hidden sm:inline">{t("dashboard.welcome")}</span>
          <span className="sm:hidden">Welcome to the LMS</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Nav section */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">{t("nav.dashboard")}</h3>
        <span className="text-[11px] text-gray-400 bg-black/[0.04] rounded-full px-3 py-1">5 modules</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NavCard href="/users" title={t("nav.users")} description="Manage borrower accounts and profiles" actionLabel="View all users" meta={`${totalUsers.toLocaleString()} total`} icon={<UsersIcon />} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <NavCard href="/loan-products" title={t("nav.loanProducts")} description="Configure rates, terms, and product tiers" actionLabel="Manage products" meta="12 active" icon={<ProductsIcon />} iconBg="bg-violet-50" iconColor="text-violet-600" />
        <NavCard href="/loan-applications" title={t("nav.loanApplications")} description="Review, approve or reject submissions" actionLabel="View applications" meta={`${pendingApplications} pending`} metaHighlight={pendingApplications > 0} icon={<ApplicationsIcon />} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <NavCard href="/disbursements" title={t("nav.disbursements")} description="Track and process loan disbursements" actionLabel="View disbursements" meta={`${totalDisbursed} processed`} icon={<DisbursementsIcon />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <NavCard href="/repayments" title={t("nav.repayments")} description="Monitor schedules and overdue accounts" actionLabel="View repayments" meta="On track" icon={<RepaymentsIcon />} iconBg="bg-red-50" iconColor="text-red-500" />
      </div>
    </>
  );
}