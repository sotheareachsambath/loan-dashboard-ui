import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import AppShell from "@/components/layout/app-shell";
import "../globals.css";

export const metadata: Metadata = {
  title: "Loan Management System",
  description: "Loan management system for Cambodian microfinance institutions",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&family=Siemreap&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-gray-50">
        <NextIntlClientProvider messages={messages}>
          <AppShell>
            {children}
          </AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
