import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import mkTranslation from "./locales/mk/translation.json";
import enTranslation from "./locales/en/translation.json";
import deTranslation from "./locales/de/translation.json";
import sqTranslation from "./locales/sq/translation.json";

const supportedLanguages = ["mk", "en", "de", "sq"];

// Detect first-time user's language
let lang = localStorage.getItem("selectedLanguage");

if (!lang) {
  const browserLang = navigator.language.split("-")[0]; // e.g., "de-DE" -> "de"
  lang = supportedLanguages.includes(browserLang) ? browserLang : "en";
  localStorage.setItem("selectedLanguage", lang);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      mk: { translation: mkTranslation },
      en: { translation: enTranslation },
      de: { translation: deTranslation },
      sq: { translation: sqTranslation },
    },
    lng: lang, // set language based on above logic
    fallbackLng: "en", // fallback for missing translations
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
