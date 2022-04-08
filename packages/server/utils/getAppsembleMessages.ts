import { readdir, readFile } from 'node:fs/promises';

import { defaultLocale } from '@appsemble/utils';

const translationsDir = new URL('../../../i18n/', import.meta.url);

export async function getSupportedLanguages(): Promise<Set<string>> {
  const files = await readdir(translationsDir);
  return new Set(files.map((lang) => lang.split('.json')[0].toLowerCase()));
}

/**
 * Fetch and merge the Appsemble core messages based on a language and a base language.
 *
 * @param language The language to get the messages of.
 * @param baseLanguage The base language of 