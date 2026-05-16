import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";

interface AnimatedSplashProps {
  onFinish: () => void;
}

type SplashLang = "tr" | "en" | "fr" | "es";

const MOTTOS: Record<SplashLang, string> = {
  tr: "Kaydet. Bul. Sakla.",
  en: "Save it. Find it. Keep it.",
  fr: "Enregistrez. Trouvez. Gardez.",
  es: "Guárdalo. Encuéntralo. Consérvalo.",
};

const SUPPORTED: SplashLang[] = ["tr", "en", "fr", "es"];

function resolveDeviceLang(): SplashLang {
  const code = getLocales()[0]?.languageCode ?? "tr";
  return SUPPORTED.includes(code as SplashLang) ? (code as SplashLang) : "tr";
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const mottoOpacity = useSharedValue(0);
  const mottoTranslateY = useSharedValue(10);
  const screenOpacity = useSharedValue(1);
  const [motto, setMotto] = useState<string>(() => MOTTOS[resolveDeviceLang()]);

  useEffect(() => {
    AsyncStorage.getItem("savely-language").then((saved) => {
      if (saved && SUPPORTED.includes(saved as SplashLang)) {
        setMotto(MOTTOS[saved as SplashLang]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // 1. Logo fade in + scale
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });

    // 2. Motto fade in
    mottoOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    mottoTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // 3. Fade out everything
    screenOpacity.value = withDelay(1800, withTiming(0, { duration: 400 }, (finished) => {
      if (finished) runOnJS(onFinish)();
    }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const mottoStyle = useAnimatedStyle(() => ({
    opacity: mottoOpacity.value,
    transform: [{ translateY: mottoTranslateY.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Animated.View style={logoStyle}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View style={mottoStyle}>
        <Text style={styles.motto}>{motto}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#27262b",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "#27262b",
  },
  motto: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    marginTop: 20,
    letterSpacing: 0.5,
  },
});
