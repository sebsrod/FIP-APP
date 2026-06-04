/**
 * Static seed content (no secrets). Passwords are plaintext here ONLY so the
 * seed generator can hash them through the real PBKDF2 code path — they are
 * never written to the database in plaintext.
 *
 * Placeholder imagery uses picsum.photos (deterministic per seed) so the app
 * looks populated the instant it boots without any external setup.
 */

export const BASE_TS = 1_717_200_000_000; // 2024-06-01T00:00:00Z, deterministic ordering

function img(seed: string): string {
  return `https://picsum.photos/seed/${seed}/900/1350`;
}
function avatar(seed: string): string {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=18181b`;
}
function shop(slug: string): string {
  return `https://example.com/shop/${slug}?aff=fip`;
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
    creatorId: 'usr_studio',
    imageA: img('fip-a1'),
    imageB: img('fip-b1'),
    votesA: 142,
    votesB: 167,
    tags: [
      { id: 'tag_1a1', side: 'A', x: 50, y: 74, brand: 'Toteme', item: 'Wool Blazer', priceCents: 49000, url: shop('toteme-wool-blazer') },
      { id: 'tag_1a2', side: 'A', x: 42, y: 90, brand: 'The Row', item: 'Leather Mules', priceCents: 79000, url: shop('the-row-mules') },
      { id: 'tag_1b1', side: 'B', x: 48, y: 60, brand: 'Lemaire', item: 'Silk Slip Dress', priceCents: 38000, url: shop('lemaire-slip-dress') },
    ],
  },
  {
    id: 'poll_2',
    creatorId: null,
    imageA: img('fip-a2'),
    imageB: img('fip-b2'),
    votesA: 88,
    votesB: 73,
    tags: [
      { id: 'tag_2a1', side: 'A', x: 55, y: 55, brand: 'COS', item: 'Oversized Coat', priceCents: 25000, url: shop('cos-oversized-coat') },
      { id: 'tag_2b1', side: 'B', x: 46, y: 48, brand: 'Acne Studios', item: 'Cashmere Knit', priceCents: 41000, url: shop('acne-cashmere-knit') },
      { id: 'tag_2b2', side: 'B', x: 60, y: 86, brand: 'Khaite', item: 'Denim Maxi Skirt', priceCents: 58000, url: shop('khaite-denim-maxi') },
    ],
  },
  {
    id: 'poll_3',
    creatorId: null,
    imageA: img('fip-a3'),
    imageB: img('fip-b3'),
    votesA: 209,
    votesB: 211,
    tags: [
      { id: 'tag_3a1', side: 'A', x: 44, y: 40, brand: 'Jacquemus', item: 'Cropped Shirt', priceCents: 32000, url: shop('jacquemus-cropped-shirt') },
      { id: 'tag_3a2', side: 'A', x: 58, y: 80, brand: 'Bottega Veneta', item: 'Mini Jodie', priceCents: 285000, url: shop('bottega-mini-jodie') },
      { id: 'tag_3b1', side: 'B', x: 50, y: 52, brand: 'Saint Laurent', item: 'Tailored Vest', priceCents: 99000, url: shop('saint-laurent-vest') },
      { id: 'tag_3b2', side: 'B', x: 47, y: 88, brand: 'Manolo Blahnik', item: 'Pointed Pumps', priceCents: 84500, url: shop('manolo-pumps') },
    ],
  },
  {
    id: 'poll_4',
    creatorId: null,
    imageA: img('fip-a4'),
    imageB: img('fip-b4'),
    votesA: 56,
    votesB: 121,
    tags: [
      { id: 'tag_4a1', side: 'A', x: 52, y: 66, brand: 'Ganni', item: 'Printed Midi Dress', priceCents: 29500, url: shop('ganni-printed-midi') },
      { id: 'tag_4b1', side: 'B', x: 49, y: 58, brand: 'Toteme', item: 'Pleated Trousers', priceCents: 33000, url: shop('toteme-pleated-trousers') },
      { id: 'tag_4b2', side: 'B', x: 40, y: 84, brand: 'Loewe', item: 'Puzzle Bag', priceCents: 290000, url: shop('loewe-puzzle-bag') },
    ],
  },
  {
    id: 'poll_5',
    creatorId: null,
    imageA: img('fip-a5'),
    imageB: img('fip-b5'),
    votesA: 0,
    votesB: 0,
    tags: [
      { id: 'tag_5a1', side: 'A', x: 50, y: 62, brand: 'Lemaire', item: 'Linen Shirt', priceCents: 36000, url: shop('lemaire-linen-shirt') },
      { id: 'tag_5b1', side: 'B', x: 51, y: 70, brand: 'Studio Nicholson', item: 'Wide Trousers', priceCents: 42000, url: shop('studio-nicholson-trousers') },
    ],
  },
  {
    id: 'poll_6',
    creatorId: 'usr_studio',
    imageA: img('fip-a6'),
    imageB: img('fip-b6'),
    votesA: 312,
    votesB: 188,
    tags: [
      { id: 'tag_6a1', side: 'A', x: 48, y: 50, brand: 'Prada', item: 'Re-Nylon Jacket', priceCents: 175000, url: shop('prada-renylon-jacket') },
      { id: 'tag_6a2', side: 'A', x: 55, y: 85, brand: 'Miu Miu', item: 'Ballet Flats', priceCents: 89000, url: shop('miumiu-ballet-flats') },
      { id: 'tag_6b1', side: 'B', x: 45, y: 64, brand: 'Max Mara', item: 'Camel Coat', priceCents: 295000, url: shop('maxmara-camel-coat') },
    ],
  },
  {
    id: 'poll_7',
    creatorId: null,
    imageA: img('fip-a7'),
    imageB: img('fip-b7'),
    votesA: 47,
    votesB: 52,
    tags: [
      { id: 'tag_7a1', side: 'A', x: 53, y: 58, brand: 'Reformation', item: 'Satin Bias Dress', priceCents: 24800, url: shop('reformation-bias-dress') },
      { id: 'tag_7b1', side: 'B', x: 44, y: 72, brand: 'Khaite', item: 'Leather Jacket', priceCents: 320000, url: shop('khaite-leather-jacket') },
      { id: 'tag_7b2', side: 'B', x: 58, y: 44, brand: 'Chloé', item: 'Sunglasses', priceCents: 41500, url: shop('chloe-sunglasses') },
    ],
  },
  {
    id: 'poll_8',
    creatorId: null,
    imageA: img('fip-a8'),
    imageB: img('fip-b8'),
    votesA: 174,
    votesB: 96,
    tags: [
      { id: 'tag_8a1', side: 'A', x: 49, y: 54, brand: 'Dries Van Noten', item: 'Sequin Skirt', priceCents: 132000, url: shop('dries-sequin-skirt') },
      { id: 'tag_8a2', side: 'A', x: 60, y: 82, brand: 'Mansur Gavriel', item: 'Bucket Bag', priceCents: 54000, url: shop('mansur-bucket-bag') },
      { id: 'tag_8b1', side: 'B', x: 47, y: 60, brand: 'A.P.C.', item: 'Denim Jacket', priceCents: 28000, url: shop('apc-denim-jacket') },
    ],
  },
];

