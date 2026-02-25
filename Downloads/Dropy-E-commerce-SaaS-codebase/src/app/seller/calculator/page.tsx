"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Percent, 
  Package, 
  Truck, 
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  PiggyBank,
  Target,
  Sparkles,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SmartCalculatorPage() {
  const [supplierPrice, setSupplierPrice] = useState(30);
  const [sellingPrice, setSellingPrice] = useState(60);
  const [shippingCost, setShippingCost] = useState(7);
  const [marketingCost, setMarketingCost] = useState(5);
  const [packagingCost, setPackagingCost] = useState(2);
  const [platformFee, setPlatformFee] = useState(3);
  const [returnRate, setReturnRate] = useState(5);
  const [conversionRate, setConversionRate] = useState(3);
  const [monthlyOrders, setMonthlyOrders] = useState(100);
  const [includeDropyFee, setIncludeDropyFee] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculations = useMemo(() => {
    const dropyFee = includeDropyFee ? sellingPrice * 0.05 : 0;
    const totalCosts = supplierPrice + shippingCost + marketingCost + packagingCost + dropyFee;
    const grossProfit = sellingPrice - totalCosts;
    const profitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
    
    const returnLoss = (returnRate / 100) * (supplierPrice + shippingCost);
    const netProfit = grossProfit - returnLoss;
    const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    
    const monthlyRevenue = monthlyOrders * sellingPrice;
    const monthlyProfit = monthlyOrders * netProfit;
    const monthlyCosts = monthlyOrders * totalCosts;
    
    const roi = monthlyCosts > 0 ? (monthlyProfit / monthlyCosts) * 100 : 0;
    
    const breakEvenPrice = totalCosts + returnLoss;
    const recommendedPrice = breakEvenPrice * 1.4;
    
    const adSpendPerOrder = marketingCost;
    const cpa = conversionRate > 0 ? (adSpendPerOrder / conversionRate) * 100 : 0;
    
    const monthlyAdSpend = monthlyOrders * adSpendPerOrder;
    const roas = monthlyAdSpend > 0 ? monthlyRevenue / monthlyAdSpend : 0;

    return {
      totalCosts,
      grossProfit,
      profitMargin,
      netProfit,
      netMargin,
      returnLoss,
      monthlyRevenue,
      monthlyProfit,
      monthlyCosts,
      roi,
      breakEvenPrice,
      recommendedPrice,
      cpa,
      roas,
      dropyFee,
      monthlyAdSpend
    };
  }, [supplierPrice, sellingPrice, shippingCost, marketingCost, packagingCost, returnRate, conversionRate, monthlyOrders, includeDropyFee]);

  const getProfitColor = (profit: number) => {
    if (profit > 15) return "text-green-600";
    if (profit > 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getProfitBg = (profit: number) => {
    if (profit > 15) return "bg-green-50 border-green-200";
    if (profit > 5) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getHealthScore = () => {
    let score = 0;
    if (calculations.netMargin > 30) score += 30;
    else if (calculations.netMargin > 20) score += 20;
    else if (calculations.netMargin > 10) score += 10;
    
    if (calculations.roi > 100) score += 30;
    else if (calculations.roi > 50) score += 20;
    else if (calculations.roi > 20) score += 10;
    
    if (calculations.roas > 4) score += 20;
    else if (calculations.roas > 2) score += 15;
    else if (calculations.roas > 1) score += 5;
    
    if (returnRate < 3) score += 20;
    else if (returnRate < 7) score += 10;
    
    return score;
  };

  const healthScore = getHealthScore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            Smart Calculator
          </h1>
          <p className="text-muted-foreground">Calculez vos marges et optimisez vos prix de vente.</p>
        </div>
        <Badge className="text-lg px-4 py-2" variant={healthScore > 70 ? "default" : healthScore > 40 ? "secondary" : "destructive"}>
          Score santé: {healthScore}/100
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Paramètres du produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Prix fournisseur (TND)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Le prix d&apos;achat auprès du fournisseur</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={supplierPrice}
                      onChange={(e) => setSupplierPrice(Number(e.target.value))}
                      className="text-lg font-bold"
                    />
                    <Slider
                      value={[supplierPrice]}
                      onValueChange={([v]) => setSupplierPrice(v)}
                      max={200}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Prix de vente (TND)
                    <Badge variant="outline" className="text-xs">Votre marge</Badge>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="text-lg font-bold text-primary"
                    />
                    <Slider
                      value={[sellingPrice]}
                      onValueChange={([v]) => setSellingPrice(v)}
                      max={300}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Frais de livraison (TND)</Label>
                  <Input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Coût marketing par vente (TND)</Label>
                  <Input
                    type="number"
                    value={marketingCost}
                    onChange={(e) => setMarketingCost(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Switch checked={includeDropyFee} onCheckedChange={setIncludeDropyFee} />
                  <div>
                    <p className="font-medium">Frais Dropy (5%)</p>
                    <p className="text-xs text-muted-foreground">Commission plateforme</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{calculations.dropyFee.toFixed(2)} TND</span>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Options avancées</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid md:grid-cols-2 gap-4 pt-4 border-t"
                >
                  <div className="space-y-3">
                    <Label>Frais d&apos;emballage (TND)</Label>
                    <Input
                      type="number"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Taux de retour (%)</Label>
                    <Input
                      type="number"
                      value={returnRate}
                      onChange={(e) => setReturnRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Taux de conversion (%)</Label>
                    <Input
                      type="number"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Commandes estimées/mois</Label>
                    <Input
                      type="number"
                      value={monthlyOrders}
                      onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                    />
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className={`${getProfitBg(calculations.netMargin)} border-2`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Profit net par vente</span>
                  {calculations.netProfit > 0 ? (
                    <TrendingUp className={`w-5 h-5 ${getProfitColor(calculations.netMargin)}`} />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className={`text-4xl font-bold ${getProfitColor(calculations.netMargin)}`}>
                  {calculations.netProfit.toFixed(2)} TND
                </p>
                <p className={`text-sm ${getProfitColor(calculations.netMargin)}`}>
                  Marge: {calculations.netMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Coûts totaux</span>
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-4xl font-bold">{calculations.totalCosts.toFixed(2)} TND</p>
                <p className="text-sm text-muted-foreground">
                  Dont retours: {calculations.returnLoss.toFixed(2)} TND
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Projections mensuelles
              </CardTitle>
              <CardDescription>Basées sur {monthlyOrders} commandes/mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-sm text-blue-600 font-medium">Chiffre d&apos;affaires</p>
                  <p className="text-2xl font-bold text-blue-700">{calculations.monthlyRevenue.toLocaleString()} TND</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-sm text-green-600 font-medium">Profit net</p>
                  <p className="text-2xl font-bold text-green-700">{calculations.monthlyProfit.toLocaleString()} TND</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <p className="text-sm text-purple-600 font-medium">ROI</p>
                  <p className="text-2xl font-bold text-purple-700">{calculations.roi.toFixed(0)}%</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <p className="text-sm text-amber-600 font-medium">ROAS</p>
                  <p className="text-2xl font-bold text-amber-700">{calculations.roas.toFixed(1)}x</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Recommandations IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-primary/10">
                <p className="text-sm font-medium text-primary mb-1">Prix recommandé</p>
                <p className="text-3xl font-bold">{calculations.recommendedPrice.toFixed(0)} TND</p>
                <p className="text-xs text-muted-foreground">Pour une marge de 40%</p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-primary/10">
                <p className="text-sm font-medium text-primary mb-1">Seuil de rentabilité</p>
                <p className="text-3xl font-bold">{calculations.breakEvenPrice.toFixed(0)} TND</p>
                <p className="text-xs text-muted-foreground">Prix minimum pour ne pas perdre</p>
              </div>

              <div className="space-y-3 pt-4">
                {calculations.netMargin < 20 && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800">
                      Marge faible. Augmentez votre prix de vente ou négociez avec votre fournisseur.
                    </p>
                  </div>
                )}
                
                {calculations.roas < 2 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-xs text-red-800">
                      ROAS faible. Optimisez vos publicités ou réduisez vos coûts marketing.
                    </p>
                  </div>
                )}

                {calculations.netMargin > 30 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-xs text-green-800">
                      Excellente marge ! Vous pouvez investir davantage en marketing.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Répartition des coûts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Fournisseur", value: supplierPrice, color: "bg-blue-500" },
                { label: "Livraison", value: shippingCost, color: "bg-purple-500" },
                { label: "Marketing", value: marketingCost, color: "bg-pink-500" },
                { label: "Emballage", value: packagingCost, color: "bg-orange-500" },
                { label: "Frais Dropy", value: calculations.dropyFee, color: "bg-indigo-500" },
              ].map((item) => {
                const percentage = calculations.totalCosts > 0 
                  ? (item.value / calculations.totalCosts) * 100 
                  : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value.toFixed(2)} TND ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800">Profit annuel estimé</p>
                  <p className="text-sm text-green-600">Si tendance maintenue</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-700">
                {(calculations.monthlyProfit * 12).toLocaleString()} TND
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
