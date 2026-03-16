import { View } from "react-native";

export type PlatformName =
  | "youtube"
  | "instagram"
  | "pinterest"
  | "medium"
  | "link"
  | "airbnb"
  | "behance"
  | "facebook"
  | "spotify"
  | "reddit"
  | "tiktok"
  | "x";

type BadgeSize = "sm" | "md";

const PLATFORM_COLORS: Record<PlatformName, string> = {
  youtube: "#DC2626",
  pinterest: "#DC2626",
  reddit: "#DC2626",
  instagram: "#E11D48",
  airbnb: "#E11D48",
  facebook: "#2563EB",
  behance: "#2563EB",
  spotify: "#16A34A",
  medium: "#000000",
  tiktok: "#000000",
  x: "#000000",
  link: "#000000",
};

const SIZE_CONFIG = {
  sm: { container: 16, dot: 8 },
  md: { container: 24, dot: 12 },
} as const;

interface Props {
  platform: PlatformName;
  size?: BadgeSize;
}

export function PlatformBadge({ platform, size = "sm" }: Props) {
  const config = SIZE_CONFIG[size];
  const color = PLATFORM_COLORS[platform];

  return (
    <View
      className="rounded-full items-center justify-center bg-white/85"
      style={{ width: config.container, height: config.container }}
    >
      <View
        className="rounded-full"
        style={{
          width: config.dot,
          height: config.dot,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
