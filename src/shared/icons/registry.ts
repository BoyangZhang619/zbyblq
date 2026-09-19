/**
 * 图标注册表
 *
 * 本文件由 src/shared/icons/svg/ 下的文件生成，新增图标后需重新生成。
 * 使用 ?raw 导入源码文本，由 AppIcon 渲染为内联 SVG。
 *
 * 类型约束：IconName 为全部合法图标名的联合类型，
 * 拼写错误会在 vue-tsc 编译期报错，而非运行时静默渲染空白。
 *
 * 图标设计规范见 docs/04-icon-system.md §3
 */

import arrowLeft from './svg/arrow-left.svg?raw'
import arrowRight from './svg/arrow-right.svg?raw'
import bug from './svg/bug.svg?raw'
import check from './svg/check.svg?raw'
import clipboard from './svg/clipboard.svg?raw'
import close from './svg/close.svg?raw'
import externalLink from './svg/external-link.svg?raw'
import heart from './svg/heart.svg?raw'
import hint from './svg/hint.svg?raw'
import language from './svg/language.svg?raw'
import navCategory from './svg/nav-category.svg?raw'
import navHome from './svg/nav-home.svg?raw'
import navProfile from './svg/nav-profile.svg?raw'
import palette from './svg/palette.svg?raw'
import pause from './svg/pause.svg?raw'
import play from './svg/play.svg?raw'
import save from './svg/save.svg?raw'
import search from './svg/search.svg?raw'
import settings from './svg/settings.svg?raw'
import shuffle from './svg/shuffle.svg?raw'
import sparkle from './svg/sparkle.svg?raw'
import star from './svg/star.svg?raw'
import statusInfo from './svg/status-info.svg?raw'
import statusSuccess from './svg/status-success.svg?raw'
import statusWarning from './svg/status-warning.svg?raw'
import stepForward from './svg/step-forward.svg?raw'
import stop from './svg/stop.svg?raw'
import swapVertical from './svg/swap-vertical.svg?raw'
import themeDark from './svg/theme-dark.svg?raw'
import themeLight from './svg/theme-light.svg?raw'
import toolAscii from './svg/tool-ascii.svg?raw'
import toolBtree from './svg/tool-btree.svg?raw'
import toolCalendar from './svg/tool-calendar.svg?raw'
import toolDither from './svg/tool-dither.svg?raw'
import toolDrum from './svg/tool-drum.svg?raw'
import toolFont from './svg/tool-font.svg?raw'
import toolGame from './svg/tool-game.svg?raw'
import toolGreeting from './svg/tool-greeting.svg?raw'
import toolJournal from './svg/tool-journal.svg?raw'
import toolKalimba from './svg/tool-kalimba.svg?raw'
import toolPath from './svg/tool-path.svg?raw'
import toolPatina from './svg/tool-patina.svg?raw'
import toolPiano from './svg/tool-piano.svg?raw'
import toolPixelate from './svg/tool-pixelate.svg?raw'
import toolScramble from './svg/tool-scramble.svg?raw'
import toolSort from './svg/tool-sort.svg?raw'
import toolTodo from './svg/tool-todo.svg?raw'
import trash from './svg/trash.svg?raw'
import undo from './svg/undo.svg?raw'
import upload from './svg/upload.svg?raw'

export const iconRegistry = {
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  'bug': bug,
  'check': check,
  'clipboard': clipboard,
  'close': close,
  'external-link': externalLink,
  'heart': heart,
  'hint': hint,
  'language': language,
  'nav-category': navCategory,
  'nav-home': navHome,
  'nav-profile': navProfile,
  'palette': palette,
  'pause': pause,
  'play': play,
  'save': save,
  'search': search,
  'settings': settings,
  'shuffle': shuffle,
  'sparkle': sparkle,
  'star': star,
  'status-info': statusInfo,
  'status-success': statusSuccess,
  'status-warning': statusWarning,
  'step-forward': stepForward,
  'stop': stop,
  'swap-vertical': swapVertical,
  'theme-dark': themeDark,
  'theme-light': themeLight,
  'tool-ascii': toolAscii,
  'tool-btree': toolBtree,
  'tool-calendar': toolCalendar,
  'tool-dither': toolDither,
  'tool-drum': toolDrum,
  'tool-font': toolFont,
  'tool-game': toolGame,
  'tool-greeting': toolGreeting,
  'tool-journal': toolJournal,
  'tool-kalimba': toolKalimba,
  'tool-path': toolPath,
  'tool-patina': toolPatina,
  'tool-piano': toolPiano,
  'tool-pixelate': toolPixelate,
  'tool-scramble': toolScramble,
  'tool-sort': toolSort,
  'tool-todo': toolTodo,
  'trash': trash,
  'undo': undo,
  'upload': upload,
} as const

export type IconName = keyof typeof iconRegistry

export const ICON_NAMES = Object.keys(iconRegistry) as IconName[]
