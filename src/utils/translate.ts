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

const isGreek = (text: string): boolean =>
  /[\u0370-\u03FF\u1F00-\u1FFF]/.test(text);

export const translateBilingual = async (
  text: string,
): Promise<{ el: string; en: string }> => {
  if (!text || text.trim() === '') return { el: '', en: '' };

  if (isGreek(text)) {
    const en = await translateText(text, 'el', 'en');
    return { el: text, en };
  } else {
    const el = await translateText(text, 'en', 'el');
    return { el, en: text };
  }
};
