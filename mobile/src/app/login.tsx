import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Redirect } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { ACTIVE_STATUSES, isAllowedSeller, SELLER_ROLES, useSession } from "@/lib/session";
import { API_URL, supabase } from "@/lib/supabase";
import { colors, gradient } from "@/lib/theme";

export default function Login() {
  const { t, locale, setLocale } = useI18n();
  const { session, profile, ready } = useSession();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (ready && session && isAllowedSeller(profile)) return <Redirect href="/(tabs)" />;

  const submit = async () => {
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.user) {
      setLoading(false);
      setError(authError?.message?.toLowerCase().includes("network") ? t("common.offline") : t("login.invalid"));
      return;
    }
    const { data: p } = await supabase.from("profiles").select("role, status").eq("id", data.user.id).maybeSingle();
    if (!p || !SELLER_ROLES.includes(p.role) || !ACTIVE_STATUSES.includes(p.status)) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(p && SELLER_ROLES.includes(p.role) ? t("login.pending") : t("login.not_seller"));
      return;
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.hero }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["rgba(124,58,237,0.55)", "rgba(7,10,31,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0.6 }} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={s.top}>
          <View style={s.brand}>
            <LinearGradient colors={gradient} style={s.logo}>
              <Text style={s.logoText}>D</Text>
            </LinearGradient>
            <Text style={s.brandName}>Dropy</Text>
          </View>
          <Pressable onPress={() => setLocale(locale === "fr" ? "ar" : "fr")} style={s.lang} hitSlop={8}>
            <Text style={s.langText}>{locale === "fr" ? "العربية" : "Français"}</Text>
          </Pressable>
        </View>

        <Text style={s.title}>{t("login.title")}</Text>
        <Text style={s.subtitle}>{t("login.subtitle")}</Text>

        <View style={s.form}>
          <Text style={s.label}>{t("login.email")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={s.input}
            placeholderTextColor="rgba(255,255,255,0.35)"
            placeholder="vous@exemple.tn"
          />
          <Text style={s.label}>{t("login.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            style={s.input}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button label={loading ? t("login.loading") : t("login.submit")} onPress={submit} loading={loading} disabled={!email || !password} style={{ marginTop: 8 }} />
          <Pressable onPress={() => Linking.openURL(`${API_URL}/forgot-password`)} style={{ marginTop: 16, alignSelf: "center" }} hitSlop={8}>
            <Text style={s.link}>{t("login.forgot")}</Text>
          </Pressable>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>{t("login.no_account")}</Text>
          <Pressable onPress={() => Linking.openURL(`${API_URL}/inscription`)} hitSlop={8}>
            <Text style={[s.link, { color: "#5EEAD4" }]}>{t("login.signup")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 22 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 48 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  brandName: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  lang: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  langText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 40 },
  subtitle: { color: "rgba(255,255,255,0.65)", fontSize: 16, lineHeight: 23, marginTop: 10 },
  form: { marginTop: 36 },
  label: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: { height: 54, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", paddingHorizontal: 16, color: "#fff", fontSize: 16, marginBottom: 18 },
  error: { color: "#FDA4AF", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  link: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "700" },
  footer: { marginTop: "auto", paddingTop: 40, alignItems: "center", gap: 6 },
  footerText: { color: "rgba(255,255,255,0.55)", fontSize: 14 },
});
