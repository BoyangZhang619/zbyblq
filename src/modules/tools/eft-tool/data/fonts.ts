/**
 * 字体映射表
 *
 * 每种样式提供 52 个字形，顺序与 LATIN 常量一致（26 大写 + 26 小写）。
 * Combo 的 map 含组合字符，按码位计长超过 52，需用字形分组处理。
 *
 * 数据来源：public/eft/js/main.js，由脚本提取以保证 Unicode 不失真。
 *
 * 关于 Kalligraphy：原实现中该项与 Gothic 的映射表逐字符相同，
 * 属重复条目（选中它输出与 Gothic 无异），已移除。
 *
 * 可读的样式名（粗体/斜体/…）不在此处，由 locales.ts 按 id 提供——
 * 纯数据文件不应夹带需要翻译的文案。
 */

/** 映射基准：26 个大写 + 26 个小写 */
export const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export interface FontStyle {
  /** ASCII 标识，用于列表 key 与选中态判断 */
  id: string
  /** 展示名。本身即该样式的效果预览，故使用风格化字符 */
  name: string
  /** 52 个字形，顺序与 LATIN 一致 */
  map: string
}

export const FONT_STYLES: FontStyle[] = [
  {
    id: 'bold',
    name: '𝐁𝐨𝐥𝐝',
    map: '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳',
  },
  {
    id: 'italic',
    name: '𝑰𝒕𝒂𝒍𝒊𝒄',
    map: '𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧',
  },
  {
    id: 'bold-italic',
    name: '𝐁𝐨𝐥𝐝 𝐈𝐭𝐚𝐥𝐢𝐜',
    map: '𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛',
  },
  {
    id: 'gothic',
    name: '𝔊𝔬𝔱𝔥𝔦𝔠',
    map: '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷',
  },
  {
    id: 'bold-gothic',
    name: '𝕭𝖔𝖑𝖉 𝕲𝖔𝖙𝖍𝖎𝖈',
    map: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟',
  },
  {
    id: 'mono',
    name: '𝕄𝕠𝕟𝕠',
    map: '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣',
  },
  {
    id: 'spaced',
    name: 'Ｓｐａｃｅｄ',
    map: 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ',
  },
  {
    id: 'small-caps',
    name: 'sᴍᴀʟʟ ᴄᴀᴘs',
    map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ',
  },
  {
    id: 'script',
    name: '𝒮𝒸𝓇𝒾𝓅𝓉',
    map: '𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏',
  },
  {
    id: 'boxed',
    name: '𝓑𝓸𝔁𝓮𝓭',
    map: '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉',
  },
  {
    id: 'combo',
    name: 'C͟o͟m͟b͟o͟',
    map: 'A̲B̲C̲D̲E̲F̲G̲H̲I̲J̲K̲L̲M̲N̲O̲P̲Q̲R̲S̲T̲U̲V̲W̲X̲Y̲Z̲a̲b̲c̲d̲e̲f̲g̲h̲i̲j̲k̲l̲m̲n̲o̲p̲q̲r̲s̲t̲u̲v̲w̲x̲y̲z̲',
  },
]
