export const DEFAULT_PRIVACY_URL='https://wakilongestor.com.br/politicas-de-privacidade/';
export const DEFAULT_CONSENT_TEXT='Estou ciente e concordo com o tratamento dos meus dados pessoais, conforme a Lei nº 13.709/2018 (LGPD).';

const LEGACY_CONSENT_TEXT='Li e concordo com a Política de Privacidade e os Termos de Uso.';

export function resolvePublicLegal(settings={}){
  const consentText=String(settings.consentText||'').trim();
  return {
    privacyUrl:String(settings.privacyUrl||DEFAULT_PRIVACY_URL).trim(),
    termsUrl:String(settings.termsUrl||'').trim(),
    consentRequired:settings.consentRequired!==false,
    consentText:!consentText||consentText===LEGACY_CONSENT_TEXT?DEFAULT_CONSENT_TEXT:consentText
  };
}
