import { View, Text } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { SavedItem, Platform } from "@/constants/mock-data";

const platformIcons: Record<Platform, { name: string; color: string }> = {
  youtube: { name: "logo-youtube", color: "#FF0000" },
  instagram: { name: "logo-instagram", color: "#E4405F" },
  pinterest: { name: "logo-pinterest", color: "#BD081C" },
  tiktok: { name: "logo-tiktok", color: "#000000" },
};

interface Props {
  item: SavedItem;
  width: number;
}

export function SaveItemCard({ item, width }: Props) {
  const imageHeight = width * item.aspectRatio;
  const platform = platformIcons[item.platform];

  return (
    <View style={{ width }}>
      <View style={{ width, height: imageHeight, position: "relative" }}>
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width, height: imageHeight, borderRadius: 20 }}
          contentFit="cover"
        />
        {/* Platform Badge */}
        <View
          className="absolute bottom-2 left-2 w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
        >
          <Ionicons
            name={platform.name as any}
            size={14}
            color={platform.color}
          />
        </View>
      </View>
      <View className="mt-2 px-1.5">
        <Text
          className="font-sans-medium text-xs text-zinc-800"
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
    </View>
  );
}
