import { useState } from 'react';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';

import { Paw } from '../ui/Icon.jsx';

/**
 * The shop's name: its uploaded logo, or the design's wordmark (primary in
 * the serif, accent run on in italic).
 *
 * Deliberately not `ui/Img.jsx`: a logo whose ratio nobody knows would be
 * cropped by it, and its loading gradient would show through a transparent
 * PNG. The height is fixed and the width follows the image, so a wide
 * wordmark logo and a square monogram both fit. A logo that fails to load
 * falls back to the wordmark rather than leaving a hole -- the media pipeline
 * never retries an asset it once refused.
 *
 * @param {number} height   logo height in px; width follows the image
 * @param {number} maxWidth cap, so an extremely wide logo cannot push the nav
 * @param {boolean} tagline the tagline under the wordmark (header)
 * @param {boolean} glyph   the template's paw before the wordmark (header);
 *                          never beside an uploaded logo, which is the shop's own
 */
export function BrandMark({ height = 38, maxWidth = 200, tagline = false, glyph = false }) {
  const { brand, tenant } = useConfig();
  const [failed, setFailed] = useState(false);

  const logo = brand.logoImage;
  const primary = brand.wordmark_primary || tenant?.name || '';
  const accent = brand.wordmark_accent || '';
  const name = [primary, accent].filter(Boolean).join(' ');

  if (logo?.url && !failed) {
    return (
      <img
        src={logo.url}
        srcSet={logo.srcset || undefined}
        sizes={logo.srcset ? `${maxWidth}px` : undefined}
        // Never empty: this image *is* the shop's name.
        alt={logo.alt || name}
        height={height}
        onError={() => setFailed(true)}
        style={{ height, width: 'auto', maxWidth, display: 'block', objectFit: 'contain' }}
      />
    );
  }

  // The design's mark: the two halves of the name run together in the serif,
  // the first in sage and the second in the accent, and in the header the
  // shop's tagline in small capitals under it (the footer has the short one).
  const mark = (
    <span className="ps-wordmark-text" style={{ maxWidth }}>
      <span className="ps-wordmark-primary">{primary}</span>
      {accent && <span className="ps-wordmark-accent">{accent}</span>}
    </span>
  );
  const line = tagline ? String(brand.tagline || brand.tagline_short || '').trim() : '';
  const paw = glyph ? <Paw size={34} className="ps-wordmark-paw" /> : null;
  if (!line) {
    return paw ? (
      <>
        {paw}
        {mark}
      </>
    ) : (
      mark
    );
  }
  return (
    <>
      {paw}
      <span className="ps-wordmark-stack" style={{ maxWidth }}>
        {mark}
        <span className="ps-wordmark-tagline">{line}</span>
      </span>
    </>
  );
}
