"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Camera, 
  DollarSign, 
  Users, 
  Star, 
  Edit,
  ExternalLink,
  CheckCircle2,
  Clock,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface CreatorStats {
  activeBriefs: number;
  totalEarnings: number;
  rating: number;
  reviewCount: number;
}

export default function CreatorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<CreatorStats>({
    activeBriefs: 0,
    totalEarnings: 0,
    rating: 0,
    reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (creatorProfile) {
        setProfile(creatorProfile);

        const { count: activeBriefs } = await supabase
          .from("content_applications")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", creatorProfile.id)
          .eq("status", "accepted");

        const { data: earnings } = await supabase
          .from("content_payments")
          .select("amount")
          .eq("creator_id", creatorProfile.id)
          .eq("status", "completed");

        const totalEarnings = earnings?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        setStats({
          activeBriefs: activeBriefs || 0,
          totalEarnings,
          rating: creatorProfile.rating || 0,
          reviewCount: creatorProfile.review_count || 0,
        });
        setLoading(false);
        } else {
          router.replace("/creator/signup");
        }

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

    const statCards = [
      { title: "Projets actifs", value: stats.activeBriefs.toString(), icon: Briefcase, color: "bg-primary" },
      { title: "Gains totaux", value: `${stats.totalEarnings} TND`, icon: DollarSign, color: "bg-primary" },
      { title: "Note moyenne", value: `${stats.rating}/5`, icon: Star, color: "bg-primary" },
      { title: "Avis clients", value: stats.reviewCount.toString(), icon: Users, color: "bg-primary" },
    ];

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black mb-1">Dashboard Créateur</h1>
            <p className="text-muted-foreground">Gérez vos projets et votre portfolio.</p>
          </div>
            <div className="flex gap-2">
              {profile && (
                <Link href={`/seller/creators/${profile.id}`}>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Profil public
                  </Button>
                </Link>
              )}
              <Link href="/creator/portfolio">
                <Button className="bg-primary text-primary-foreground hover:opacity-90 gap-2">
                  <Edit className="w-4 h-4" />
                  Modifier le portfolio
                </Button>
              </Link>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center shadow-lg shadow-primary/20`}>
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
              <CardTitle className="text-xl font-bold">Projets récents</CardTitle>
              <CardDescription>Vos collaborations en cours</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.activeBriefs === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-3xl border-border/50">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Aucun projet actif</p>
                  <Link href="/creator/opportunities">
                    <Button variant="link" className="mt-2 text-primary">Explorer les opportunités</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { title: "Shooting Mode TN", client: "ModaTN", status: "In Progress", date: "2 jours" },
                    { title: "Vidéo UGC Cosmétique", client: "BioTN", status: "Review", date: "5 jours" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.client}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {p.status}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1.5">Il y a {p.date}</p>
                      </div>
                    </div>
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
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-wide">Profil vérifié</p>
                  <p className="text-xs text-muted-foreground">Votre profil est visible par les clients.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Prochaines étapes</h4>
                <div className="space-y-3">
                  {[
                    { text: "Ajouter 5 photos à votre portfolio", done: true },
                    { text: "Lier votre compte bancaire (D17/RIB)", done: false },
                    { text: "Ajouter vos réseaux sociaux", done: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <span className={item.done ? "line-through text-muted-foreground" : "font-medium"}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full border-primary/20 hover:bg-primary/5" variant="outline">
                Contacter le support créateur
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
