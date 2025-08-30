// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enTranslation from "./locales/en/translation.json";
import mkTranslation from "./locales/mk/translation.json";
import deTranslation from "./locales/de/translation.json";
import sqTranslation from "./locales/sq/translation.json";

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: enTranslation },
      mk: { translation: mkTranslation },
      de: { translation: deTranslation },
      sq: { translation: sqTranslation },
    },
    fallbackLng: "en", // Default language
    debug: true, // Set to false in production

    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
