export const HEADLINE_ICON_IDS = ['work', 'code', 'lab'] as const;

export type HeadlineIconId = (typeof HEADLINE_ICON_IDS)[number];

export type HeadlinePart = {
  text: string;
  icon: HeadlineIconId | null;
};

const ICON_PREFIX = /^\[(work|code|lab)\]\s+/;
const FOUNDER_DEFAULTS: HeadlineIconId[] = ['work', 'code', 'lab'];

export function isHeadlineIconId(value: string): value is HeadlineIconId {
  return (HEADLINE_ICON_IDS as readonly string[]).includes(value);
}

/** Split a stored headline into lines. Icon tokens stay out of the visible text. */
export function parseHeadlineParts(headline: string | null | undefined): HeadlinePart[] {
  if (!headline?.trim()) return [];
  return headline
    .split('·')
    .map((raw) => {
      const trimmed = raw.trim();
      const match = trimmed.match(ICON_PREFIX);
      if (!match || !isHeadlineIconId(match[1])) {
        return { text: trimmed, icon: null as HeadlineIconId | null };
      }
      return {
        text: trimmed.slice(match[0].length).trim(),
        icon: match[1],
      };
    })
    .filter((part) => part.text.length > 0);
}

export function serializeHeadlineParts(parts: HeadlinePart[]): string {
  return parts
    .map((part) => ({
      text: part.text.trim(),
      icon: part.icon && isHeadlineIconId(part.icon) ? part.icon : null,
    }))
    .filter((part) => part.text.length > 0)
    .map((part) => (part.icon ? `[${part.icon}] ${part.text}` : part.text))
    .join(' · ');
}

export function headlinePlainText(headline: string | null | undefined): string {
  return parseHeadlineParts(headline)
    .map((part) => part.text)
    .join(' · ');
}

/**
 * Lines ready to paint.
 * Three or more lines: the first stands alone and the rest share the next row.
 * A single line with no chosen icon keeps the briefcase.
 * The founder card keeps work / code / research when no icons were saved yet.
 */
export function displayHeadlineParts(
  headline: string | null | undefined,
  options?: { founder?: boolean },
): HeadlinePart[] {
  const parts = parseHeadlineParts(headline);
  if (parts.length === 0) {
    return [{ text: 'Builder', icon: 'work' }];
  }
  if (options?.founder && parts.length >= 3 && parts.every((part) => part.icon == null)) {
    return parts.map((part, index) => ({
      ...part,
      icon: FOUNDER_DEFAULTS[index] ?? 'work',
    }));
  }
  if (parts.every((part) => part.icon == null)) {
    return parts.map((part, index) => ({
      ...part,
      icon: index === 0 ? 'work' : null,
    }));
  }
  return parts;
}
