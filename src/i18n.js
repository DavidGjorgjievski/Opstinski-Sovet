import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import mkTranslation from "./locales/mk/translation.json";
import enTranslation from "./locales/en/translation.json";
import deTranslation from "./locales/de/translation.json";
import sqTranslation from "./locales/sq/translation.json";

// Initialize i18n
i18n
  .use(initReactI18next) // connect with React
  .init({
    resources: {
      mk: { translation: mkTranslation },
      en: { translation: enTranslation },
      de: { translation: deTranslation },
      sq: { translation: sqTranslation },
    },
    lng: localStorage.getItem("selectedLanguage") || "mk", // default language
    fallbackLng: "mk",
    interpolation: {
      escapeValue: false,
    },
  });

// Save selectedLanguage if not set
const savedLang = localStorage.getItem("selectedLanguage");
if (!savedLang) {
  localStorage.setItem("selectedLanguage", i18n.language);
} else {
  i18n.changeLanguage(savedLang);
}

export default i18n;
