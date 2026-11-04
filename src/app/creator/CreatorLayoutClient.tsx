"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationCenter from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FolderOpen,
  Star,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Clock,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const navigation = [
  { key: "dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
  { key: "opportunities", href: "/creator/opportunities", icon: Briefcase },
  { key: "missions", href: "/creator/missions", icon: FileText },
  { key: "portfolio", href: "/creator/portfolio", icon: FolderOpen },
  { key: "messages", href: "/creator/messages", icon: MessageSquare },
  { key: "reviews", href: "/creator/reviews", icon: Star },
  { key: "payments", href: "/creator/payments", icon: CreditCard },
];

const bottomTabs = [
  { key: "home", href: "/creator/dashboard", icon: LayoutDashboard },
  { key: "opportunities_short", href: "/creator/opportunities", icon: Briefcase },
  { key: "missions_short", href: "/creator/missions", icon: FileText },
  { key: "portfolio", href: "/creator/portfolio", icon: FolderOpen },
];

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

interface CreatorProfile {
  id: string;
  status: string;
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const n = (key: string) => t(`creator_app.nav.${key}`);
  const l = (key: string) => t(`creator_app.layout.${key}`);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) setProfile(data);

        const { data: creator } = await supabase
          .from("creator_profiles")
          .select("id, status")
          .eq("user_id", user.id)
          .single();

        if (creator) setCreatorProfile(creator);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (pathname === "/creator" || pathname.includes("/signup")) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (creatorProfile && creatorProfile.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{l("pending_title")}</h1>
          <p className="text-muted-foreground mb-6">{l("pending_desc")}</p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left mb-6">
            <p className="text-sm text-amber-800">
              <strong>{l("pending_delay_label")}</strong> {l("pending_delay")}<br/>
              <strong>{l("pending_status_label")}</strong> {l("pending_status")}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 me-2" />
              {l("logout")}
            </Button>
            <Link href="/">
              <Button>{l("back_home")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (creatorProfile && creatorProfile.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{l("suspended_title")}</h1>
          <p className="text-muted-foreground mb-6">{l("suspended_desc")}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 me-2" />
              {l("logout")}
            </Button>
            <Link href="/aide">
              <Button>{l("contact_support")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-background" data-role="creator">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
                <Link href="/creator/dashboard" className="flex items-center gap-2.5">
                  <img src="/favicon.svg" alt="" className="w-8 h-8 rounded-lg" />
                  <span className="text-xl font-bold tracking-tight text-white">DROPY</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-violet-600 to-[#00A99D] text-white shadow-lg shadow-black/20"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/60"}`} />
                          {n(item.key)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

          <div className="p-3 border-t border-white/10 space-y-1">
            <Link href="/aide" onClick={() => setSidebarOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/10">
                <HelpCircle className="w-5 h-5" />
                {n("help")}
              </Button>
            </Link>
            <Link href="/creator/settings" onClick={() => setSidebarOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/10">
                <Settings className="w-5 h-5" />
                {n("settings")}
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <NotificationCenter />


              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-violet-600 text-white text-sm">
                          {profile?.full_name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{profile?.full_name}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/creator/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 me-2" />
                      {n("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 me-2" />
                    {l("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {bottomTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link key={tab.href} href={tab.href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold ${isActive ? "text-primary" : "text-gray-500"}`}>
              <tab.icon className="w-5 h-5" />
              <span className="max-w-full truncate px-1">{n(tab.key)}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setSidebarOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-gray-500">
          <Menu className="w-5 h-5" />
          <span>{n("more")}</span>
        </button>
      </nav>
    </div>
  );
}
