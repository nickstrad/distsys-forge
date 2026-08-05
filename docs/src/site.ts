// Single place to brand the reader. The create-learning-path skill (or you,
// by hand) edits only this file plus index.html when instantiating the template.
export const site = {
  /** Project name shown in the sidebar brand, page titles, and mobile header. */
  name: "PROJECT_NAME",
  /** Short strapline under the brand name. */
  tagline: "Learning path",
  /** Fallback description used when a document has no extractable summary. */
  description: "Learning path documentation.",
};

/** Single-letter brand mark rendered in the sidebar tile. */
export const siteMark = site.name.charAt(0).toUpperCase();

/** Two-letter folio shown in the outline rail (e.g. "PN / 03"). */
export const siteFolio = site.name
  .split(/[\s-_]+/)
  .map((word) => word.charAt(0))
  .join("")
  .slice(0, 2)
  .toUpperCase();

/** localStorage key for reader preferences, namespaced per project. */
export const readerPreferencesKey = `${site.name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")}-reader-preferences`;
