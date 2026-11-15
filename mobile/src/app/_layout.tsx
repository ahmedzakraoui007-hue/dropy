import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui";
import { I18nProvider, useI18n } from "@/lib/i18n";
import "@/lib/push";
import { SessionProvider } from "@/lib/session";
import { colors } from "@/lib/theme";

function useNotificationRouting() {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const orderId = last?.notification.request.content.data?.orderId;
    if (typeof orderId === "string") router.push({ pathname: "/orders/[id]", params: { id: orderId } });
  }, [last]);
}

const useRouting = Platform.OS === "web" ? () => {} : useNotificationRouting;

function Shell() {
  const { rtl, t } = useI18n();
  useRouting();
  return (
    <View style={{ flex: 1, direction: rtl ? "rtl" : "ltr", backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.hero },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "800" },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[id]" options={{ title: t("tabs.orders") }} />
        <Stack.Screen name="products/[id]" options={{ title: t("product.title") }} />
        <Stack.Screen name="leads" options={{ title: t("leads.title") }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
