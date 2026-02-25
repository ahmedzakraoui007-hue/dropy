"use client";

import { TrendingUp, Megaphone, Share2, Search, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  const tools = [
    {
      title: "SEO & Référencement",
      description: "Optimisez votre visibilité sur les moteurs de recherche.",
      icon: Search,
      status: "Bientôt disponible"
    },
    {
      title: "Publicités Facebook",
      description: "Lancez des campagnes publicitaires directement depuis Dropy.",
      icon: Megaphone,
      status: "Bientôt disponible"
    },
    {
      title: "Réseaux Sociaux",
      description: "Gérez vos publications Instagram et TikTok.",
      icon: Share2,
      status: "Bientôt disponible"
    },
    {
      title: "Email Marketing",
      description: "Envoyez des newsletters à vos clients.",
      icon: Target,
      status: "Bientôt disponible"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing & SEO</h1>
        <p className="text-muted-foreground">Outils pour attirer plus de clients et augmenter vos ventes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Card key={tool.title} className="opacity-75 grayscale-[0.5]">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <tool.icon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>{tool.title}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">{tool.status}</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-0 text-white">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Besoin d&apos;aide pour votre marketing ?</h2>
          <p className="mb-6 opacity-80">Nos experts peuvent vous accompagner dans la croissance de votre boutique.</p>
          <Button variant="secondary">Contacter un expert</Button>
        </CardContent>
      </Card>
    </div>
  );
}
