"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X, BookOpen, Target, GearSix, SquaresFour, ChefHat, Package, SignOut, CookingPot } from "@phosphor-icons/react";
import { Logo } from "@/components/common/logo.component";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/use-logout";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  } | null;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AppShell({ children, user, header, footer }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { logout, isLoggingOut } = useLogout();
  
  // Close sidebar on route change
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isMarketing = pathname === "/" || pathname === "/onboarding";
  
  if (isMarketing) {
    return (
      <div className="flex min-h-screen flex-col font-sans">
        {header}
        <main className="flex-1">{children}</main>
        {footer}
      </div>
    );
  }

  // App routes
  const navItems = [
    { label: "Menus", href: "/menus", icon: BookOpen },
    { label: "Pantry", href: "/pantry", icon: CookingPot },
    { label: "Goals", href: "/goal-alignment", icon: Target },
    { label: "Settings", href: "/personalization", icon: GearSix },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: "Admin", href: "/admin", icon: SquaresFour });
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-subtle"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={24} /> : <List size={24} />}
          </button>
          <Logo />
        </div>
        {/* User avatar/profile could go here */}
      </header>

      {/* Sidebar Backdrop (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border-subtle transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border-subtle">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
          
          {user?.isAdmin && (
             <div className="mt-8">
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Workspace
                </div>
                <Link
                  href="/admin/recipes"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith("/admin/recipes")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                  )}
                >
                  <ChefHat size={20} />
                  Recipes
                </Link>
                <Link
                  href="/admin/inventory"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith("/admin/inventory")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                  )}
                >
                  <Package size={20} />
                  Inventory
                </Link>
             </div>
          )}
        </div>

        {user && (
           <div className="p-4 border-t border-border-subtle">
             <div className="flex items-center gap-3 px-3 py-2">
               <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                 {user.name.slice(0, 2).toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                 <p className="text-xs text-muted-foreground truncate">{user.email}</p>
               </div>
             </div>
             
             <button
                onClick={logout}
                disabled={isLoggingOut}
                className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
             >
                <SignOut size={20} />
                {isLoggingOut ? "Logging out..." : "Log out"}
             </button>
           </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
         {/* Desktop Top Bar (optional, if we want search or breadcrumbs, but for now empty or user menu if not in sidebar) */}
         {/* Content */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
         </div>
      </main>
    </div>
  );
}
