import { createContext, useContext, useState, useEffect } from "react";
import { vi } from "../i18n/vi";
import { en } from "../i18n/en";

const LanguageContext = createContext();

const translations = { vi, en };

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "vi";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  function t(key) {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
