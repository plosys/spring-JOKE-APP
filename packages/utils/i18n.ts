/**
 * Sort locales by specificity
 *
 * The languages are sorted in a way that more specific languages are preferred over less specific
 * ones, but languages are never sorted before completely different languages.
 *
 * All languages are converted to lower case for convenience.
 *
 *