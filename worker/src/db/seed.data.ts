/**
 * Static seed content (no secrets). Passwords are plaintext here ONLY so the
 * seed generator can hash them through the real PBKDF2 code path — they are
 * never written to the database in plaintext.
 *
 * Imagery uses curated Unsplash editorial fashion photos (real looks, clothing
 * and style — not random stock) served from the Unsplash image CDN. Each is a
 * stable, long-lived photo id. The client degrades gracefully if any image is
 * unavailable.
 */

export const BASE_TS = 1_717_200_000_000; // 2024-06-01T00:00:00Z, deterministic ordering

/** Unsplash CDN image, cropped to a portrait fashion frame. */
function img(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&h=1350&q=80`;
}
function avatar(seed: string): string {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=18181b`;
}
function shop(slug: string): string {
  return `https://example.com/shop/${slug}?aff=fip`;
}
// A real affiliate-program host so the seeded "verified" check is demonstrable.
function naps(slug: string): string {
  return `https://www.net-a-porter.com/en-us/shop/${slug}?aff=fip`;
}

export interface SeedUser {
  id: string;
  username: string;
  password: string; // hashed by the generator, never stored as-is
  displayName: string;
  bio: string;
  avatarUrl: string;
  followers: number;
}

export interface SeedTag {
  id: string;
  side: 'A' | 'B';
  x: number;
  y: number;
  brand: string;
  item: string;
  priceCents: number;
  currency?: string;
  url: string;
}

export interface SeedPoll {
  id: string;
  creatorId: string | null;
  caption: string;
  imageA: string;
  imageB: string;
  votesA: number;
  votesB: number;
  tags: SeedTag[];
}

export interface SeedItem {
  id: string;
  x: number;
  y: number;
  brand: string;
  item: string;
  priceCents: number;
  currency?: string;
  url: string;
}

export interface SeedLook {
  id: string;
  userId: string;
  image: string;
  caption: string;
  items: SeedItem[];
}

export const USERS: SeedUser[] = [
  {
    id: 'usr_demo',
    username: 'demo',
    password: 'demo1234',
    displayName: 'Demo',
    bio: 'Front-row regular. I vote with my gut and shop with my eyes.',
    avatarUrl: avatar('demo'),
    followers: 1284,
  },
  {
    id: 'usr_studio',
    username: 'studio',
    password: 'studio1234',
    displayName: 'Studio Atelier',
    bio: 'Independent atelier — quiet luxury, sharp tailoring. New looks weekly.',
    avatarUrl: avatar('studio-atelier'),
    followers: 8421,
  },
];

