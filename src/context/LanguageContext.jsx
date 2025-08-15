import React, { createContext, useState, useContext, useEffect } from 'react';
import locales from '../locales';

const LanguageContext = createContext();

// useLanguage 훅을 별도로 정의
const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return {
    ...context,
    t: (key) => {
      const keys = key.split('.');
      let value = context.translations;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    }
  };
};

export { useLanguage };

export const LanguageProvider = ({ children }) => {
  // 브라우저 언어 감지 또는 저장된 언어 설정 불러오기
  const detectLanguage = () => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && locales[savedLanguage]) {
      return savedLanguage;
    }
    
    // 브라우저 언어 감지
    const browserLang = navigator.language.split('-')[0];
    return locales[browserLang] ? browserLang : 'ko'; // 기본값은 한국어
  };

  const [language, setLanguage] = useState(detectLanguage);
  const [translations, setTranslations] = useState(locales[language]);

  // 언어 변경 함수
  const changeLanguage = (lang) => {
    if (locales[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  // 언어 변경 시 번역 업데이트
  useEffect(() => {
    setTranslations(locales[language]);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, translations, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};