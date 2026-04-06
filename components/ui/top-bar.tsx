import { View, Text, Pressable } from "react-native";
import { MingCuteIcon, type MingCuteIconName } from "@/components/ui/mingcute-icon";
import { useThemeColors } from "@/hooks/use-theme";

interface Props {
  title: string;
  onBack?: () => void;
  rightIcon?: MingCuteIconName;
  onRightPress?: () => void;
}

export function TopBar({ title, onBack, rightIcon, onRightPress }: Props) {
  const c = useThemeColors();

  return (
    <View
      style={{
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        backgroundColor: c.background,
      }}
    >
      {/* Left: back button or spacer */}
      <View style={{ width: 40, alignItems: "flex-start" }}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={8}>
            <MingCuteIcon name="left-line" size={24} color={c.textPrimary} />
          </Pressable>
        )}
      </View>

      {/* Center: title */}
      <View style={{ flex: 1, alignItems: onBack ? "center" : "flex-start" }}>
        <Text
          style={{
            fontFamily: "Rubik_500Medium",
            fontSize: 20,
            color: c.textPrimary,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Right: action icon or spacer */}
      <View style={{ width: 40, alignItems: "flex-end" }}>
        {rightIcon && onRightPress && (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <MingCuteIcon name={rightIcon} size={24} color={c.textPrimary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