export const POLLS: SeedPoll[] = [
  {
    id: 'poll_1',
    caption: 'Beach party — which fit?',
    creatorId: 'usr_studio',
    imageA: img('1483985988355-763728e1935b'), // pink editorial, shopping
    imageB: img('1496747611176-843222e1e57c'), // tan trench coat
    votesA: 142,
    votesB: 167,
    tags: [
      { id: 'tag_1a1', side: 'A', x: 50, y: 70, brand: 'Toteme', item: 'Wool Blazer', priceCents: 49000, url: naps('toteme-wool-blazer') },
      { id: 'tag_1a2', side: 'A', x: 44, y: 88, brand: 'The Row', item: 'Leather Mules', priceCents: 79000, url: shop('the-row-mules') },
      { id: 'tag_1b1', side: 'B', x: 50, y: 58, brand: 'Lemaire', item: 'Silk Slip Dress', priceCents: 38000, url: shop('lemaire-slip-dress') },
    ],
  },
  {
    id: 'poll_2',
    caption: 'Coffee run, but make it fashion ☕',
    creatorId: null,
    imageA: img('1469334031218-e382a71b716b'), // camel coat, street style
    imageB: img('1525507119028-ed4c629a60a3'), // bold backdrop menswear
    votesA: 88,
    votesB: 73,
    tags: [
      { id: 'tag_2a1', side: 'A', x: 52, y: 52, brand: 'COS', item: 'Oversized Coat', priceCents: 25000, url: shop('cos-oversized-coat') },
      { id: 'tag_2b1', side: 'B', x: 48, y: 46, brand: 'Acne Studios', item: 'Cashmere Knit', priceCents: 41000, url: shop('acne-cashmere-knit') },
      { id: 'tag_2b2', side: 'B', x: 56, y: 82, brand: 'A.P.C.', item: 'Tapered Chinos', priceCents: 18000, url: shop('apc-tapered-chinos') },
    ],
  },
  {
    id: 'poll_3',
    caption: 'Date night — help me choose',
    creatorId: null,
    imageA: img('1539109136881-3be0616acf4b'), // vivid editorial portrait
    imageB: img('1515886657613-9f3515b0c78f'), // soft studio portrait
    votesA: 209,
    votesB: 211,
    tags: [
      { id: 'tag_3a1', side: 'A', x: 46, y: 40, brand: 'Jacquemus', item: 'Cropped Shirt', priceCents: 32000, url: shop('jacquemus-cropped-shirt') },
      { id: 'tag_3a2', side: 'A', x: 58, y: 78, brand: 'Bottega Veneta', item: 'Mini Jodie', priceCents: 285000, url: shop('bottega-mini-jodie') },
      { id: 'tag_3b1', side: 'B', x: 50, y: 50, brand: 'Saint Laurent', item: 'Tailored Vest', priceCents: 99000, url: naps('saint-laurent-vest') },
      { id: 'tag_3b2', side: 'B', x: 48, y: 86, brand: 'Manolo Blahnik', item: 'Pointed Pumps', priceCents: 84500, url: shop('manolo-pumps') },
    ],
  },
  {
    id: 'poll_4',
    caption: 'Weekend errands or brunch?',
    creatorId: null,
    imageA: img('1502716119720-b23a93e5fe1b'), // tailored menswear
    imageB: img('1434389677669-e08b4cac3105'), // plaid / layered
    votesA: 56,
    votesB: 121,
    tags: [
      { id: 'tag_4a1', side: 'A', x: 50, y: 58, brand: 'Officine Générale', item: 'Linen Suit', priceCents: 62000, url: shop('officine-linen-suit') },
      { id: 'tag_4b1', side: 'B', x: 49, y: 54, brand: 'Carhartt WIP', item: 'Flannel Overshirt', priceCents: 13000, url: shop('carhartt-flannel-overshirt') },
      { id: 'tag_4b2', side: 'B', x: 42, y: 84, brand: 'Levi’s', item: '501 Original', priceCents: 9800, url: shop('levis-501-original') },
    ],
  },
  {
    id: 'poll_5',
    caption: 'New season, new silhouette',
    creatorId: null,
    imageA: img('1485968579580-b6d095142e6e'), // editorial, red hair
    imageB: img('1490481651871-ab68de25d43d'), // studio pose
    votesA: 0,
    votesB: 0,
    tags: [
      { id: 'tag_5a1', side: 'A', x: 50, y: 60, brand: 'Ganni', item: 'Printed Midi Dress', priceCents: 29500, url: shop('ganni-printed-midi') },
      { id: 'tag_5b1', side: 'B', x: 51, y: 66, brand: 'Toteme', item: 'Pleated Trousers', priceCents: 33000, url: shop('toteme-pleated-trousers') },
    ],
  },
  {
    id: 'poll_6',
    caption: 'Office to dinner — which one?',
    creatorId: 'usr_studio',
    imageA: img('1492707892479-7bc8d5a4ee93'), // neutral menswear portrait
    imageB: img('1529139574466-a303027c1d8b'), // street style
    votesA: 312,
    votesB: 188,
    tags: [
      { id: 'tag_6a1', side: 'A', x: 48, y: 48, brand: 'Prada', item: 'Re-Nylon Jacket', priceCents: 175000, url: shop('prada-renylon-jacket') },
      { id: 'tag_6a2', side: 'A', x: 55, y: 84, brand: 'Common Projects', item: 'Achilles Low', priceCents: 43000, url: shop('common-projects-achilles') },
      { id: 'tag_6b1', side: 'B', x: 46, y: 60, brand: 'Max Mara', item: 'Teddy Coat', priceCents: 295000, url: naps('maxmara-teddy-coat') },
    ],
  },
];

