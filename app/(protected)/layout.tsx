"use client";

import { AuthGuard } from "@/components/auth-guard";

/**
 * Layout for all protected pages
 * Wraps all pages in this directory with AuthGuard
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}

