export type SupportedLang = 'en' | 'cs';

const CZECH_SIGNAL = /[áčďéěíňóřšťúůýž]|\b(ahoj|čau|cau|dobrý|dobry|den|prosím|prosim|děkuji|dekuji|ano|ne|rezervace)\b/i;

export function detectLanguage(msg: string): SupportedLang {
  if (CZECH_SIGNAL.test(msg)) return 'cs';
  return 'en';
}

export function pickLang(
  messageLang: SupportedLang,
  defaultLang: string,
): SupportedLang {
  if (messageLang === 'cs') return 'cs';
  if (defaultLang === 'cs') return 'cs';
  return 'en';
}

export function errorMessage(lang: SupportedLang): string {
  return lang === 'cs'
    ? 'Omlouvám se, něco se pokazilo. Zkuste to prosím znovu.'
    : 'Sorry, something went wrong. Please try again.';
}

export function timeoutMessage(lang: SupportedLang): string {
  return lang === 'cs'
    ? 'Omlouvám se, odpověď trvala příliš dlouho. Zkuste to prosím znovu.'
    : 'Sorry, that took too long. Please try again.';
}

export function emptyNudge(lang: SupportedLang): string {
  return lang === 'cs'
    ? 'Omlouvám se, ještě na tom pracuji — můžete zprávu poslat znovu? 🙏'
    : "Sorry, I'm still working on that — could you send your message again? 🙏";
}
