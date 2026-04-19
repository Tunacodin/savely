import { useColorScheme } from "react-native";
import { useThemeStore } from "@/store/theme";
import { colors } from "@/constants/colors";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  card: string;

  text: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;

  border: string;
  divider: string;
  icon: string;
  iconMuted: string;

  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;

  error: string;
  errorBg: string;
  success: string;
  warning: string;

  sheetBg: string;
  handleIndicator: string;
  overlay: string;

  tabBarBg: string;
  tabIconActive: string;
  tabIconInactive: string;
  fabBg: string;
  fabRing: string;
  fabIcon: string;

  badgeBg: string;

  statusBar: "dark" | "light";

  skeleton: string;
}

const lightColors: ThemeColors = {
  background: "#ffffff",
  surface: colors.neutral[50],
  surfaceAlt: "#f4f4f5",
  card: colors.neutral[50],

  text: "#18181b",
  textPrimary: "#27272a",
  textSecondary: "#71717a",
  textTertiary: "#a1a1aa",
  textMuted: "#52525b",

  border: "#e4e4e7",
  divider: "#f4f4f5",
  icon: "#27272a",
  iconMuted: "#a1a1aa",

  buttonPrimary: "#27272a",
  buttonPrimaryText: "#fafafa",
  buttonSecondary: "#f4f4f5",
  buttonSecondaryText: "#52525b",

  error: colors.error.DEFAULT,
  errorBg: "#fef2f2",
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,

  sheetBg: "#ffffff",
  handleIndicator: "#d4d4d4",
  overlay: "rgba(0, 0, 0, 0.3)",

  tabBarBg: "#ffffff",
  tabIconActive: "#18181B",
  tabIconInactive: "#a1a1aa",
  fabBg: "#18181b",
  fabRing: "#ffffff",
  fabIcon: "#ffffff",

  badgeBg: "rgba(255,255,255,0.92)",

  statusBar: "dark",

  skeleton: "#e4e4e7",
};

const darkColors: ThemeColors = {
  background: colors.neutral[950],
  surface: colors.neutral[900],
  surfaceAlt: colors.neutral[800],
  card: colors.neutral[900],

  text: colors.neutral[50],
  textPrimary: colors.neutral[50],
  textSecondary: colors.neutral[400],
  textTertiary: colors.neutral[500],
  textMuted: colors.neutral[300],

  border: colors.neutral[700],
  divider: colors.neutral[800],
  icon: colors.neutral[50],
  iconMuted: colors.neutral[500],

  buttonPrimary: colors.neutral[50],
  buttonPrimaryText: colors.neutral[950],
  buttonSecondary: colors.neutral[800],
  buttonSecondaryText: colors.neutral[300],

  error: colors.error.DEFAULT,
  errorBg: "#2a1215",
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,

  sheetBg: colors.neutral[900],
  handleIndicator: colors.neutral[600],
  overlay: "rgba(0, 0, 0, 0.6)",

  tabBarBg: "#ffffff",
  tabIconActive: colors.neutral[950],
  tabIconInactive: colors.neutral[400],
  fabBg: colors.neutral[950],
  fabRing: "#ffffff",
  fabIcon: "#ffffff",

  badgeBg: "rgba(23,23,23,0.92)",

  statusBar: "light",

  skeleton: colors.neutral[700],
};

export function useThemeColors(): ThemeColors {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  if (mode === "dark") return darkColors;
  if (mode === "light") return lightColors;
  return systemScheme === "dark" ? darkColors : lightColors;
}
