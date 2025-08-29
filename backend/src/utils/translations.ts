interface Translations {
  [key: string]: {
    [language: string]: string;
  };
}

const translations: Translations = {
  ERR_NO_WHATSAPP_CONFIGURED: {
    pt: "Nenhum número de Whatsapp foi configurado para essa empresa",
    es: "Ningún número de WhatsApp ha sido configurado para esta empresa",
    en: "No WhatsApp number has been configured for this company"
  },
  MEDIA_FILE: {
    pt: "Arquivo de mídia",
    es: "Archivo de medios",
    en: "Media file"
  }
};

export const getTranslation = (key: string, language: string = 'pt'): string => {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  
  return translation[language] || translation['pt'] || key;
};

export default translations;
