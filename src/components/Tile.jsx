import { initials, tintFor } from '../lib/copy.js';

/**
 * The picture a product or category has when it has none: two letters on
 * the category's tint. This is what a shop looks like before the merchant
 * uploads anything, so it has to look designed rather than broken.
 */
export function Tile({ label, tintKey, size = 22, tinted = true }) {
  // Untinted, it sits on whatever its frame already paints (a category
  // card's own circle colour).
  return (
    <div className="ps-tile" style={{ background: tinted ? tintFor(tintKey ?? label) : 'transparent', fontSize: size }} aria-hidden="true">
      {initials(label)}
    </div>
  );
}
