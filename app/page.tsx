"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-semibold text-foreground hover:opacity-80">
                Kamero Super Admin
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/support-tickets" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Support Tickets
                </Link>
                <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Event Search
                </Link>
                <Link href="/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  User Search
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <ThemeToggle />
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto flex-1 px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-4 text-2xl font-semibold text-card-foreground">
                Welcome to Kamero Super Admin
              </h2>
              <p className="mb-4 text-muted-foreground">
                You are successfully authenticated. This is a protected page.
              </p>
            </Card>
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-card-foreground">
                Quick Links
              </h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = "/support-tickets")}
                >
                  Support Tickets
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = "/events")}
                >
                  Event Search
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = "/users")}
                >
                  User Search
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