export const LOOKS: SeedLook[] = [
  {
    id: 'look_demo_1',
    userId: 'usr_demo',
    image: img('1445205170230-053b83016050'), // boutique browsing
    caption: 'Off-duty in the city — soft tailoring, hard espresso.',
    items: [
      { id: 'litem_d1_1', x: 50, y: 44, brand: 'COS', item: 'Belted Wool Coat', priceCents: 27500, url: shop('cos-belted-coat') },
      { id: 'litem_d1_2', x: 44, y: 84, brand: 'Adidas', item: 'Samba OG', priceCents: 10000, url: shop('adidas-samba') },
    ],
  },
  {
    id: 'look_demo_2',
    userId: 'usr_demo',
    image: img('1462392246754-28dfa2df8e6b'), // knitwear flat-lay
    caption: 'Monochrome study. One color, three textures.',
    items: [
      { id: 'litem_d2_1', x: 40, y: 36, brand: 'Arket', item: 'Merino Roll-Neck', priceCents: 8900, url: shop('arket-merino-rollneck') },
      { id: 'litem_d2_2', x: 60, y: 58, brand: 'Toteme', item: 'Straight Jeans', priceCents: 30000, url: shop('toteme-straight-jeans') },
      { id: 'litem_d2_3', x: 50, y: 82, brand: 'The Row', item: 'Margaux Bag', priceCents: 390000, url: naps('the-row-margaux') },
    ],
  },
  {
    id: 'look_demo_3',
    userId: 'usr_demo',
    image: img('1485231183945-fffde7cc051e'), // sunglasses, chic
    caption: 'Slip dress + sneakers. The eternal compromise.',
    items: [
      { id: 'litem_d3_1', x: 50, y: 56, brand: 'Reformation', item: 'Slip Dress', priceCents: 24800, url: shop('reformation-slip-dress') },
      { id: 'litem_d3_2', x: 60, y: 38, brand: 'Le Specs', item: 'Cat-Eye Sunglasses', priceCents: 6900, url: shop('lespecs-cateye') },
    ],
  },
  {
    id: 'look_studio_1',
    userId: 'usr_studio',
    image: img('1441984904996-e0b6ba687e04'), // atelier rails
    caption: 'FW collection — Look 01. The architectural shoulder.',
    items: [
      { id: 'litem_s1_1', x: 38, y: 50, brand: 'Studio Atelier', item: 'Structured Blazer', priceCents: 68000, url: shop('studio-structured-blazer') },
      { id: 'litem_s1_2', x: 62, y: 70, brand: 'Studio Atelier', item: 'Tapered Trouser', priceCents: 39000, url: shop('studio-tapered-trouser') },
    ],
  },
  {
    id: 'look_studio_2',
    userId: 'usr_studio',
    image: img('1487222477894-8943e31ef7b2'), // garment rack, monochrome
    caption: 'FW collection — Look 02. Draped, never fussy.',
    items: [
      { id: 'litem_s2_1', x: 44, y: 44, brand: 'Studio Atelier', item: 'Draped Midi Dress', priceCents: 72000, url: shop('studio-draped-dress') },
      { id: 'litem_s2_2', x: 60, y: 78, brand: 'Studio Atelier', item: 'Sculptural Heel', priceCents: 45000, url: shop('studio-sculptural-heel') },
      { id: 'litem_s2_3', x: 52, y: 60, brand: 'Studio Atelier', item: 'Leather Belt', priceCents: 18000, url: shop('studio-leather-belt') },
    ],
  },
  {
    id: 'look_studio_3',
    userId: 'usr_studio',
    image: img('1483118714900-540cf339fd46'), // denim editorial
    caption: 'FW collection — Look 03. The long line coat.',
    items: [
      { id: 'litem_s3_1', x: 50, y: 52, brand: 'Studio Atelier', item: 'Long Line Coat', priceCents: 98000, url: shop('studio-longline-coat') },
      { id: 'litem_s3_2', x: 47, y: 86, brand: 'Studio Atelier', item: 'Chelsea Boot', priceCents: 52000, url: shop('studio-chelsea-boot') },
    ],
  },
];
