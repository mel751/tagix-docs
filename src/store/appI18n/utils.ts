import { taggedEnum } from "tagix";
import { I18nLoadError } from "./errors";
import { LOCALES_PATH } from "./constants";

export type I18nLoadErrorType = InstanceType<typeof I18nLoadError>;

export type TranslationData = Record<string, string>;

export const LoadResult = taggedEnum({
  Success: { data: {} as TranslationData },
  Failure: { error: null as unknown as I18nLoadErrorType },
});

export type LoadResultType = typeof LoadResult.State;

export async function loadTranslations(locale: string): Promise<LoadResultType> {
  try {
    const response = await fetch(`${LOCALES_PATH}/${locale}.json`);
    if (!response.ok) {
      return LoadResult.Failure({
        error: new I18nLoadError({
          message: `HTTP error! status: ${response.status}`,
        }) as unknown as I18nLoadErrorType,
      });
    }
    const data = (await response.json()) as TranslationData;
    return LoadResult.Success({ data });
  } catch (error) {
    return LoadResult.Failure({
      error: new I18nLoadError({
        message: error instanceof Error ? error.message : "Unknown error",
        cause: error,
      }) as unknown as I18nLoadErrorType,
    });
  }
}
