/**
 * English messages
 *
 * Must implement every key defined in zh-CN.ts — the `Messages` type is
 * derived from the base locale, so a missing key is a compile error rather
 * than a blank string at runtime.
 */

import type { Messages } from './zh-CN'

export const en: Messages = {
  // Brand. Kept identical across locales: it is a wordmark, not a word.
  'app.brand': '𝒵𝐵𝒴𝐵𝐿𝒬',
  'app.greeting': 'Little Nook',

  // Bottom navigation
  'nav.home': 'Home',
  'nav.category': 'Browse',
  'nav.profile': 'Profile',

  // Common
  'common.back': 'Back',
  'common.count.tools': '{count} tools',
  'common.count.tools.one': '{count} tool',

  // Home
  'home.theme.toLight': 'Switch to light mode',
  'home.theme.toDark': 'Switch to dark mode',
  'home.shelf.more': 'View all {count} tools in {name}',

  // Category
  'category.title': 'Browse',
  'category.all': 'All categories',
  'category.index.more': 'Open {name}',

  // Category names
  'tag.algorithm': 'Algorithms',
  'tag.utility': 'Utilities',
  'tag.image': 'Images',
  'tag.music': 'Music',
  'tag.experimental': 'Experimental',

  'tag.desc.algorithm': 'Algorithm visualisations and demos',
  'tag.desc.utility': 'Everyday utilities',
  'tag.desc.image': 'Image processing and conversion',
  'tag.desc.music': 'Music making and playback',
  'tag.desc.experimental': 'Experimental features',

  // Profile
  'profile.title': 'Profile',
  'profile.subtitle': 'Appearance and preferences',
  'profile.language': 'Language',
  'profile.appearance': 'Appearance',
  'profile.mode.light': 'Light',
  'profile.mode.dark': 'Dark',
  'profile.mode.auto': 'System',
  'profile.accent': 'Accent colour',
  'profile.account': 'Account',
  'profile.account.pending':
    'Accounts are not enabled yet. Once they are, preferences and tool data can sync across devices.',

  // Accent palettes
  'accent.sun': 'Sun',
  'accent.mint': 'Mint',
  'accent.rose': 'Rose',
  'accent.peach': 'Peach',
  'accent.sky': 'Sky',
  'accent.lilac': 'Lilac',
}
