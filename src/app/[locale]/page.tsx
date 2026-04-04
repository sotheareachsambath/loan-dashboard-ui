"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useUsers, useLoanApplications, useLoanProducts, useDisbursements, useParReport } from "@/lib/api/hooks";
import { useRole } from "@/lib/hooks/use-role";

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
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
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
  value: number | string;
  subtitle: string;
  color: keyof typeof colorMap;
  icon: React.ReactNode;
}

function StatCard({ label, value, subtitle, color, icon }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-black/[0.07] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] cursor-default">
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${c.wash} opacity-[0.07]`} />
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${c.bg} ${c.icon} mb-3`}>
        {icon}
      </div>
      <p className="text-[11px] font-medium tracking-widest text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 leading-none">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        {subtitle}
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

import { useAuth } from "@/lib/auth/auth-context";

export default function DashboardPage() {
  const t = useTranslations();
  const { isStaff, canManageUsers, canManageProducts } = useRole();

  // Real API data
  const { data: usersData } = useUsers({ page: 1, limit: 1 });
  const { data: allLoans } = useLoanApplications({ page: 1, limit: 1 });
  const { data: pendingLoans } = useLoanApplications({ status: "SUBMITTED", page: 1, limit: 1 });
  const { data: disbursedLoans } = useLoanApplications({ status: "DISBURSED", page: 1, limit: 1 });
  const { data: approvedLoans } = useLoanApplications({ status: "APPROVED", page: 1, limit: 1 });
  const { data: productsData } = useLoanProducts({ isActive: true });
  const { data: disbursementsRaw } = useDisbursements({ page: 1, limit: 1 });
  const { data: parReport } = useParReport();

  const { user} = useAuth();

  console.log("useAuthuseAuth11",user)

  const totalUsers = usersData?.meta?.total ?? 0;
  const totalApplications = allLoans?.meta?.total ?? 0;
  const pendingApplications = pendingLoans?.meta?.total ?? 0;
  const disbursedCount = disbursedLoans?.meta?.total ?? 0;
  const approvedCount = approvedLoans?.meta?.total ?? 0;
  const activeProducts = Array.isArray(productsData) ? productsData.length : 0;
  const totalDisbursements = (disbursementsRaw as any)?.count ?? disbursementsRaw?.meta?.total ?? 0;

  const par = parReport as Record<string, any> | null;
  const overdueCount = par?.totalOverdueSchedules ?? par?.overdueCount ?? 0;

  const stats: StatCardProps[] = [
    { label: t("dashboard.totalUsers"), value: totalUsers, subtitle: `${activeProducts} active products`, color: "blue", icon: <UsersIcon /> },
    { label: t("dashboard.activeLoans"), value: totalApplications, subtitle: `${disbursedCount} disbursed`, color: "green", icon: <DisbursementsIcon /> },
    { label: t("dashboard.pendingApplications"), value: pendingApplications, subtitle: `${approvedCount} approved`, color: "amber", icon: <ApplicationsIcon /> },
    { label: t("dashboard.totalDisbursed"), value: totalDisbursements, subtitle: overdueCount > 0 ? `${overdueCount} overdue` : "On track", color: "purple", icon: <DisbursementsIcon /> },
  ];

  const navCards: NavCardProps[] = [];

  if (canManageUsers) {
    navCards.push({
      href: "/users", title: t("nav.users"), description: "Manage borrower accounts and profiles",
      actionLabel: "View all users", meta: `${totalUsers.toLocaleString()} total`,
      icon: <UsersIcon />, iconBg: "bg-blue-50", iconColor: "text-blue-600",
    });
  }

  if (canManageProducts) {
    navCards.push({
      href: "/loan-products", title: t("nav.loanProducts"), description: "Configure rates, terms, and product tiers",
      actionLabel: "Manage products", meta: `${activeProducts} active`,
      icon: <ProductsIcon />, iconBg: "bg-violet-50", iconColor: "text-violet-600",
    });
  }

  navCards.push({
    href: "/loan-applications", title: t("nav.loanApplications"), description: "Review, approve or reject submissions",
    actionLabel: "View applications", meta: `${pendingApplications} pending`, metaHighlight: pendingApplications > 0,
    icon: <ApplicationsIcon />, iconBg: "bg-amber-50", iconColor: "text-amber-600",
  });

  if (isStaff) {
    navCards.push({
      href: "/disbursements", title: t("nav.disbursements"), description: "Track and process loan disbursements",
      actionLabel: "View disbursements", meta: `${totalDisbursements} processed`,
      icon: <DisbursementsIcon />, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    });

    navCards.push({
      href: "/repayments", title: t("nav.repayments"), description: "Monitor schedules and overdue accounts",
      actionLabel: "View repayments", meta: overdueCount > 0 ? `${overdueCount} overdue` : "On track",
      icon: <RepaymentsIcon />, iconBg: "bg-red-50", iconColor: "text-red-500",
    });
  }

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
        <span className="text-[11px] text-gray-400 bg-black/[0.04] rounded-full px-3 py-1">{navCards.length} modules</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map((card) => (
          <NavCard key={card.href} {...card} />
        ))}
      </div>
    </>
  );
}
