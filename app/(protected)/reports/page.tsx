"use client";

import { useRouter } from "next/navigation";
import { OwnerGuard } from "@/components/owner-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  BarChart3,
  FileText,
  TrendingUp,
} from "lucide-react";

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status: "available" | "coming_soon";
}

const reports: ReportItem[] = [
  {
    id: "face-analytics",
    title: "Face Analytics Report",
    description:
      "AWS Rekognition usage analytics including photo indexing, selfie search statistics, and cost breakdown with CSV export.",
    icon: <Camera className="h-6 w-6" />,
    href: "/reports/face-analytics",
    status: "available",
  },
  {
    id: "usage-metrics",
    title: "Usage Metrics Report",
    description:
      "Platform usage statistics including active users, events created, photos uploaded, and storage consumption.",
    icon: <BarChart3 className="h-6 w-6" />,
    href: "/reports/usage-metrics",
    status: "coming_soon",
  },
  {
    id: "revenue-report",
    title: "Revenue Report",
    description:
      "Financial analytics including subscription revenue, payment transactions, and revenue trends over time.",
    icon: <TrendingUp className="h-6 w-6" />,
    href: "/reports/revenue",
    status: "coming_soon",
  },
  {
    id: "audit-logs",
    title: "Audit Logs Report",
    description:
      "System audit logs including admin actions, user activities, and security events.",
    icon: <FileText className="h-6 w-6" />,
    href: "/reports/audit-logs",
    status: "coming_soon",
  },
];

export default function ReportsListPage() {
  const router = useRouter();

  return (
    <OwnerGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-8">
          {/* Back button */}
          <div className="mb-4 md:mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="mb-3 md:mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Reports</h1>
            <p className="text-muted-foreground">
              Access detailed analytics and reports for the Kamero platform.
              These reports are restricted to owners only.
            </p>
          </div>

          {/* Reports Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <Card
                key={report.id}
                className={`p-6 transition-all ${
                  report.status === "available"
                    ? "cursor-pointer hover:shadow-md hover:border-primary/50"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (report.status === "available") {
                    router.push(report.href);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      report.status === "available"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {report.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-medium">{report.title}</h2>
                      {report.status === "coming_soon" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                  {report.status === "available" && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </OwnerGuard>
  );
}
