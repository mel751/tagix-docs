import { createI18n } from "@effuse/i18n";
import { createStore } from "tagix";
import { signal } from "@effuse/core";
import { LOCALES, Locale, LOCALE_STORAGE_KEY } from "./constants";
import { I18nState, I18nStateType } from "./state";
import { i18nActions } from "./actions";
import { loadTranslations, LoadResult } from "./utils";
import { I18nInvalidLocaleError } from "./errors";

const i18n = createI18n({
  defaultLocale: LOCALES.EN,
  fallbackLocale: LOCALES.EN,
  detectLocale: true,
  persistLocale: true,
});

const isSupportedLocale = (locale: string | null): locale is Locale => {
  return locale !== null && Object.values(LOCALES).includes(locale as Locale);
};

const getInitialLocale = (): Locale => {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isSupportedLocale(saved)) return saved;

  const detected = i18n.getLocale();
  if (isSupportedLocale(detected)) return detected;

  return LOCALES.EN;
};

export const appI18nStore = createStore<I18nStateType>(
  I18nState.Idle({ locale: getInitialLocale() }),
  I18nState,
  { name: "appI18n" }
);

const localeSignal = signal<Locale>(getInitialLocale());

appI18nStore.subscribe((state) => {
  const currentLocale = I18nState.$match(state, {
    Idle: (s) => s.locale,
    Loading: (s) => s.locale,
    Ready: (s) => s.locale,
    Error: (s) => s.locale,
  });

  if (localeSignal.value !== currentLocale) {
    localeSignal.value = currentLocale;
  }
});

appI18nStore.registerGroup(i18nActions);

export const initI18n = async () => {
  const locale = appI18nStore.stateValue.locale;

  appI18nStore.dispatch(i18nActions.setLocale, { locale });

  const result = await loadTranslations(locale);

  LoadResult.$match(result, {
    Success: ({ data }) => {
      appI18nStore.dispatch(i18nActions.setReady, { locale, translations: data });
    },
    Failure: ({ error }) => {
      appI18nStore.dispatch(i18nActions.setError, { locale, message: error.message });
    },
  });
};

export const switchLocale = async (locale: Locale) => {
  if (!isSupportedLocale(locale)) {
    appI18nStore.dispatch(i18nActions.setError, {
      locale: i18n.getLocale() as Locale,
      message: new I18nInvalidLocaleError({
        message: `Cannot switch to unsupported locale: ${locale}`,
      }).message,
    });
    return;
  }

  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  await i18n.setLocale(locale);
  appI18nStore.dispatch(i18nActions.setLocale, { locale });

  const result = await loadTranslations(locale);

  LoadResult.$match(result, {
    Success: ({ data }) => {
      appI18nStore.dispatch(i18nActions.setReady, { locale, translations: data });
    },
    Failure: ({ error }) => {
      appI18nStore.dispatch(i18nActions.setError, { locale, message: error.message });
    },
  });
};

export const i18nStore = {
  get locale() {
    return localeSignal;
  },
  get isLoading() {
    return {
      get value(): boolean {
        return I18nState.$is("Loading")(appI18nStore.stateValue);
      },
    };
  },
  get translations() {
    return {
      get value(): Record<string, string> | null {
        const res = I18nState.$match(appI18nStore.stateValue, {
          Idle: (_s: { locale: Locale }) => null,
          Loading: (_s: { locale: Locale }) => null,
          Ready: (s: { locale: Locale; translations: Record<string, string> }) => s.translations,
          Error: (_s: { locale: Locale; message: string }) => null,
        });
        return res as Record<string, string> | null;
      },
    };
  },
  setLocale: switchLocale,
  init: initI18n,
  subscribe: appI18nStore.subscribe.bind(appI18nStore),
  get stateValue() {
    return appI18nStore.stateValue;
  },
};

export const t = i18n.t;
export { i18n };
