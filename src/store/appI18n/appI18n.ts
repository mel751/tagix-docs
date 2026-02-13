import { createI18n } from "@effuse/i18n";
import { createStore } from "tagix";
import { LOCALES, Locale } from "./constants";
import { I18nState, I18nStateType } from "./state";
import { i18nActions } from "./actions";
import { loadTranslations, LoadResult } from "./utils";

const i18n = createI18n({
  defaultLocale: LOCALES.EN,
  fallbackLocale: LOCALES.EN,
  detectLocale: true,
  persistLocale: true,
});

export const appI18nStore = createStore<I18nStateType>(
  I18nState.Idle({ locale: i18n.getLocale() as Locale }),
  I18nState,
  { name: "appI18n" }
);

appI18nStore.registerGroup(i18nActions);

export const initI18n = async () => {
  const locale = i18n.getLocale() as Locale;
  appI18nStore.dispatch(i18nActions.setLocale, { locale });

  const result = await loadTranslations(locale);

  LoadResult.$match({
    Success: ({ data }) => {
      appI18nStore.dispatch(i18nActions.setReady, { locale, translations: data });
    },
    Failure: ({ error }) => {
      appI18nStore.dispatch(i18nActions.setError, { locale, message: error.message });
    },
  })(result);
};

export const switchLocale = async (locale: Locale) => {
  await i18n.setLocale(locale);
  appI18nStore.dispatch(i18nActions.setLocale, { locale });

  const result = await loadTranslations(locale);

  LoadResult.$match({
    Success: ({ data }) => {
      appI18nStore.dispatch(i18nActions.setReady, { locale, translations: data });
    },
    Failure: ({ error }) => {
      appI18nStore.dispatch(i18nActions.setError, { locale, message: error.message });
    },
  })(result);
};

export const i18nStore = {
  get locale() {
    return {
      get value(): Locale {
        return I18nState.$match({
          Idle: (s) => s.locale,
          Loading: (s) => s.locale,
          Ready: (s) => s.locale,
          Error: (s) => s.locale,
        })(appI18nStore.stateValue);
      },
    };
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
        const res = I18nState.$match({
          Idle: (_s: { locale: Locale }) => null,
          Loading: (_s: { locale: Locale }) => null,
          Ready: (s: { locale: Locale; translations: Record<string, string> }) => s.translations,
          Error: (_s: { locale: Locale; message: string }) => null,
        })(appI18nStore.stateValue);
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
