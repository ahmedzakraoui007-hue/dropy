"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  DollarSign,
  Users,
  Star,
  Edit,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Mission {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  created_at: string;
  store: { name: string | null } | null;
}

const MISSION_STATUS: Record<string, string> = {
  published: "Paiement en attente",
  assigned: "En cours",
  in_progress: "Retouches",
  delivered: "En validation",
  completed: "Terminée",
  cancelled: "Annulée",
};

function since(date: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? "aujourd'hui" : `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

export default function CreatorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [earned, setEarned] = useState(0);
  const [steps, setSteps] = useState<{ text: string; done: boolean; href: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: cp } = await supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!cp) {
        router.replace("/creator/signup");
        return;
      }

      const [{ data: briefs }, { data: payments }, { count: portfolioCount }, { data: profile }] = await Promise.all([
        supabase
          .from("content_briefs")
          .select("id, title, status, updated_at, created_at, store:stores(name)")
          .eq("selected_creator_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase.from("content_payments").select("creator_amount, status").eq("creator_id", user.id).eq("status", "released"),
        supabase.from("creator_portfolio").select("id", { count: "exact", head: true }).eq("creator_id", user.id),
        supabase.from("profiles").select("bank_rib, d17_number, flouci_number").eq("id", user.id).maybeSingle(),
      ]);

      setCreatorProfile(cp);
      setMissions((briefs as unknown as Mission[]) || []);
      setEarned((payments || []).reduce((sum, p) => sum + Number(p.creator_amount || 0), 0));
      setSteps([
        { text: "Ajouter au moins 3 réalisations à votre portfolio", done: (portfolioCount || 0) >= 3, href: "/creator/portfolio" },
        { text: "Renseigner vos coordonnées de versement (RIB, D17 ou Flouci)", done: Boolean(profile?.bank_rib || profile?.d17_number || profile?.flouci_number), href: "/creator/settings" },
        { text: "Ajouter vos réseaux sociaux", done: Boolean(cp.instagram_handle || cp.instagram_username || cp.tiktok_handle), href: "/creator/settings" },
      ]);
      setLoading(false);
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Chargement de votre profil créateur...</p>
        </div>
      </div>
    );
  }

  const active = missions.filter((m) => ["published", "assigned", "in_progress", "delivered"].includes(m.status));
  const verified = creatorProfile?.is_verified || creatorProfile?.status === "approved";

  const statCards = [
    { title: "Missions actives", value: active.length.toString(), icon: Briefcase },
    { title: "Gains validés", value: `${earned.toFixed(2)} TND`, icon: DollarSign },
    { title: "Note moyenne", value: creatorProfile?.rating ? `${Number(creatorProfile.rating).toFixed(1)}/5` : "—", icon: Star },
    { title: "Avis clients", value: String(creatorProfile?.total_reviews || 0), icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Tableau de bord créateur</h1>
          <p className="text-muted-foreground">Gérez vos missions et votre portfolio.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/creator/opportunities">
            <Button variant="outline" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Opportunités
            </Button>
          </Link>
          <Link href="/creator/portfolio">
            <Button className="bg-primary text-primary-foreground hover:opacity-90 gap-2">
              <Edit className="w-4 h-4" />
              Modifier le portfolio
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Missions récentes</CardTitle>
            <CardDescription>Vos collaborations avec les vendeurs</CardDescription>
          </CardHeader>
          <CardContent>
            {missions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-3xl border-border/50">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune mission pour le moment</p>
                <Link href="/creator/opportunities">
                  <Button variant="link" className="mt-2 text-primary">Explorer les opportunités</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {missions.slice(0, 5).map((m) => (
                  <Link
                    key={m.id}
                    href={`/creator/missions/${m.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.store?.name || "Boutique"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {MISSION_STATUS[m.status] || m.status}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{since(m.updated_at || m.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Statut du compte</CardTitle>
            <CardDescription>Vérification et paiements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-5 rounded-3xl border border-primary/20 bg-primary/5">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                {verified ? <CheckCircle2 className="w-6 h-6 text-primary-foreground" /> : <Clock className="w-6 h-6 text-primary-foreground" />}
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wide">{verified ? "Profil validé" : "Profil en cours de validation"}</p>
                <p className="text-xs text-muted-foreground">
                  {verified ? "Votre profil est visible par les vendeurs." : "L'équipe Dropy examine votre profil."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Prochaines étapes</h4>
              <div className="space-y-3">
                {steps.map((item, i) => (
                  <Link key={i} href={item.href} className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <span className={item.done ? "line-through text-muted-foreground" : "font-medium hover:text-primary"}>{item.text}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Button asChild className="w-full border-primary/20 hover:bg-primary/5" variant="outline">
              <a href="mailto:ahmed@dropy.store">Contacter le support créateur</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
