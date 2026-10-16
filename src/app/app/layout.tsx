"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import {
  Shield,
  LayoutDashboard,
  ScanLine,
  History,
  Settings,
  Link as LinkIcon,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  Crown,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { href: "/app/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/app/scan", icon: ScanLine, labelKey: "nav.newScan" },
  { href: "/app/history", icon: History, labelKey: "nav.history" },
  { href: "/app/connect", icon: LinkIcon, labelKey: "nav.connect" },
  { href: "/app/settings", icon: Settings, labelKey: "nav.settings" },
];

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ email: user.email });
      } else {
        const guest = sessionStorage.getItem("listguard_guest");
        if (guest) {
          setIsGuest(true);
          setUser({ email: "Guest User" });
        }
      }
    };
    checkUser();
  }, [supabase.auth]);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("listguard_guest");
    router.push("/");
  };

  // Login page doesn't need the app shell
  if (pathname === "/app/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-lg font-bold gradient-text">List Guard</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {t(item.labelKey)}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-0.5 h-6 bg-primary rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade Banner */}
        {isGuest && (
          <div className="p-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Unlimited scans, all regions, AI fixes
              </p>
              <Link href="/app/settings">
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-xs">
                  {t("nav.upgrade")} — $15/mo
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.email?.charAt(0).toUpperCase() || "G"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.email || "Guest"}</p>
              <p className="text-xs text-muted-foreground">
                {isGuest ? "Free Plan" : "Pro Plan"}
              </p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-card border-r border-border flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <Shield className="w-7 h-7 text-primary" />
                  <span className="font-bold gradient-text">List Guard</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.back()}
              className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === "en" ? "es" : "en")}
              className="text-xs gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              {locale.toUpperCase()}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThemeToggle}
              className="p-2"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
      <Toaster position="top-center" theme="dark" />
    </I18nProvider>
  );
}
