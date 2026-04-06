import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tr from "./tr";
import en from "./en";

const LANGUAGE_KEY = "savely-language";

export type AppLanguage = "tr" | "en";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

// Get device language, fallback to Turkish
function getDeviceLanguage(): AppLanguage {
  const locale = getLocales()[0]?.languageCode ?? "tr";
  return locale === "en" ? "en" : "tr";
}

// Initialize i18next
async function initI18n() {
  const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  const language = (savedLang as AppLanguage) || getDeviceLanguage();

  await i18next.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "tr",
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v4",
  });
}

export async function setLanguage(lang: AppLanguage) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18next.changeLanguage(lang);
}

export async function getLanguage(): Promise<AppLanguage> {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  return (saved as AppLanguage) || getDeviceLanguage();
}

// Init on import
initI18n();

export default i18next;
