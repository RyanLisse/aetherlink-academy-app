import en from './en.json' with {type: 'json'};
import nl from './nl.json' with {type: 'json'};

export type Locale = 'en' | 'nl';
export type Catalog = Readonly<Record<string, string>>;
export type Catalogs = Readonly<Record<Locale, Catalog>>;
export type Vars = Readonly<Record<string, string | number | boolean>>;

export interface StorageLike {
  getItem?(key: string): string | null;
  setItem?(key: string, value: string): void;
}

export const LOCALES: ReadonlyArray<Locale> = ['en', 'nl'];
export const DEFAULT_LOCALE: Locale = 'en';
export const STORAGE_KEY = 'academy-locale';

const supplemental: Catalogs = {
  en: {'connection.status': 'Connection status'},
  nl: {'connection.status': 'Verbindingsstatus'},
};

export const catalogs: Catalogs = {
  en: {...en, ...supplemental.en},
  nl: {...nl, ...supplemental.nl},
};

export function normalizeLocale(value: unknown): Locale {
  if (value === 'en' || value === 'nl') return value;
  return DEFAULT_LOCALE;
}

export function readStoredLocale(storage?: StorageLike): Locale {
  try {
    return normalizeLocale((storage ?? globalStorage())?.getItem?.(STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeStoredLocale(locale: unknown, storage?: StorageLike): Locale {
  const next = normalizeLocale(locale);
  try {
    (storage ?? globalStorage())?.setItem?.(STORAGE_KEY, next);
  } catch {
    /* quota or private mode */
  }
  return next;
}

export type Translate = (locale: Locale | string, key: string, vars?: Vars) => string;

export function createTranslate(source: Catalogs): Translate {
  return function translate(locale, key, vars) {
    const dict = source[normalizeLocale(locale)] ?? source.en;
    let text: string | undefined = dict?.[key];
    if (text == null || text === '') text = source.en?.[key];
    if (text == null || text === '') text = key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

export const translate: Translate = createTranslate(catalogs);

type DocLike = {documentElement?: {lang: string}};

export function applyDocumentLang(locale: unknown, doc: DocLike | undefined = globalDocument()): Locale {
  const lang = normalizeLocale(locale);
  if (doc?.documentElement) doc.documentElement.lang = lang;
  return lang;
}

function globalStorage(): StorageLike | undefined {
  return (globalThis as {localStorage?: StorageLike}).localStorage;
}

function globalDocument(): DocLike | undefined {
  return (globalThis as {document?: DocLike}).document;
}
