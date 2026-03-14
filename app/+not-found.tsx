import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-sans-bold text-xl text-neutral-900">
          This screen doesn't exist.
        </Text>
        <Link href="/" className="mt-4">
          <Text className="font-sans-medium text-base text-primary-600">
            Go to home screen
          </Text>
        </Link>
      </View>
    </>
  );
}
