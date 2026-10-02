import { Link } from 'react-router-dom';

import { useCart } from '@sepetakhq/storefront-kit/cart/CartProvider';
import { isPriceRange, lineKey } from '@sepetakhq/storefront-kit/lib/variants';
import { useToast } from '@sepetakhq/storefront-kit/ui/ToastProvider';
import { fmt } from '@sepetakhq/storefront-kit/shared/format';

import { Img, SIZES } from '../ui/Img.jsx';
import { Tile } from './Tile.jsx';
import Icon from '../ui/Icon.jsx';
import { cardNote, cardVeil, discountPct, quickAddState } from '../lib/copy.js';

/**
 * The design's card: a square picture (or initials) with the promotion's
 * badge in one corner and the discount in the other, and a pill at the foot of
 * the picture saying why it cannot be bought now (the veil) or what to know
 * (the pre-order wait, a nearly-gone stock). Under it the category in small
 * caps, the name, the price, and the full-width action. Each corner keeps one
 * colour whatever it says: the colour follows what the tag is, never its words.
 * The picture and the name are links; the action sits outside them so a tap on
 * it never navigates.
 */
export default function ProductCard({ p }) {
  const off = discountPct(p);
  const veil = cardVeil(p);
  const note = veil ? '' : cardNote(p);
  const href = `/produk/${p.slug}`;

  return (
    <article className="ps-card" data-testid="product-card">
      <Link to={href} className="ps-card-media" tabIndex={-1} aria-hidden="true">
        <Img
          src={p.image}
          srcSet={p.image_srcset}
          sizes={SIZES.card}
          alt=""
          ratio="1/1"
          radius={0}
          width={p.image_width}
          height={p.image_height}
          fallback={<Tile label={p.name} tintKey={p.category_key} size={26} />}
        />
        {p.badge && <span className="ps-tag ps-tag-badge">{p.badge}</span>}
        {off > 0 && <span className="ps-tag ps-tag-sale">−{off}%</span>}
        {veil && <span className="ps-card-veil">{veil}</span>}
        {note && <span className="ps-card-note">{note}</span>}
      </Link>
      <div className="ps-card-body">
        <div className="ps-card-info">
          {p.category_label && <span className="ps-card-cat">{p.category_label}</span>}
          <Link to={href} className="ps-card-name">
            {p.name}
          </Link>
          <Price p={p} off={off} />
        </div>
        <div className="ps-card-foot">
          <QuickAdd p={p} />
        </div>
      </div>
    </article>
  );
}

function Price({ p, off }) {
  return (
    <div className="ps-card-price">
      <span className="ps-price">
        {isPriceRange(p) && <span className="ps-price-from">mulai </span>}
        {fmt(p.price)}
      </span>
      {off > 0 && <s className="ps-compare">{fmt(p.compare_at_price)}</s>}
    </div>
  );
}

/**
 * The action, by quickAddState:
 *   add      → the button adds one and confirms with a toast
 *   stepper  → −/+ around the qty already in the cart, + capped at `max`
 *   variants → the button opens the page; a card cannot pick a variant
 *   disabled → nothing; the picture's veil already says why
 */
export function QuickAdd({ p }) {
  const cart = useCart();
  // The kit's context value is the function itself, not an object holding it.
  const showToast = useToast();
  const key = lineKey({ productId: p.id, variantId: null });
  const line = cart.items.find((it) => lineKey(it) === key);
  const qty = line?.qty ?? 0;
  const state = quickAddState(p, qty);

  if (state.kind === 'variants') {
    return (
      <Link to={`/produk/${p.slug}`} className="ps-card-act is-outline" aria-label={`Pilih varian ${p.name}`}>
        Pilih varian
      </Link>
    );
  }
  if (state.kind === 'disabled') return null;
  if (state.kind === 'add') {
    const label = p.preorder ? 'Pre-order' : 'Tambah';
    return (
      <button
        type="button"
        className="ps-card-act"
        aria-label={`${label} ${p.name} ke keranjang`}
        onClick={() => {
          cart.add(p, 1, null);
          showToast(`${p.name} masuk keranjang`);
        }}
      >
        <span>{p.preorder ? 'Pre-order' : 'Tambah ke keranjang'}</span>
        <Icon name="cart" size={16} strokeWidth={2} />
      </button>
    );
  }
  return (
    <div className="ps-stepper" role="group" aria-label={`Jumlah ${p.name}`}>
      <button type="button" aria-label="Kurangi" onClick={() => (qty <= 1 ? cart.remove(key) : cart.setQty(key, qty - 1))}>
        −
      </button>
      <output aria-live="polite">{qty}</output>
      <button type="button" aria-label="Tambah" disabled={qty >= state.max} onClick={() => cart.setQty(key, qty + 1)}>
        +
      </button>
    </div>
  );
}