export const LOOKS: SeedLook[] = [
  {
    id: 'look_demo_1',
    userId: 'usr_demo',
    image: img('fip-look-demo1'),
    caption: 'Off-duty in the city — soft tailoring, hard espresso.',
    items: [
      { id: 'litem_d1_1', x: 50, y: 46, brand: 'COS', item: 'Belted Wool Coat', priceCents: 27500, url: shop('cos-belted-coat') },
      { id: 'litem_d1_2', x: 44, y: 84, brand: 'Adidas', item: 'Samba OG', priceCents: 10000, url: shop('adidas-samba') },
    ],
  },
  {
    id: 'look_demo_2',
    userId: 'usr_demo',
    image: img('fip-look-demo2'),
    caption: 'Monochrome study. One color, three textures.',
    items: [
      { id: 'litem_d2_1', x: 52, y: 52, brand: 'Arket', item: 'Merino Roll-Neck', priceCents: 8900, url: shop('arket-merino-rollneck') },
      { id: 'litem_d2_2', x: 48, y: 72, brand: 'Toteme', item: 'Straight Jeans', priceCents: 30000, url: shop('toteme-straight-jeans') },
      { id: 'litem_d2_3', x: 58, y: 90, brand: 'The Row', item: 'Margaux Bag', priceCents: 390000, url: shop('the-row-margaux') },
    ],
  },
  {
    id: 'look_demo_3',
    userId: 'usr_demo',
    image: img('fip-look-demo3'),
    caption: 'Slip dress + sneakers. The eternal compromise.',
    items: [
      { id: 'litem_d3_1', x: 50, y: 58, brand: 'Reformation', item: 'Slip Dress', priceCents: 24800, url: shop('reformation-slip-dress') },
      { id: 'litem_d3_2', x: 46, y: 88, brand: 'New Balance', item: '2002R', priceCents: 14000, url: shop('newbalance-2002r') },
    ],
  },
  {
    id: 'look_studio_1',
    userId: 'usr_studio',
    image: img('fip-look-studio1'),
    caption: 'FW collection — Look 01. The architectural shoulder.',
    items: [
      { id: 'litem_s1_1', x: 50, y: 44, brand: 'Studio Atelier', item: 'Structured Blazer', priceCents: 68000, url: shop('studio-structured-blazer') },
      { id: 'litem_s1_2', x: 49, y: 78, brand: 'Studio Atelier', item: 'Tapered Trouser', priceCents: 39000, url: shop('studio-tapered-trouser') },
    ],
  },
  {
    id: 'look_studio_2',
    userId: 'usr_studio',
    image: img('fip-look-studio2'),
    caption: 'FW collection — Look 02. Draped, never fussy.',
    items: [
      { id: 'litem_s2_1', x: 52, y: 50, brand: 'Studio Atelier', item: 'Draped Midi Dress', priceCents: 72000, url: shop('studio-draped-dress') },
      { id: 'litem_s2_2', x: 60, y: 84, brand: 'Studio Atelier', item: 'Sculptural Heel', priceCents: 45000, url: shop('studio-sculptural-heel') },
      { id: 'litem_s2_3', x: 42, y: 66, brand: 'Studio Atelier', item: 'Leather Belt', priceCents: 18000, url: shop('studio-leather-belt') },
    ],
  },
  {
    id: 'look_studio_3',
    userId: 'usr_studio',
    image: img('fip-look-studio3'),
    caption: 'FW collection — Look 03. The long line coat.',
    items: [
      { id: 'litem_s3_1', x: 50, y: 54, brand: 'Studio Atelier', item: 'Long Line Coat', priceCents: 98000, url: shop('studio-longline-coat') },
      { id: 'litem_s3_2', x: 47, y: 86, brand: 'Studio Atelier', item: 'Chelsea Boot', priceCents: 52000, url: shop('studio-chelsea-boot') },
    ],
  },
  {
    id: 'look_studio_4',
    userId: 'usr_studio',
    image: img('fip-look-studio4'),
    caption: 'FW collection — Look 04. Knitwear, oversized on purpose.',
    items: [
      { id: 'litem_s4_1', x: 51, y: 48, brand: 'Studio Atelier', item: 'Chunky Cardigan', priceCents: 56000, url: shop('studio-chunky-cardigan') },
      { id: 'litem_s4_2', x: 49, y: 80, brand: 'Studio Atelier', item: 'Wide Wool Pant', priceCents: 43000, url: shop('studio-wide-wool-pant') },
    ],
  },
];
