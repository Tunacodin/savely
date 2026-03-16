import { View, Text } from "react-native";
import { Image } from "expo-image";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";
import type { SavedItem } from "@/types";

interface Props {
  item: SavedItem;
  width: number;
}

export function SaveItemCard({ item, width }: Props) {
  const hasImage = !!item.imageUrl;
  const aspectRatio =
    item.metadata?.width && item.metadata?.height
      ? item.metadata.height / item.metadata.width
      : item.aspectRatio;
  const imageHeight = hasImage ? width * aspectRatio : width * 0.55;

  return (
    <View style={{ width }}>
      <View style={{ width, height: imageHeight, position: "relative" }}>
        {hasImage ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width, height: imageHeight, borderRadius: 20 }}
            contentFit="cover"
          />
        ) : (
          <View
            className="bg-zinc-100 justify-end p-4"
            style={{ width, height: imageHeight, borderRadius: 20 }}
          >
            <Text
              className="font-sans text-[11px] text-zinc-400"
              numberOfLines={3}
            >
              {item.title}
            </Text>
          </View>
        )}
        {/* Platform Badge */}
        <View className="absolute bottom-2 left-2">
          <PlatformBadge platform={item.platform} />
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
