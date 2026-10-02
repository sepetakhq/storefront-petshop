import { describe, expect, it } from 'vitest';

import { catalogChips, catalogTitle, heroLayout, struckPrice, tagChip } from './copy.js';

// The decisions this template adds on top of the fork: the hero's frame and
// inset, the struck line price, and the product-tag filter.

describe('heroLayout', () => {
  const pic = (n) => ({ url: `https://cdn.test/${n}.webp`, alt: n });

  it('has nothing to draw for no pictures, and drops ones without a URL', () => {
    expect(heroLayout(undefined)).toEqual({ frames: [], inset: null });
    expect(heroLayout([{ url: '' }, null])).toEqual({ frames: [], inset: null });
  });

  it('puts a lone picture in the frame with no inset', () => {
    expect(heroLayout([pic('a')])).toEqual({ frames: [pic('a')], inset: null });
  });

  it('puts the second picture in the inset', () => {
    expect(heroLayout([pic('a'), pic('b')])).toEqual({ frames: [pic('a')], inset: pic('b') });
  });

  it('rotates the first and every picture after the second in the frame, so none is dropped', () => {
    const { frames, inset } = heroLayout([pic('a'), pic('b'), pic('c'), pic('d')]);
    expect(frames.map((f) => f.alt)).toEqual(['a', 'c', 'd']);
    expect(inset.alt).toBe('b');
  });
});

describe('struckPrice', () => {
  it('is the price before the promotion only when it is higher', () => {
    expect(struckPrice({ unit_price: 80000, undiscounted_unit_price: 100000 })).toBe(100000);
    expect(struckPrice({ unit_price: 80000, undiscounted_unit_price: 80000 })).toBe(0);
    expect(struckPrice({ unit_price: 80000, undiscounted_unit_price: 50000 })).toBe(0);
    expect(struckPrice({ unit_price: 80000 })).toBe(0);
    expect(struckPrice(null)).toBe(0);
  });
});

describe('product tag filter', () => {
  it('titles a tag-only list by the tag, and lets every other filter win', () => {
    expect(catalogTitle({ tag: 'terlaris' })).toBe('#terlaris');
    expect(catalogTitle({ tag: 'terlaris', q: 'kasur' })).toBe('Hasil untuk “kasur”');
    expect(catalogTitle({ tag: 'terlaris', sale: true }, [], 'Promo')).toBe('Promo');
    expect(catalogTitle({ tag: 'terlaris', cat: 'anjing' }, [{ key: 'anjing', label: 'Anjing' }])).toBe('Anjing');
  });

  it('keeps the tag on every chip, beside the sort', () => {
    const chips = catalogChips([{ key: 'anjing', label: 'Anjing' }], { tag: 'terlaris' }, 'priceAsc', 'Promo');
    expect(chips.map((c) => c.to)).toEqual([
      '/katalog?tag=terlaris&sort=priceAsc',
      '/katalog?cat=anjing&tag=terlaris&sort=priceAsc',
      '/katalog?sale=1&tag=terlaris&sort=priceAsc',
    ]);
    expect(chips.find((c) => c.current).key).toBe('__all');
  });

  it('offers a chip that removes only the tag', () => {
    expect(tagChip(new URLSearchParams('cat=anjing'))).toBeNull();
    expect(tagChip(new URLSearchParams('tag=%20%20'))).toBeNull();
    expect(tagChip(new URLSearchParams('tag=terlaris'))).toEqual({ label: '#terlaris', to: '/katalog' });
    expect(tagChip(new URLSearchParams('cat=anjing&tag=terlaris&sort=priceAsc'))).toEqual({
      label: '#terlaris',
      to: '/katalog?cat=anjing&sort=priceAsc',
    });
  });
});
