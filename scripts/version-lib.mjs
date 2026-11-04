/** Pure helpers for scripts/version.mjs (kept side-effect free so they can be unit tested). */

export const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/;

export function changelogSection(changelog, version) {
  // Escape every RegExp metacharacter (including backslash) before embedding the version.
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^## \\[${escaped}\\](.*)$([\\s\\S]*?)(?=^## \\[|(?![\\s\\S]))`, 'm').exec(
    changelog,
  );
  if (!match) return null;
  return { heading: match[1].trim(), body: match[2].trim() };
}
