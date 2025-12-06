"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OwnerGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export function OwnerGuard({ children, fallbackPath = "/" }: OwnerGuardProps) {
  const { user, loading, isOwner } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md p-6 text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access this page. This section is restricted to owners only.
          </p>
          <Button onClick={() => router.push(fallbackPath)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
