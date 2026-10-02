import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { useHome } from '@sepetakhq/storefront-kit/hooks/queries';
import { qk } from '@sepetakhq/storefront-kit/api/queryKeys';
import { serverNow } from '@sepetakhq/storefront-kit/api/client';

import ProductCard from '../components/ProductCard.jsx';
import { Tile } from '../components/Tile.jsx';
import { Img, SIZES } from '../ui/Img.jsx';
import Icon, { Paw } from '../ui/Icon.jsx';
import { CountdownCells } from '../ui/Countdown.jsx';
import { EmptyState, ErrorState, ProductGridSkeleton, Skeleton } from '../ui/states.jsx';
import {
  HERO_INTERVAL_MS,
  bannerTheme,
  categorySpec,
  featureMark,
  headlineParts,
  heroChips,
  heroLayout,
  nextSlide,
  sectionText,
  showCountdown,
} from '../lib/copy.js';

/** Products beyond which the carousel earns its arrows. */
export const RAIL_ARROWS_AFTER = 4;

/** The home page is the section list the merchant published, in order. */
export default function HomeRoute() {
  const { data, isPending, isError, error, refetch } = useHome();

  if (isPending) return <HomeSkeleton />;
  if (isError) {
    return (
      <main className="ps-wrap" style={{ paddingTop: 60 }}>
        <ErrorState error={error} onRetry={refetch} />
      </main>
    );
  }
  const sections = (data?.sections ?? []).filter(renders);
  if (sections.length === 0) return <EmptyHome />;
  return (
    <main>
      <Sections sections={sections} />
    </main>
  );
}

/**
 * A published section list, drawn in order. Shared with the About page, whose
 * sections the merchant edits on the same backoffice screen.
 */
export function Sections({ sections }) {
  return sections.filter(renders).map((sec, i) => <Section key={sec.id ?? i} sec={sec} />);
}

/** Whether a section has anything to draw; an empty one is skipped. */
export function renders(sec) {
  switch (sec?.type) {
    case 'hero':
      return Boolean(sec.hero?.title);
    case 'features':
      return Boolean(sec.features?.items?.length);
    case 'cats':
      return Boolean(sec.cats?.length);
    case 'campaign':
      return Boolean(sec.campaign);
    case 'grid':
    case 'carousel':
      return Boolean(sec.grid?.products?.length);
    case 'story':
      return Boolean(sec.story?.title);
    case 'banner':
      return Boolean(sec.banner?.text);
    default:
      // A type this bundle predates: skipped, the way the resolver skips one
      // it does not know.
      return false;
  }
}

function Section({ sec }) {
  switch (sec.type) {
    case 'hero':
      return <Hero hero={sec.hero} />;
    case 'features':
      return <Features features={sec.features} />;
    case 'cats':
      return <Categories cats={sec.cats} />;
    case 'campaign':
      return <Campaign campaign={sec.campaign} />;
    case 'grid':
      return <Grid grid={sec.grid} />;
    case 'carousel':
      return <Rail grid={sec.grid} />;
    case 'story':
      return <Story story={sec.story} />;
    case 'banner':
      return <Banner banner={sec.banner} />;
    default:
      return null;
  }
}

/**
 * A section heading as the design draws it: the paw, the title in the serif,
 * and the "see all" link at the other end of the row.
 */
