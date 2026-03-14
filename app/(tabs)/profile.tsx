import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-sans-semibold text-xl text-neutral-900">
          Profile
        </Text>
      </View>
    </SafeAreaView>
  );
}
