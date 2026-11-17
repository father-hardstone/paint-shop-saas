/**
 * Seconds between photo changes on product cards with several photos.
 * Set VITE_CARD_IMAGE_ROTATE_SECONDS in the frontend env; 0 turns rotation off. Defaults to 3.
 */
export function getCardImageRotateSeconds(): number {
  const raw = import.meta.env.VITE_CARD_IMAGE_ROTATE_SECONDS;
  if (raw === undefined || raw === '') return 3;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 3;
}
