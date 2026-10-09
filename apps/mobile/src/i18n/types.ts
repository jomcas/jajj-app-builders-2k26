export type Language = 'en' | 'fil';

/**
 * Every piece of UI text lives in a catalog with an English and a Filipino entry for each key.
 * The shell has one (src/i18n/shell.strings.ts) and each Feature Module brings its own
 * (src/modules/<id>/strings.ts), so adding a module never edits a shared catalog.
 */
export type StringCatalog<K extends string = string> = Record<Language, Record<K, string>>;
