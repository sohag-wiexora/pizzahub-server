/** Safely reads an optional, non-empty string from an unknown query value. */
export const asOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/** Safely reads an optional finite number from an unknown query value. */
export const asOptionalNumber = (value: unknown): number | undefined => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (raw.length === 0) return undefined;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Escapes user input before embedding it into a $regex filter. */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
