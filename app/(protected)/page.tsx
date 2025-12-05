"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { isOwner } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = "/subscriptions")}
                >
                  Subscription Search
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = "/whitelabels")}
                >
                  Whitelabels
                </Button>
                {isOwner && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => (window.location.href = "/reports")}
                  >
                    Face Analytics Reports
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </main>
    </div>
  );
}

