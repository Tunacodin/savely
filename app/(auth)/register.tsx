import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

type FormData = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (_data: FormData) => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-4">
            {/* Back */}
            <Pressable onPress={() => router.back()} className="mb-8 self-start">
              <MingCuteIcon name="left-line" size={24} color="#171717" />
            </Pressable>

            <Text className="text-3xl font-sans-bold text-neutral-900 mb-2">
              Hesap Oluştur
            </Text>
            <Text className="text-sm font-sans text-neutral-400 leading-5 mb-8">
              Kütüphaneni oluşturmak için bir hesap aç.
            </Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-neutral-700 mb-1.5">
                Ad Soyad
              </Text>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: "Ad soyad gerekli",
                  minLength: {
                    value: 2,
                    message: "En az 2 karakter olmalı",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-2xl px-4 py-3.5 font-sans text-sm text-neutral-900 ${
                      errors.name ? "border-error" : "border-neutral-200"
                    }`}
                    placeholder="Adın Soyadın"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="words"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                )}
              />
              {errors.name && (
                <Text className="text-xs font-sans text-error mt-1.5">
                  {errors.name.message}
                </Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-neutral-700 mb-1.5">
                E-Posta
              </Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: "E-posta gerekli",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Geçerli bir e-posta girin",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-2xl px-4 py-3.5 font-sans text-sm text-neutral-900 ${
                      errors.email ? "border-error" : "border-neutral-200"
                    }`}
                    placeholder="ornek@email.com"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-xs font-sans text-error mt-1.5">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password */}
            <View className="mb-8">
              <Text className="text-sm font-sans-medium text-neutral-700 mb-1.5">
                Şifre
              </Text>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Şifre gerekli",
                  minLength: {
                    value: 6,
                    message: "Şifre en az 6 karakter olmalı",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-2xl px-4 py-3.5 font-sans text-sm text-neutral-900 ${
                      errors.password ? "border-error" : "border-neutral-200"
                    }`}
                    placeholder="••••••••"
                    placeholderTextColor="#A3A3A3"
                    secureTextEntry
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                )}
              />
              {errors.password && (
                <Text className="text-xs font-sans text-error mt-1.5">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              className="bg-neutral-900 rounded-2xl py-4 items-center mb-4"
            >
              <Text className="text-white font-sans-semibold text-base">
                Kayıt Ol
              </Text>
            </Pressable>

            {/* Login link */}
            <Pressable
              onPress={() => router.replace("/(auth)/login")}
              className="items-center"
            >
              <Text className="text-neutral-400 font-sans text-sm">
                Zaten hesabın var mı?{" "}
                <Text className="text-neutral-900 font-sans-semibold">
                  Giriş Yap
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
