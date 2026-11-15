import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { createContext, useCallback, useContext, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { colors, gradient, radius, STATUS_TONES } from "@/lib/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function Hero({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
      <LinearGradient colors={["rgba(124,58,237,0.45)", "rgba(20,184,166,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGlow} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
          <Text style={styles.heroTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.row, { marginTop: 22, marginBottom: 10 }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  const fg = variant === "primary" ? "#fff" : variant === "danger" ? colors.danger : variant === "ghost" ? colors.muted : colors.ink;
  const content = (
    <View style={styles.buttonInner}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
        variant === "danger" && { backgroundColor: colors.dangerSoft },
        variant === "ghost" && { backgroundColor: "transparent" },
        { opacity: inactive ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {content}
    </Pressable>
  );
}

export function Chip({ label, active, count, onPress }: { label: string; active: boolean; count?: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && { color: "#fff" }]}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.chipCount, active && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={[styles.chipCountText, active && { color: "#fff" }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
      {children}
    </ScrollView>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const tone = STATUS_TONES[status] || STATUS_TONES.cancelled;
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.pillText, { color: tone.fg }]}>{t(`orders.status.${status}`)}</Text>
    </View>
  );
}

export function SearchBox(props: TextInputProps) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.faint} />
      <TextInput placeholderTextColor={colors.faint} style={styles.searchInput} autoCorrect={false} returnKeyType="search" {...props} />
    </View>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.faint} style={[styles.input, props.editable === false && { backgroundColor: colors.bg, color: colors.muted }]} {...props} />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon, title, hint, action, onAction }: { icon: IconName; title: string; hint?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.purple} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
      {action && onAction ? <Button label={action} onPress={onAction} variant="secondary" style={{ marginTop: 16, alignSelf: "center", paddingHorizontal: 20 }} /> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.purple} size="large" />
    </View>
  );
}

type ToastCtx = (message: string, tone?: "success" | "error") => void;
const ToastContext = createContext<ToastCtx>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback<ToastCtx>(
    (message, tone = "success") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, 2600);
    },
    [opacity]
  );
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="none" style={[styles.toast, { bottom: insets.bottom + 90, opacity }, toast.tone === "error" && { backgroundColor: colors.danger }]}>
          <Ionicons name={toast.tone === "error" ? "alert-circle" : "checkmark-circle"} size={18} color="#fff" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  hero: { backgroundColor: colors.hero, paddingHorizontal: 16, paddingBottom: 18, overflow: "hidden" },
  heroGlow: { position: "absolute", top: -80, left: -60, width: 320, height: 260, borderRadius: 200 },
  heroSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600", marginBottom: 2 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.ink },
  sectionAction: { fontSize: 14, fontWeight: "700", color: colors.purple },
  button: { height: 52, borderRadius: 14, overflow: "hidden", justifyContent: "center", backgroundColor: colors.purple },
  buttonInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 },
  buttonLabel: { fontSize: 16, fontWeight: "800" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  chipCount: { minWidth: 22, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  chipCountText: { fontSize: 12, fontWeight: "800", color: colors.muted },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  pillText: { fontSize: 12, fontWeight: "800" },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingHorizontal: 14, height: 46, marginTop: 14 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  fieldLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 6 },
  fieldHint: { fontSize: 12, color: colors.muted, marginTop: 6 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: "#fff", paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.purpleSoft, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.ink, textAlign: "center" },
  emptyHint: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  toast: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 },
});
