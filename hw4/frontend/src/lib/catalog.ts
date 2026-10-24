// Shared storefront data for the Problem 10 redesign: photos (with credits),
// residential colleges, curated collections, and color swatches.
import type { Product } from '../api'

// Free-license photos from Wikimedia Commons that show Yale apparel. They're
// linked (not copied into the repo) and credited in the footer, as their licenses require.
export type Photo = { title: string; src: string; alt: string; credit: string; license: string; page: string }

const commons = (path: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}`

export const PHOTOS = {
  team: {
    title: 'Football team',
    src: commons('9/9a/2019_Yale_Bulldogs_football_players.jpg/1920px-2019_Yale_Bulldogs_football_players.jpg'),
    alt: 'Yale Bulldogs football players in navy YALE jerseys walking onto the field',
    credit: 'Kenneth Zirkel',
    license: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:2019_Yale_Bulldogs_football_players.jpg',
  },
  cheer: {
    title: 'Cheerleaders',
    src: commons('2/2b/Yale_University_Cheerleaders.jpg/1920px-Yale_University_Cheerleaders.jpg'),
    alt: 'Yale cheerleaders in navy uniforms with white pom-poms at the Yale Bowl',
    credit: 'Kenneth Zirkel',
    license: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Yale_University_Cheerleaders.jpg',
  },
  dan: {
    title: 'Handsome Dan',
    src: commons('7/79/Inflatable_Handsome_Dan.jpg/1920px-Inflatable_Handsome_Dan.jpg'),
    alt: 'A giant inflatable Handsome Dan bulldog wearing a blue YALE collar, with fans walking past',
    credit: 'Ragesoss',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Inflatable_Handsome_Dan.jpg',
  },
  hockey: {
    title: 'Ingalls Rink',
    src: commons("5/50/2025_Harvard%E2%80%93Yale_men%27s_hockey_game_Ingalls.jpg/1920px-2025_Harvard%E2%80%93Yale_men%27s_hockey_game_Ingalls.jpg"),
    alt: 'Yale and Harvard men’s hockey game under the arched roof of Ingalls Rink',
    credit: 'Nickknack00',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:2025_Harvard%E2%80%93Yale_men%27s_hockey_game_Ingalls.jpg',
  },
} satisfies Record<string, Photo>

// The 11 residential colleges we carry gear for (monograms instead of crest images).
export const COLLEGES = [
  { name: 'Benjamin Franklin', code: 'BF' },
  { name: 'Berkeley', code: 'BK' },
  { name: 'Branford', code: 'BR' },
  { name: 'Davenport', code: 'DC' },
  { name: 'Grace Hopper', code: 'GH' },
  { name: 'Jonathan Edwards', code: 'JE' },
  { name: 'Morse', code: 'MC' },
  { name: 'Pierson', code: 'PC' },
  { name: 'Saybrook', code: 'SY' },
  { name: 'Timothy Dwight', code: 'TD' },
  { name: 'Trumbull', code: 'TC' },
]

export const CATEGORIES = [
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'crewneck sweatshirt', label: 'Crewnecks' },
  { key: 'T-shirt', label: 'Tees' },
  { key: 'quarter-zip', label: 'Quarter-Zips' },
  { key: 'jacket', label: 'Jackets' },
  { key: 'long-sleeve shirt', label: 'Long Sleeve' },
  { key: 'mockneck sweatshirt', label: 'Mocknecks' },
]

// Hand-picked first-week essentials for incoming students.
export const WELCOME_IDS = [
  'basic-hoodie-big-yale',
  'boola-boola-t-shirt',
  'champion-reverse-weave-crewneck',
  'yale-bowl-t-shirt',
  'district-vit-hoodie-vintage-bulldog',
  'poly-twill-crewneck-arched-yale',
  'big-yale-tri-blend-t-shirt',
  'brooks-brothers-double-knit-full-zip-hoodie-yale',
  '2025-yale-vs-harvard-t-shirt',
  'super-heavyweight-crewneck-arched-yale-crest',
]

const FAMILY = /\b(mom|dad|grandma|grandpa|aunt|uncle|brother|cousin)\b/i
const SPORTS = /\b(baseball|hockey|soccer|lacrosse|fencing|sailing|squash|tennis|golf|diving|swimming|volleyball|football|basketball|track|crew)\b/i
const COLLEGE_NAMES = new RegExp(`\\b(${COLLEGES.map((c) => c.name).join('|')})\\b`, 'i')

export const COLLECTIONS: Record<string, { label: string; blurb: string; match: (p: Product) => boolean }> = {
  welcome: {
    label: 'The Welcome Collection',
    blurb: 'First-week essentials for the Class of 2030.',
    match: (p) => WELCOME_IDS.includes(p.product_id),
  },
  colleges: {
    label: 'Residential Colleges',
    blurb: 'Your college is your home for four years. Wear the name.',
    match: (p) => COLLEGE_NAMES.test(p.name),
  },
  family: {
    label: 'Yale Family',
    blurb: 'For the proud ones who got you here.',
    match: (p) => FAMILY.test(p.name),
  },
  sports: {
    label: 'Game Day',
    blurb: 'From intramurals to The Game.',
    match: (p) => SPORTS.test(p.name),
  },
}

export const LOW_STOCK = 30

// Color names in the catalogue -> swatch colors.
const SWATCH: Record<string, string> = {
  navy: '#14284b', 'navy blue': '#14284b', 'royal blue': '#2349a3', blue: '#2f5fa8', 'light blue': '#9cc3e6',
  white: '#ffffff', ivory: '#f6f1e3', cream: '#efe6cf', black: '#111111', red: '#b3261e', gold: '#c9a227',
  yellow: '#e8c547', green: '#2f6b3a', 'dusty coral': '#d98b7c', gray: '#9a9a9a', 'light gray': '#cfcfcf',
  'heather gray': '#b8b8b5', 'dark gray': '#4b4b4b', 'charcoal gray': '#3d3d3d', 'dark heather gray': '#5a5a5a',
  'heather charcoal gray': '#4a4a4a', 'dark heather charcoal': '#444444',
}

export function swatch(color: string): string {
  return SWATCH[color.toLowerCase()] ?? (color.toLowerCase() === 'multicolor' ? 'conic-gradient(#b3261e,#e8c547,#2f5fa8,#2f6b3a,#b3261e)' : '#cccccc')
}

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key
}
