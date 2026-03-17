import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-16">
        <Text className="text-3xl font-sans-bold text-neutral-900 text-center mb-3">
          Hemen Başlayalım
        </Text>
        <Text className="text-sm font-sans text-neutral-400 text-center leading-5 px-4 mb-10">
          Kaydettiğiniz her şeyi düzenlemek için bir profil oluşturun veya
          giriş yapın. Kişisel arşiviniz sizi bekliyor, kontrolü ele alın.
        </Text>

        {/* Google */}
        <Pressable className="bg-neutral-900 rounded-2xl py-4 items-center mb-3">
          <Text className="text-white font-sans-semibold text-base">
            Google ile Devam Et
          </Text>
        </Pressable>

        {/* Apple */}
        <Pressable className="bg-neutral-900 rounded-2xl py-4 items-center mb-6">
          <Text className="text-white font-sans-semibold text-base">
            Apple ile Devam Et
          </Text>
        </Pressable>

        {/* Email */}
        <Pressable className="items-center">
          <Text className="text-neutral-400 font-sans text-sm">
            E-Posta ile Devam Et
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
