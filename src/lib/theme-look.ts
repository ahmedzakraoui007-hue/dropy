import type { Theme } from "@/types/themes";

export function firstFont(value?: string) {
  return (value || "").replace(/['"]/g, "").split(",")[0].trim() || "Inter";
}

export function themeLook(theme: Theme, current: Record<string, any>) {
  const radius = parseFloat(theme.layout?.borderRadius || "8");
  const heading = firstFont(theme.typography?.headingFont);
  const body = firstFont(theme.typography?.bodyFont);
  return {
    ...current,
    theme_id: theme.id,
    colors: {
      ...(current.colors || {}),
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
      background: theme.colors.background,
      text: theme.colors.text,
    },
    typography: { ...(current.typography || {}), fontHeading: heading, fontBody: body },
    fonts: { heading, body },
    spacing: { ...(current.spacing || {}), borderRadius: radius <= 0 ? "none" : radius >= 999 ? "full" : "md" },
  };
}
