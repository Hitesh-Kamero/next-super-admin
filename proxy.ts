import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy.ts - Network boundary and request routing layer
 * This runs on the Node.js runtime for lightweight routing tasks.
 * 
 * Note: Authentication logic is handled in components (AuthGuard),
 * this file is only for network-level routing and redirects.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow access to login page and static files
  // All other routes will be handled by client-side AuthGuard
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // For all other routes, continue to the application
  // Authentication will be checked client-side by AuthGuard component
  return NextResponse.next();
}

