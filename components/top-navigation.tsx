"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export function TopNavigation() {
  const { user, logout, isOwner } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = useMemo(() => {
    const items = [
      { href: "/", label: "Home" },
      { href: "/support-tickets", label: "Support Tickets" },
      { href: "/events", label: "Event Search" },
      { href: "/users", label: "User Search" },
    ];

    // Only show Reports link for owners
    if (isOwner) {
      items.push({ href: "/reports", label: "Reports" });
    }

    return items;
  }, [isOwner]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <Link 
          href="/" 
          className="flex items-center text-xl font-semibold text-foreground hover:opacity-80 transition-opacity"
        >
          Kamero Super Admin
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        isActive(item.href) && "bg-accent text-accent-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right side: User info, Theme toggle, Sign out */}
        <div className="flex items-center gap-4">
          {/* User email - hidden on mobile */}
          <span className="hidden sm:block text-sm text-muted-foreground">
            {user?.email}
          </span>
          
          <ThemeToggle />
          
          <Button variant="outline" onClick={logout} className="hidden sm:inline-flex">
            Sign Out
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {user?.email}
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="w-full justify-start"
              >
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

