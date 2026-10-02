import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { getPage } from '@sepetakhq/storefront-kit/api/endpoints';
import { qk } from '@sepetakhq/storefront-kit/api/queryKeys';
import { paragraphs } from '@sepetakhq/storefront-kit/shared/format';

import { Img, SIZES } from '../ui/Img.jsx';
import Icon from '../ui/Icon.jsx';
import { askLink, mapsLink, sectionText } from '../lib/copy.js';
import { Sections } from './HomeRoute.jsx';

/**
 * The shop's story and how to reach it, as the design draws it: the about
 * title and text beside the about picture, the address, contact and hours
 * under their headings, the WhatsApp button, and then whatever sections the
 * merchant published on the backoffice's Tentang page. Every block is a brand
 * field or a published section, drawn only when the merchant filled it in.
 */
export default function About() {
  const { brand } = useConfig();
  const page = useAboutPage();
  const portrait = brand.aboutImage;
  const name = [brand.wordmark_primary, brand.wordmark_accent].filter(Boolean).join(' ');
  // An unset title renders the wordmark rather than an empty heading.
  const title = brand.aboutTitle || name;
  const story = paragraphs(brand.aboutBody);
  const eyebrow = sectionText(brand.sections, 'story_eyebrow');
  // The page's name is what the shop calls it in its nav.
  const pageName = brand.nav?.find((n) => n.path === '/tentang')?.label || sectionText(brand.sections, 'story_cta');

  // A link out to the map, never an embedded one: no third-party frame loads
  // on the shop's own page.
  const maps = mapsLink(brand);
  const address = [
    ...[brand.address_line1, brand.address_line2].filter(Boolean).map((t) => ({ t })),
    ...(maps ? [{ t: 'Buka di Maps', href: maps, external: true }] : []),
  ];
  const contact = [
    brand.phone && { t: brand.phone, href: `tel:${String(brand.phone).replace(/[^\d+]/g, '')}` },
    brand.email && { t: brand.email, href: `mailto:${brand.email}` },
  ].filter(Boolean);
  const cards = [
    address.length && { key: 'address', title: sectionText(brand.sections, 'about_address_heading'), lines: address },
    contact.length && { key: 'contact', title: sectionText(brand.sections, 'about_contact_heading'), lines: contact },
    brand.opening_hours && { key: 'hours', title: sectionText(brand.sections, 'about_hours_heading'), lines: [{ t: brand.opening_hours }] },
  ].filter(Boolean);
  const chat = askLink(brand.whatsapp_url, '');
  const chatText = String(brand.whatsapp_text ?? '').trim() || sectionText(brand.sections, 'about_contact_heading');

  return (
    <main aria-label={pageName}>
      <section className="ps-section ps-section-tight">
        <nav aria-label="Breadcrumb" className="ps-crumbs" style={{ marginBottom: 16 }}>
          <Link to="/">Beranda</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{pageName}</span>
        </nav>
        {/* The design's order: the story with the contact cards under it, and
            the portrait beside them (after them, stacked on a phone). */}
        <div className="ps-about">
          <div className="ps-about-copy">
            {eyebrow && <span className="ps-eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {/* Text nodes, never dangerouslySetInnerHTML: the body is copy a
                merchant typed into the backoffice. */}
            {story.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {chat && (
              <a href={chat} target="_blank" rel="noopener noreferrer" className="ps-btn ps-btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Icon name="whatsapp" size={18} />
                {chatText}
              </a>
            )}
            {cards.length > 0 && (
              <div className="ps-about-facts" style={{ marginTop: 8 }}>
                {cards.map((c) => (
                  <div key={c.key} className="ps-fact">
                    <b>{c.title}</b>
                    {c.lines.map((l, j) =>
                      l.href ? (
                        <a
                          key={j}
                          href={l.href}
                          className={l.external ? 'ps-fact-link' : undefined}
                          target={l.external ? '_blank' : undefined}
                          rel={l.external ? 'noopener noreferrer' : undefined}
                        >
                          {l.t}
                        </a>
                      ) : (
                        <span key={j} className="ps-fact-line">
                          {l.t}
                        </span>
                      ),
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {portrait?.url && (
            <div className="ps-about-media">
              <Img
                src={portrait.url}
                srcSet={portrait.srcset}
                alt={portrait.alt || name}
                ratio="auto"
                radius={0}
                sizes={SIZES.hero}
                style={{ position: 'absolute', inset: 0, background: 'transparent' }}
              />
            </div>
          )}
        </div>
      </section>
      {/* Published sections follow, each spaced by its own section padding. */}
      {page.sections.length > 0 && <Sections sections={page.sections} />}
    </main>
  );
}

/**
 * The sections the merchant published on the Tentang page. A shop that never
 * published one gets a 404 from the API, which here simply means "none": the
 * brand's own about text above is the page.
 */
export function useAboutPage() {
  const q = useQuery({
    queryKey: qk.page('about'),
    queryFn: ({ signal }) => getPage('about', signal),
    retry: (count, err) => err?.status !== 404 && count < 2,
    staleTime: 60_000,
  });
  return { sections: q.data?.sections ?? [], isPending: q.isPending };
}
