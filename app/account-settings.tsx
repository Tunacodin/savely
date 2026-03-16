import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-neutral-50 rounded-2xl px-5 py-4 mb-3">
      <Text className="font-sans text-xs text-neutral-400 mb-1">{label}</Text>
      <Text className="font-sans text-base text-neutral-900">{value}</Text>
    </View>
  );
}

export default function AccountSettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Top Bar */}
      <View className="flex-row items-center px-4 py-5 h-16 border-b-[1.5px] border-zinc-100 bg-white">
        <Pressable onPress={() => router.back()} className="mr-1.5">
          <MingCuteIcon name="left-line" size={24} color="#52525B" />
        </Pressable>
        <Text className="font-sans-medium text-xl text-zinc-800">
          Hesap Ayarları
        </Text>
      </View>

      {/* Info Fields */}
      <View className="px-4 pt-6">
        <InfoField label="Ad, Soyad" value="Osman Kağan Kurnaz" />
        <InfoField label="Eposta" value="osmankagankurnaz@gmail.com" />
        <InfoField label="Şifre" value="********" />
      </View>

      {/* Logout Button */}
      <View className="px-4 mt-6">
        <Pressable className="bg-red-50 rounded-2xl py-4 items-center">
          <Text className="font-sans-medium text-base text-red-500">
            Çıkış Yap
          </Text>
        </Pressable>
      </View>

      {/* Delete Account */}
      <View className="items-center mt-6">
        <Pressable>
          <Text className="font-sans text-sm text-neutral-400">Hesabı Sil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
