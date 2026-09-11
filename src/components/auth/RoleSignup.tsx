"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  User, 
  Phone, 
  Globe, 
  Instagram, 
  Store,
  Building2,
  FileText,
  Camera,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LandingHeader from "@/components/landing/LandingHeader";
import { useTranslation } from "@/context/LanguageContext";

interface RoleSignupProps {
  role: "creator" | "seller" | "supplier";
  title: string;
  subtitle: string;
  accentColor: string;
}

export default function RoleSignup({ role, title, subtitle, accentColor }: RoleSignupProps) {
  const { t, dir } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const Icon = role === "creator" ? Camera : role === "seller" ? Store : Building2;
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Role specific fields
  const [portfolio, setPortfolio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [storeName, setStoreName] = useState("");
  const [sector, setSector] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [productType, setProductType] = useState("");

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsExistingUser(true);
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
        setPhone(user.user_metadata?.phone || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
        }
      }
    }
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    let userId: string | undefined;

    if (isExistingUser) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;

      if (userId) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          email,
          full_name: fullName,
          phone,
          role,
          status: "pending",
        });

        if (profileError) console.error("Profile creation error:", profileError);

        if (role === "creator") {
          await supabase.from("creator_profiles").upsert({
            user_id: userId,
            portfolio_url: portfolio,
            instagram_username: instagram,
            instagram_handle: instagram.replace("@", ""),
            specialty,
            specialties: [specialty],
            status: "pending"
          });
        } else if (role === "supplier") {
          await supabase.from("supplier_profiles").upsert({
            user_id: userId,
            company_name: companyName,
            tax_id: taxId,
            product_type: productType,
            status: "pending"
          });
        } else if (role === "seller") {
          const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
          await supabase.from("stores").insert({
            seller_id: userId,
            name: storeName,
            slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
            is_active: true
          });
        }
      }
    } else {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          role,
          additionalData: {
            portfolio,
            instagram,
            specialty,
            storeName,
            companyName,
            taxId,
            productType,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t("forgot_password.error_generic"));
        setLoading(false);
        return;
      }
      userId = result.user?.id;
    }

    if (userId) {
      toast.success(t("register.toasts.success_title"), {
        description: isExistingUser ? t("role_signup.submit_finish") : t("register.toasts.success_desc").replace("{email}", email),
      });
      
      router.push("/login");
    }
    setLoading(false);
  }

  const roleName = t(`role_signup.${role}`);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <LandingHeader />
      
      <div className="flex flex-col items-center justify-center p-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold gradient-text uppercase tracking-tight">DROPY</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          <Card className="border-border/50 shadow-xl overflow-hidden glass">
            <div className={`h-2 bg-gradient-to-r ${accentColor}`} />
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("role_signup.full_name")}</Label>
                    <div className="relative">
                      <User className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`} 
                        placeholder="Ex: Ahmed Ben Ali" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("role_signup.phone")}</Label>
                    <div className="relative">
                      <Phone className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                      <Input 
                        id="phone" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`} 
                        placeholder="+216 XX XXX XXX" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("role_signup.email")}</Label>
                  <div className="relative">
                    <Mail className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onInvalid={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.setCustomValidity(t("register.errors.invalid_email"));
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.setCustomValidity("");
                      }}
                      className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`}
                      placeholder="vous@exemple.com"
                      required
                      disabled={isExistingUser}
                    />
                  </div>
                </div>

                {!isExistingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("role_signup.password")}</Label>
                    <div className="relative">
                      <Lock className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className={`${dir === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10'} h-11`} 
                        placeholder="••••••••" 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {t("role_signup.info_title").replace("{role}", roleName)}
                  </h3>
                  
                  {role === "creator" && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="instagram">{t("role_signup.instagram")}</Label>
                          <div className="relative">
                            <Instagram className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                            <Input 
                              id="instagram" 
                              value={instagram} 
                              onChange={(e) => setInstagram(e.target.value)} 
                              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`} 
                              placeholder="@votrecompte" 
                              required 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialty">{t("role_signup.specialty")}</Label>
                          <Select onValueChange={setSpecialty} required>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={t("role_signup.select_placeholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">{t("role_signup.specialties.video")}</SelectItem>
                              <SelectItem value="photo">{t("role_signup.specialties.photo")}</SelectItem>
                              <SelectItem value="lifestyle">{t("role_signup.specialties.lifestyle")}</SelectItem>
                              <SelectItem value="unboxing">{t("role_signup.specialties.unboxing")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio">{t("role_signup.portfolio")}</Label>
                        <div className="relative">
                          <Globe className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                          <Input 
                            id="portfolio" 
                            value={portfolio} 
                            onChange={(e) => setPortfolio(e.target.value)} 
                            className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`} 
                            placeholder="https://..." 
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {role === "seller" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeName">{t("role_signup.store_name")}</Label>
                        <div className="relative">
                          <Store className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                          <Input 
                            id="storeName" 
                            value={storeName} 
                            onChange={(e) => setStoreName(e.target.value)} 
                            className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`} 
                            placeholder="Ex: Ma Boutique TN" 
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sector">{t("role_signup.sector")}</Label>
                        <Select onValueChange={setSector} required>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={t("role_signup.select_placeholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fashion">{t("role_signup.sectors.fashion")}</SelectItem>
                            <SelectItem value="beauty">{t("role_signup.sectors.beauty")}</SelectItem>
                            <SelectItem value="home">{t("role_signup.sectors.home")}</SelectItem>
                            <SelectItem value="tech">{t("role_signup.sectors.tech")}</SelectItem>
                            <SelectItem value="other">{t("role_signup.sectors.other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {role === "supplier" && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
                        {t("role_signup.supplier_notice")}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">{t("role_signup.company_name")}</Label>
                        <div className="relative">
                          <Building2 className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                          <Input 
                            id="companyName" 
                            value={companyName} 
                            onChange={(e) => setCompanyName(e.target.value)} 
                            className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`} 
                            placeholder="Nom officiel" 
                            required 
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="taxId">{t("role_signup.tax_id")}</Label>
                          <div className="relative">
                            <FileText className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                            <Input 
                              id="taxId" 
                              value={taxId} 
                              onChange={(e) => setTaxId(e.target.value)} 
                              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11`} 
                              placeholder="N° RC" 
                              required 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="productType">{t("role_signup.product_type")}</Label>
                          <Select onValueChange={setProductType} required>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={t("role_signup.select_placeholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tshirts-polos">{t("role_signup.categories.tshirts")}</SelectItem>
                              <SelectItem value="chemises-blouses">{t("role_signup.categories.shirts")}</SelectItem>
                              <SelectItem value="pantalons-jeans">{t("role_signup.categories.pants")}</SelectItem>
                              <SelectItem value="robes-jupes">{t("role_signup.categories.dresses")}</SelectItem>
                              <SelectItem value="vestes-manteaux">{t("role_signup.categories.jackets")}</SelectItem>
                              <SelectItem value="sous-vetements">{t("role_signup.categories.underwear")}</SelectItem>
                              <SelectItem value="chaussures">{t("role_signup.categories.shoes")}</SelectItem>
                              <SelectItem value="accessoires-mode">{t("role_signup.categories.accessories")}</SelectItem>
                              <SelectItem value="sportswear">{t("role_signup.categories.sportswear")}</SelectItem>
                              <SelectItem value="multi-categories">{t("role_signup.categories.multi")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className={`w-full h-12 bg-gradient-to-r ${accentColor} hover:opacity-90 transition-opacity text-white font-bold text-lg shadow-lg`} 
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isExistingUser ? t("role_signup.submit_finish") : t("role_signup.submit_create")}
                      <ArrowRight className={`ms-2 w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-muted-foreground">
            {isExistingUser ? (
              <Link href="/login" className="text-foreground font-semibold hover:underline">
                {t("role_signup.back_to_dashboard")}
              </Link>
            ) : (
              <>
                {t("role_signup.has_account")}{" "}
                <Link href="/login" className="text-foreground font-semibold hover:underline">
                  {t("role_signup.login_link")}
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
