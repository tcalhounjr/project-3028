// ---------------------------------------------------------------------------
// flagUrl — shared utility for transforming flagcdn.com URLs.
// Both CountryTable and TopMovers use w40 thumbnails; the source data.json
// stores w80 URLs.
// ---------------------------------------------------------------------------

/**
 * Converts a flagcdn.com w80 URL to a w40 URL.
 * If the URL does not contain '/w80/', it is returned unchanged as a guard
 * against unexpected URL formats.
 */
export function toW40Url(flagUrl: string): string {
  if (!flagUrl.includes('/w80/')) {
    return flagUrl
  }
  return flagUrl.replace('/w80/', '/w40/')
}
