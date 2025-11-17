"use client";

import { AuthGuard } from "@/components/auth-guard";
import { TopNavigation } from "@/components/top-navigation";

/**
 * Layout for all protected pages
 * Wraps all pages in this directory with AuthGuard and includes top navigation
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TopNavigation />
      {children}
    </AuthGuard>
  );
}