function Head({ title, seeAll, to = '/katalog' }) {
  return (
    <div className="ps-head">
      <h2 className="ps-h2 ps-h2-paw">
        <Paw size={22} className="ps-paw" />
        <span>{title}</span>
      </h2>
      {seeAll && (
        <Link to={to} className="ps-link-arrow">
          {seeAll}
          <Icon name="arrow" size={15} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

/* --- hero ---------------------------------------------------------------- */

/**
 * The design's hero: the words on the left (eyebrow pill, the title with its
 * emphasis in the accent, the line under it, two buttons, the chip card), and
 * on the right the shop's picture on a soft blob, a round inset picture and
 * the first number in a bubble. Further numbers sit under the chips.
 */
function Hero({ hero }) {
  const { brand, copy, freeShipping } = useConfig();
  const stats = (brand.heroStats ?? []).filter((s) => s?.value);
  const chips = heroChips(brand.sections, copy, freeShipping);
  const secondary = sectionText(brand.sections, 'hero_secondary_cta');
  const [bubble, ...rest] = stats;

  return (
    <section className="ps-hero">
      <div className="ps-hero-row">
        <div className="ps-hero-copy">
          {brand.hero_eyebrow && <span className="ps-eyebrow ps-hero-eyebrow">{brand.hero_eyebrow}</span>}
          {/* `em` is the backoffice's "Penekanan": words that follow the title,
              drawn in the accent colour. */}
          <h1>
            <span>{hero.title}</span>
            {hero.em && (
              <>
                {' '}
                <em>{hero.em}</em>
              </>
            )}
          </h1>
          {hero.sub && <p className="ps-hero-sub">{hero.sub}</p>}
          <div className="ps-hero-actions">
            <Link to="/katalog" className="ps-btn ps-btn-primary ps-btn-lift">
              {hero.cta || 'Belanja sekarang'}
              <Icon name="arrow" size={18} strokeWidth={2.2} />
            </Link>
            {secondary && (
              <Link to="/lacak" className="ps-link-underline">
                {secondary}
              </Link>
            )}
          </div>
          {chips.length > 0 && (
            <ul className="ps-hero-chips">
              {chips.map((c) => (
                <li key={c.key}>
                  <span className="ps-hero-chip-icon" aria-hidden="true">
                    <Icon name={c.icon} size={22} />
                  </span>
                  <span className="ps-hero-chip-text">
                    <b>{c.label}</b>
                    {c.note && <span>{c.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {rest.length > 0 && (
            <dl className="ps-hero-stats">
              {rest.map((s, i) => (
                <div key={i}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <HeroGallery images={brand.heroImages} stat={bubble} />
      </div>
    </section>
  );
}

/**
 * The hero's picture side. The main frame takes turns through its pictures
 * every few seconds when there is more than one, unless the buyer asked for
 * reduced motion or is pointing at or focused inside it; the dots switch by
 * hand either way. The second picture sits in the round inset (heroLayout).
 */
export function HeroGallery({ images, stat }) {
  const { frames, inset } = heroLayout(images);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = frames.length;

  useEffect(() => {
    const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (n < 2 || paused || still) return undefined;
    const id = setInterval(() => setIndex((i) => nextSlide(i, n)), HERO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [n, paused]);

  const at = n ? index % n : 0;
  const picture = frames[at];

  return (
    <div
      className="ps-hero-media"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="ps-hero-blob" aria-hidden="true" />
      <div className="ps-hero-frame">
        <Img
          key={picture?.url ?? 'none'}
          src={picture?.url}
          srcSet={picture?.srcset}
          sizes={SIZES.hero}
          alt={picture?.alt ?? ''}
          ratio="5/4"
          priority
          radius={0}
          fallback={<EmptyPicture />}
        />
        {n > 1 && (
          <div className="ps-hero-dots" role="group" aria-label="Foto">
            {frames.map((s, i) => (
              <button
                key={s.url}
                type="button"
                aria-label={s.alt || `Foto ${i + 1}`}
                aria-pressed={i === at}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
      {inset && (
        <div className="ps-hero-inset">
          <Img src={inset.url} srcSet={inset.srcset} sizes={SIZES.inset} alt={inset.alt ?? ''} ratio="1/1" radius={0} />
        </div>
      )}
      {stat && (
        <div className="ps-hero-bubble">
          <b>{stat.value}</b>
          {stat.label && <span>{stat.label}</span>}
        </div>
      )}
    </div>
  );
}

/** What an image slot shows before the merchant uploads one. */
function EmptyPicture({ size = 96 }) {
  return (
    <div aria-hidden="true" className="ps-empty-picture">
      <Paw size={size} />
    </div>
  );
}

/* --- features ----------------------------------------------------------- */

/** The design's sage card: the title centred, each point beside its round mark. */
function Features({ features }) {
  const items = features.items.slice(0, 8);
  return (
    <section className="ps-section" aria-label={features.title || undefined}>
      <div className="ps-features-card">
        {features.title && <h2 className="ps-h2 ps-center">{features.title}</h2>}
        {/* data-n lets the stylesheet lay out by count (1–8), so no count
            leaves a lone item on its own row. */}
        <ul className="ps-features" data-n={items.length}>
          {items.map((it, i) => {
            const mark = featureMark(it.mark);
            return (
              <li key={i} className="ps-feature">
                <span className="ps-feature-mark" aria-hidden="true">
                  {mark.icon ? <Icon name={mark.icon} size={22} /> : mark.text}
                </span>
                <span className="ps-feature-copy">
                  <b>{it.title}</b>
                  {it.body && <span>{it.body}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* --- categories --------------------------------------------------------- */

/**
 * The design's category cards: a round picture on a tinted card (the tints
 * take turns down the row), the name, and the subtitle with an arrow.
 */
function Categories({ cats }) {
  const { brand } = useConfig();
  return (
    <section id="kategori" className="ps-section" style={{ scrollMarginTop: 90 }}>
      <Head title={sectionText(brand.sections, 'cats_heading')} />
      <div className="ps-cats">
        {cats.map((c) => (
          <Link key={c.key} to={`/katalog?cat=${encodeURIComponent(c.key)}`} className="ps-cat">
            <span className="ps-cat-media">
              <Img
                src={c.image}
                srcSet={c.image_srcset}
                sizes={SIZES.categoryTile}
                alt=""
                ratio="1/1"
                radius={0}
                style={{ background: 'transparent' }}
                fallback={<Tile label={c.label} size={30} tinted={false} />}
              />
            </span>
            <b className="ps-cat-name">{c.label}</b>
            {(c.subtitle || categorySpec(c)) && (
              <span className="ps-cat-sub">
                <span>{c.subtitle || categorySpec(c)}</span>
                <Icon name="arrow" size={13} strokeWidth={2.4} />
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* --- product grid and carousel ------------------------------------------ */

function Grid({ grid }) {
  const { brand } = useConfig();
  return (
    <section className="ps-section">
      <Head title={grid.title || 'Produk pilihan'} seeAll={sectionText(brand.sections, 'grid_see_all')} />
      <div className="ps-cards">
        {grid.products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}

function Rail({ grid }) {
  const { brand } = useConfig();
  const track = useRef(null);
  const scroll = (dir) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });
  };
  const arrows = grid.products.length > RAIL_ARROWS_AFTER;

  return (
    <section className="ps-section">
      <Head title={grid.title || 'Produk pilihan'} seeAll={sectionText(brand.sections, 'grid_see_all')} />
      <div className="ps-rail">
        {arrows && (
          <>
            <button type="button" className="ps-rail-arrow prev" aria-label="Sebelumnya" onClick={() => scroll(-1)}>
              <Icon name="prev" size={18} strokeWidth={2} />
            </button>
            <button type="button" className="ps-rail-arrow next" aria-label="Berikutnya" onClick={() => scroll(1)}>
              <Icon name="next" size={18} strokeWidth={2} />
            </button>
          </>
        )}
        <ul ref={track} className="ps-rail-track">
          {grid.products.map((p) => (
            <li key={p.id} className="ps-rail-item">
              <ProductCard p={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --- story -------------------------------------------------------------- */

/**
 * The design's story: the shop's portrait beside the words. On the About page
 * itself the link would point at the page it sits on, so it goes.
 */
function Story({ story }) {
  const { brand } = useConfig();
  const { pathname } = useLocation();
  const portrait = brand.aboutImage;
  const eyebrow = sectionText(brand.sections, 'story_eyebrow');

  return (
    <section className="ps-section ps-story">
      {portrait?.url && (
        <div className="ps-story-media">
          <Img
            src={portrait.url}
            srcSet={portrait.srcset}
            sizes={SIZES.hero}
            alt={portrait.alt ?? ''}
            ratio="4/3"
            radius={28}
            fallback={<EmptyPicture />}
          />
        </div>
      )}
      <div className="ps-story-copy">
        {eyebrow && <span className="ps-eyebrow">{eyebrow}</span>}
        <h2>{story.title}</h2>
        {story.text && <p>{story.text}</p>}
        {pathname !== '/tentang' && (
          <Link to="/tentang" className="ps-link-underline">
            {sectionText(brand.sections, 'story_cta')}
          </Link>
        )}
      </div>
    </section>
  );
}

/* --- campaign ----------------------------------------------------------- */

/**
 * The design's peach sale card: the promotion's badge and name, the big line,
 * the countdown and the button, beside every one of its products in a row that
 * scrolls sideways.
 */
function Campaign({ campaign }) {
  const qc = useQueryClient();
  const { brand } = useConfig();
  const products = campaign.products ?? [];
  // A countdown only for a real, near deadline: none for a promotion with no
  // end date, one already past, or one weeks away.
  const ticking = showCountdown(campaign.ends_at, serverNow());
  const { pre, accent } = headlineParts(campaign);
  const title = String(campaign.title ?? '').trim();
  // The design's order: the promotion's name as the heading, the big line
  // under it. Without a name (or a name that is the line), the line heads it.
  const named = Boolean(title) && title !== pre + accent;
  const line = (
    <>
      {pre}
      {accent && <em>{accent}</em>}
    </>
  );

  return (
    <section className="ps-section">
      <div className="ps-campaign-card">
        <div className="ps-campaign">
          {campaign.badge && <span className="ps-badge">{campaign.badge}</span>}
          <h2>{named ? title : line}</h2>
          {named && pre + accent && <p className="ps-campaign-line">{line}</p>}
          {ticking && (
            <CountdownCells
              until={campaign.ends_at}
              label={sectionText(brand.sections, 'countdown_label')}
              onExpire={() => qc.invalidateQueries({ queryKey: qk.home })}
            />
          )}
          {products.length > 0 && (
            <Link to="/katalog?sale=1" className="ps-btn ps-btn-dark">
              {sectionText(brand.sections, 'campaign_cta')}
            </Link>
          )}
        </div>
        {products.length > 0 && (
          <ul className="ps-campaign-track">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* --- banner ------------------------------------------------------------- */

function Banner({ banner }) {
  const theme = bannerTheme(banner.bg);
  return (
    <section className="ps-section">
      <div className={theme.className}>
        <p>{banner.text}</p>
        {banner.cta && (
          <Link to="/katalog" className={theme.button}>
            {banner.cta}
            <Icon name="arrow" size={18} strokeWidth={2.2} />
          </Link>
        )}
      </div>
    </section>
  );
}

/* --- states ------------------------------------------------------------- */

function EmptyHome() {
  return (
    <main className="ps-wrap" style={{ paddingTop: 60 }}>
      <EmptyState
        title="Toko sedang disiapkan"
        body="Halaman depan belum diisi. Katalognya sudah bisa dilihat."
        action={
          <Link to="/katalog" className="ps-btn ps-btn-primary">
            Lihat katalog
          </Link>
        }
      />
    </main>
  );
}

function HomeSkeleton() {
  return (
    <main aria-busy="true">
      <div className="ps-hero ps-shimmer" style={{ minHeight: 'clamp(380px, 46vw, 620px)' }} />
      <div className="ps-wrap" style={{ paddingTop: 40, display: 'grid', gap: 16 }}>
        <Skeleton height={34} width={240} />
        <ProductGridSkeleton count={4} />
      </div>
    </main>
  );
}
