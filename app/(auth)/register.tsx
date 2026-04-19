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
import { useTranslation } from "react-i18next";
import { MingCuteIcon } from "@/components/ui/mingcute-icon";

type FormData = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
              {t("auth.registerTitle")}
            </Text>
            <Text className="text-sm font-sans text-neutral-400 leading-5 mb-8">
              {t("auth.registerSubtitle")}
            </Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-neutral-700 mb-1.5">
                {t("auth.fullName")}
              </Text>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: t("auth.fullNameRequired"),
                  minLength: {
                    value: 2,
                    message: t("auth.fullNameMin"),
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-2xl px-4 py-3.5 font-sans text-sm text-neutral-900 ${
                      errors.name ? "border-error" : "border-neutral-200"
                    }`}
                    placeholder={t("auth.fullNamePlaceholder")}
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
                {t("auth.email")}
              </Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: t("auth.emailRequired"),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t("auth.emailInvalid"),
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-2xl px-4 py-3.5 font-sans text-sm text-neutral-900 ${
                      errors.email ? "border-error" : "border-neutral-200"
                    }`}
                    placeholder={t("auth.emailPlaceholder")}
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
                {t("auth.password")}
              </Text>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: t("auth.passwordRequired"),
                  minLength: {
                    value: 6,
                    message: t("auth.passwordMin"),
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
                {t("auth.register")}
              </Text>
            </Pressable>

            {/* Login link */}
            <Pressable
              onPress={() => router.replace("/(auth)/login")}
              className="items-center"
            >
              <Text className="text-neutral-400 font-sans text-sm">
                {t("auth.alreadyHaveAccount")}{" "}
                <Text className="text-neutral-900 font-sans-semibold">
                  {t("auth.login")}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
