/**
 * 小句子
 *
 * 首页与个人页顶部随机展示一句，替代原来固定的「小筑」。
 *
 * 语料按语种分组，各自独立——**不做直译**。中英对「温柔」的表达方式不同，
 * 逐句对应会两头不讨好：中文的「辛苦了」直译成 "You've worked hard" 在
 * 英文里更像评价而非体恤。
 *
 * 撰写约束（与品牌「不会催促你必须完美」一致）：
 * - 不催促：不出现「加油」「坚持」「别放弃」这类鼓劲
 * - 不评判：不出现「很棒」「真厉害」这类打分
 * - 不说教：不出现「应该」「必须」
 * - 不使用感叹号——语气重一分就变成了压力
 * - 篇幅短，一行读完
 *
 * 这些是「陪伴」而非「激励」，两者在语感上差别很大。
 */

import type { Locale } from './types'

export const WHISPERS: Record<Locale, readonly string[]> = {
  'zh-CN': [
    '慢慢来，不急',
    '今天也辛苦了',
    '喝口水吧',
    '一小步也算数',
    '记得抬头看看天',
    '你已经做得够多了',
    '歇一会儿也没关系',
    '天气好的话，出去走走',
    '不用什么都做完',
    '有在好好生活呢',
    '想做什么就做什么',
    '这里随时都在',
    '坐一会儿，发发呆',
    '明天再说也不迟',
  ],
  en: [
    'Take your time',
    'You did enough today',
    'Have some water',
    'Small steps count',
    'Look up for a moment',
    'You are doing fine',
    'A break is allowed',
    'Go outside if the weather is kind',
    'You do not have to finish everything',
    'You are taking care of yourself',
    'Do whatever you feel like',
    'I will be right here',
    'Sit for a while and do nothing',
    'Tomorrow works too',
  ],
}

/**
 * 取一句。startIndex 由调用方提供——
 * 本模块不调用 Math.random，以便同一会话内稳定、也便于测试。
 */
export function whisperAt(locale: Locale, startIndex: number): string {
  const list = WHISPERS[locale]
  return list[startIndex % list.length]
}
