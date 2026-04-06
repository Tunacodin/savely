import { View, Pressable } from "react-native";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export function ColorPicker({
  colors,
  selectedColor,
  onSelectColor,
}: ColorPickerProps) {
  return (
    <View className="bg-zinc-50 rounded-2xl p-4">
      <View className="flex-row flex-wrap gap-3 justify-center">
        {colors.map((color) => (
          <Pressable
            key={color}
            onPress={() => onSelectColor(color)}
            className={`w-14 h-14 rounded-xl border-3 items-center justify-center ${
              selectedColor === color ? "border-primary-500" : "border-zinc-200"
            }`}
            style={{ backgroundColor: color }}
          >
            {selectedColor === color && (
              <MingCuteIcon name="check-line" size={24} color="#6366F1" />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
