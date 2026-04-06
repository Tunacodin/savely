import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { useThemeColors } from "@/hooks/use-theme";
import type { SavedItem } from "@/types";

interface Props {
  item: SavedItem;
  width: number;
  onPress?: () => void;
}

export function SaveItemCard({ item, width, onPress }: Props) {
  const c = useThemeColors();
  const hasImage = !!item.imageUrl;
  const aspectRatio =
    item.metadata?.width && item.metadata?.height
      ? item.metadata.height / item.metadata.width
      : (item.aspectRatio ?? 1);
  const imageHeight = hasImage ? width * aspectRatio : width * 0.55;

  const imageSource =
    typeof item.imageUrl === "number"
      ? item.imageUrl
      : { uri: item.imageUrl as string };

  return (
    <Pressable style={{ width }} onPress={onPress}>
      {/* Card container */}
      <View
        style={{
          width,
          height: imageHeight,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: c.surfaceAlt,
        }}
      >
        {hasImage && (
          <Image
            source={imageSource}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
        )}
        {/* Platform Badge - bottom left */}
        <View style={{ position: "absolute", bottom: 8, left: 8 }}>
          <PlatformBadge platform={item.platform} size="md" />
        </View>
      </View>

      {/* Title */}
      <View style={{ marginTop: 8, paddingHorizontal: 2 }}>
        <Text
          style={{
            fontFamily: "Rubik_500Medium",
            fontSize: 12,
            color: c.textPrimary,
            lineHeight: 16,
          }}
          numberOfLines={2}
        >
          {item.title.split("#")[0].trim()}
        </Text>
      </View>
    </Pressable>
  );
}
