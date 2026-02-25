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
  Sparkles,
  Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
  { name: "Briefs disponibles", href: "/creator/opportunities", icon: Briefcase },
  { name: "Mes missions", href: "/creator/missions", icon: FileText },
  { name: "Portfolio", href: "/creator/portfolio", icon: FolderOpen },
  { name: "Avis", href: "/creator/reviews", icon: Star },
  { name: "Paiements", href: "/creator/payments", icon: CreditCard },
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
          <h1 className="text-2xl font-bold mb-3">Compte en attente d'approbation</h1>
          <p className="text-muted-foreground mb-6">
            Votre profil créateur est en cours de vérification par notre équipe. 
            Vous recevrez une notification dès qu'il sera approuvé.
          </p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left mb-6">
            <p className="text-sm text-amber-800">
              <strong>Délai moyen:</strong> 24-48 heures<br/>
              <strong>Statut:</strong> En révision
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
            <Link href="/">
              <Button>Retour à l'accueil</Button>
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
          <h1 className="text-2xl font-bold mb-3">Compte suspendu</h1>
          <p className="text-muted-foreground mb-6">
            Votre compte créateur a été suspendu. Veuillez contacter le support pour plus d'informations.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
            <Link href="/help">
              <Button>Contacter le support</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-background" data-role="creator">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                <Link href="/creator" className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">DROPY</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

          <div className="p-4 border-t border-border">
            <Link href="/creator/settings">
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
                Paramètres
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
                      <p className="text-sm font-medium">{profile?.full_name || "Créateur"}</p>
                      <p className="text-xs text-muted-foreground">Créateur</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/creator/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
