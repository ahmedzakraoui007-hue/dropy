export const colors = {
  hero: "#070A1F",
  heroSoft: "#141A3A",
  purple: "#7C3AED",
  purpleSoft: "#EDE7FE",
  teal: "#14B8A6",
  tealSoft: "#D5F5F0",
  ink: "#0B1020",
  text: "#1F2937",
  muted: "#6B7280",
  faint: "#9CA3AF",
  line: "#E5E7EB",
  bg: "#F4F5F8",
  card: "#FFFFFF",
  danger: "#E11D48",
  dangerSoft: "#FFE4EA",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  success: "#059669",
  successSoft: "#D1FAE5",
};

export const gradient = ["#7C3AED", "#14B8A6"] as const;

export const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
  new: { bg: colors.warningSoft, fg: colors.warning },
  confirmed: { bg: colors.purpleSoft, fg: colors.purple },
  preparing: { bg: "#E0E7FF", fg: "#4338CA" },
  shipped: { bg: "#DBEAFE", fg: "#1D4ED8" },
  delivered: { bg: colors.successSoft, fg: colors.success },
  cancelled: { bg: "#F3F4F6", fg: colors.muted },
};

export const radius = { sm: 10, md: 16, lg: 22 };
