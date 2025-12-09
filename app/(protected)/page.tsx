"use client";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  Ticket,
  Calendar,
  Users,
  CreditCard,
  Tag,
  UserPlus,
  Globe,
  ShoppingCart,
  Wallet,
  ClipboardList,
  ScanFace,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isOwner } = useAuth();

  const links = [
    {
      title: "Support Tickets",
      href: "/support-tickets",
      icon: Ticket,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Event Search",
      href: "/events",
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "User Search",
      href: "/users",
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Subscription Search",
      href: "/subscriptions",
      icon: CreditCard,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Whitelabels",
      href: "/whitelabels",
      icon: Tag,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      title: "Recent Signups",
      href: "/recent-signups",
      icon: UserPlus,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Web Leads",
      href: "/web-leads",
      icon: Globe,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Orders",
      href: "/orders",
      icon: ShoppingCart,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Seller Wallets",
      href: "/seller-wallets",
      icon: Wallet,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Audit Logs",
      href: "/audit-logs",
      icon: ClipboardList,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
    },
  ];

  if (isOwner) {
    links.push({
      title: "Face Analytics Reports",
      href: "/reports",
      icon: ScanFace,
      color: "text-red-500",
      bg: "bg-red-500/10",
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to Kamero Super Admin. Select a quick link to get started.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group block">
              <Card className="flex h-full flex-col justify-between p-6 transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-lg p-3 ${link.bg} ${link.color} transition-colors group-hover:bg-primary/10 group-hover:text-primary`}
                  >
                    <link.icon className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-lg">{link.title}</h3>
                </div>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-all group-hover:scale-150" />
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

