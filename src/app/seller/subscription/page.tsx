"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  ArrowLeft,
  Loader2,
  Crown,
  Zap,
  Shield,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const PLANS = {
  starter: {
    name: "Starter",
    price: "0",
    period: "TND/mois",
    description: "Parfait pour débuter",
    features: [
      "1 boutique",
      "50 produits max",
      "Templates basiques",
      "Support email",
    ],
    icon: Zap,
    color: "from-slate-500 to-slate-600",
  },
  pro: {
    name: "Pro",
    price: "49",
    period: "TND/mois",
    description: "Pour les vendeurs sérieux",
    features: [
      "Boutiques illimitées",
      "Produits illimités",
      "Tous les templates",
      "Domaine personnalisé",
      "Analytics avancés",
      "Support prioritaire",
    ],
    icon: Crown,
    color: "from-violet-500 to-purple-600",
    popular: true,
  },
  enterprise: {
    name: "Enterprise",
    price: "149",
    period: "TND/mois",
    description: "Pour les grandes entreprises",
    features: [
      "Tout de Pro",
      "API personnalisée",
      "Account manager dédié",
      "Formations privées",
      "SLA garanti",
    ],
    icon: Shield,
    color: "from-amber-500 to-orange-600",
  },
};

type PlanType = keyof typeof PLANS;

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<string>("starter");
  const [loading, setLoading] = useState<PlanType | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<{
    status: string;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null>(null);

  useEffect(() => {
    fetchSubscription();

    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success === "true") {
      setSuccessMessage("Votre abonnement a été activé avec succès !");
      router.replace("/seller/subscription");
    } else if (canceled === "true") {
      router.replace("/seller/subscription");
    }
  }, [router, searchParams]);

  async function fetchSubscription() {
    try {
      const response = await fetch("/api/stripe/manage-subscription");
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.plan);
        setSubscriptionData({
          status: data.status,
          periodEnd: data.periodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  }

  async function handleSelectPlan(plan: PlanType) {
    if (plan === "starter" || plan === currentPlan) return;

    setLoading(plan);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.parent.postMessage(
          { type: "OPEN_EXTERNAL_URL", data: { url: data.url } },
          "*"
        );
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(null);
    }
  }

  async function handleManageSubscription(action: "cancel" | "reactivate") {
    try {
      const response = await fetch("/api/stripe/manage-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchSubscription();
        setSuccessMessage(
          action === "cancel"
            ? "Votre abonnement sera annulé à la fin de la période"
            : "Votre abonnement a été réactivé"
        );
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
    }
  }

  async function handleOpenPortal() {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open portal");
      }

      if (data.url) {
        window.parent.postMessage(
          { type: "OPEN_EXTERNAL_URL", data: { url: data.url } },
          "*"
        );
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/seller">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Abonnement</h1>
          <p className="text-muted-foreground">
            Gérez votre abonnement et accédez à plus de fonctionnalités
          </p>
        </div>
      </div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            {successMessage}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setSuccessMessage(null)}
          >
            Fermer
          </Button>
        </motion.div>
      )}

      {currentPlan !== "starter" && subscriptionData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Votre abonnement actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-lg font-semibold">
                  Plan {PLANS[currentPlan as PlanType]?.name || currentPlan}
                </p>
<p className="text-sm text-muted-foreground">
  {subscriptionData.cancelAtPeriodEnd
    ? "Sera annulé le "
    : "Prochain renouvellement le "}
  {subscriptionData.periodEnd
    ? formatDate(subscriptionData.periodEnd)
    : "N/A"}
</p>

              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Gérer la facturation
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
                {subscriptionData.cancelAtPeriodEnd ? (
                  <Button
                    variant="outline"
                    onClick={() => handleManageSubscription("reactivate")}
                  >
                    Réactiver
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleManageSubscription("cancel")}
                  >
                    Annuler l&apos;abonnement
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {(Object.entries(PLANS) as [PlanType, (typeof PLANS)[PlanType]][]).map(
          ([key, plan]) => {
            const PlanIcon = plan.icon;
            const isCurrentPlan = key === currentPlan;
            const isPopular = "popular" in plan && plan.popular;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium rounded-full z-10">
                    Le plus populaire
                  </div>
                )}
                <Card
                  className={`h-full ${
                    isPopular
                      ? "border-violet-500 shadow-lg"
                      : "border-border/50"
                  } ${isCurrentPlan ? "ring-2 ring-emerald-500" : ""}`}
                >
                  <CardContent className="p-6">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                    >
                      <PlanIcon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <Button disabled className="w-full">
                        Plan actuel
                      </Button>
                    ) : key === "starter" ? (
                      <Button variant="outline" disabled className="w-full">
                        Plan gratuit
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSelectPlan(key)}
                        disabled={loading === key}
                        className={`w-full ${
                          isPopular
                            ? "bg-gradient-to-r from-violet-500 to-purple-600"
                            : ""
                        }`}
                      >
                        {loading === key ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          <>
                            Passer à {plan.name}
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          }
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
