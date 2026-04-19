import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tr from "./tr";
import en from "./en";
import fr from "./fr";
import es from "./es";

const LANGUAGE_KEY = "savely-language";

export type AppLanguage = "tr" | "en" | "fr" | "es";

export const LANGUAGES: { key: AppLanguage; label: string; flag: string }[] = [
  { key: "tr", label: "Türkçe", flag: "🇹🇷" },
  { key: "en", label: "English", flag: "🇬🇧" },
  { key: "fr", label: "Français", flag: "🇫🇷" },
  { key: "es", label: "Español", flag: "🇪🇸" },
];

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
};

const SUPPORTED: AppLanguage[] = ["tr", "en", "fr", "es"];

function getDeviceLanguage(): AppLanguage {
  const locale = getLocales()[0]?.languageCode ?? "tr";
  return SUPPORTED.includes(locale as AppLanguage) ? (locale as AppLanguage) : "tr";
}

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

initI18n();

export default i18next;
