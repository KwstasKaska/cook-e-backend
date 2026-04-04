/**
 * Translates a string using the MyMemory API.
 * 100% free, no API key required, 1000 requests/day limit.
 * Default direction is Greek → English, matching the app's input convention
 * (chefs/nutritionists write in Greek; the backend auto-fills the _en column).
 *
 * Docs: https://mymemory.translated.net/doc/spec.php
 */
export const translateText = async (
  text: string,
  source: 'el' | 'en' = 'el',
  target: 'el' | 'en' = 'en',
): Promise<string> => {
  if (!text || text.trim() === '') return '';

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${source}|${target}`,
    });

    const res = await fetch(
      `https://api.mymemory.translated.net/get?${params.toString()}`,
    );

    if (!res.ok) {
      console.error(`[translateText] HTTP ${res.status}: ${await res.text()}`);
      return text; // fallback: return original so save never fails
    }

    const data = await res.json();

    if (data.responseStatus !== 200) {
      console.error(`[translateText] API error: ${data.responseDetails}`);
      return text; // fallback
    }

    return (data.responseData.translatedText as string) ?? text;
  } catch (err) {
    console.error('[translateText] Failed, using original text:', err);
    return text; // fallback: return original so save never fails
  }
};
