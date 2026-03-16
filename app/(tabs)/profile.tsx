import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

function MenuItem({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between p-4 bg-zinc-50 rounded-2xl h-16"
    >
      <Text className="font-sans text-base text-zinc-800">{label}</Text>
      <MingCuteIcon name="right-line" size={24} color="#27272A" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="items-center pt-8 gap-6">
          <View className="w-24 h-24 rounded-full border-2 border-neutral-200 overflow-hidden">
            <Image
              source="https://i.pravatar.cc/256"
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <View className="items-center">
            <Text className="font-sans-semibold text-xl text-neutral-900">
              Osman Kağan Kurnaz
            </Text>
            <Text className="font-sans text-sm text-neutral-400 mt-1">
              example@gmail.com
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row px-4 gap-5 mt-8 mb-4">
          <View className="flex-1 bg-neutral-100 rounded-2xl py-4 items-center">
            <Text className="font-sans text-xs text-neutral-500 mb-1">
              Kayıt edilen içerik
            </Text>
            <Text className="font-sans-bold text-2xl text-neutral-900">
              437
            </Text>
          </View>
          <View className="flex-1 bg-neutral-100 rounded-2xl py-4 items-center">
            <Text className="font-sans text-xs text-neutral-500 mb-1">
              Koleksiyon
            </Text>
            <Text className="font-sans-bold text-2xl text-neutral-900">
              16
            </Text>
          </View>
        </View>

        {/* Premium Button */}
        <View className="px-4 mt-6">
          <Pressable className="flex-row items-center justify-between p-4 bg-zinc-800 rounded-2xl h-16">
            <Text className="font-sans text-base text-white">
              Premium'a Geç
            </Text>
            <MingCuteIcon name="sparkles-fill" size={24} color="#ffffff" />
          </Pressable>
        </View>

        {/* Menu Items */}
        <View className="px-4 mt-4 gap-3">
          <MenuItem
            label="Hesap Ayarları"
            onPress={() => router.push("/account-settings")}
          />
          <MenuItem label="Gizlilik Politikası" />
          <MenuItem label="Kullanım Koşulları" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
