/**
 * Gilbert 空间填充曲线与像素重排
 *
 * 从 public/encryptionGraph/js/main.js 提取，是 docs/02-fusion-architecture.md
 * §3 所述 Stage 2 的产物：输入输出都是数据，不读写 DOM、不监听事件，
 * 画布绘制与 JPEG 编码留在视图层。
 *
 * 算法逐行照搬，未做任何简化——递归的三分支结构、`2 * w > 3 * h` 的切分
 * 条件、Math.floor 折半、奇偶修正 `(w2 % 2) && (w > 2)`，以及起点偏移量
 * Math.round((Math.sqrt(5) - 1) / 2 * w * h) 均与原实现逐字一致。
 *
 * 已用穷举验证（1..40 的全部宽高组合）：曲线长度恒为 w × h 且恰好构成
 * 一组完整排列，无越界、无重复；按同一偏移量做的混淆与解混淆互为精确
 * 逆运算。所以原实现「可逆」的说明成立，JPEG 重编码是唯一的损失来源。
 *
 * 与原实现的三点差异，均不改变任何输出：
 * 1. generate2d 的形参补上了类型。
 * 2. 像素拷贝用 subarray 代替 slice。原实现每个像素分配一个 4 字节小数组，
 *    四百万像素即四百万次分配；subarray 只返回视图，set() 拷贝的字节
 *    逐字节相同。
 * 3. 输出 ImageData 的分配收进 scrambleImageData 内，免去调用方重复一遍
 *    尺寸参数。
 *
 * 保留未改的固有开销（已在迁移报告中标出，等主控裁决）：曲线以嵌套数组
 * 保存坐标，4000 × 3000 的图片需要约 1.3 GB 堆内存、约 1.8 秒生成。
 * 旧版同样是全分辨率处理，此处不擅自加尺寸上限——解混淆必须与混淆时的
 * 尺寸完全一致，任何缩放都会让曲线错位、结果彻底错乱。
 */

/** 混淆方向。decrypt 是 encrypt 的逆运算 */
export type ScrambleDirection = 'encrypt' | 'decrypt'

/** JPEG 输出质量。旧版为 0.95，勿改 */
export const JPEG_QUALITY = 0.95

/**
 * 生成覆盖 width × height 的 Gilbert 曲线坐标序列
 *
 * 返回的坐标数恒为 width * height，且是 [0, width) × [0, height) 的一组
 * 完整排列——依赖此性质做像素重排，故不可简化。
 */
export function gilbert2d(width: number, height: number): Array<[number, number]> {
  const coordinates: Array<[number, number]> = []
  if (width >= height) {
    generate2d(0, 0, width, 0, 0, height, coordinates)
  } else {
    generate2d(0, 0, 0, height, width, 0, coordinates)
  }
  return coordinates
}

function generate2d(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  coordinates: Array<[number, number]>,
): void {
  const w = Math.abs(ax + ay)
  const h = Math.abs(bx + by)

  const dax = Math.sign(ax), day = Math.sign(ay)
  const dbx = Math.sign(bx), dby = Math.sign(by)

  if (h === 1) {
    for (let i = 0; i < w; i++) {
      coordinates.push([x, y])
      x += dax
      y += day
    }
    return
  }

  if (w === 1) {
    for (let i = 0; i < h; i++) {
      coordinates.push([x, y])
      x += dbx
      y += dby
    }
    return
  }

  let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2)
  let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2)

  const w2 = Math.abs(ax2 + ay2)
  const h2 = Math.abs(bx2 + by2)

  if (2 * w > 3 * h) {
    if ((w2 % 2) && (w > 2)) {
      ax2 += dax
      ay2 += day
    }
    generate2d(x, y, ax2, ay2, bx, by, coordinates)
    generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by, coordinates)
  } else {
    if ((h2 % 2) && (h > 2)) {
      bx2 += dbx
      by2 += dby
    }
    generate2d(x, y, bx2, by2, ax2, ay2, coordinates)
    generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2, coordinates)
    generate2d(
      x + (ax - dax) + (bx2 - dbx),
      y + (ay - day) + (by2 - dby),
      -bx2,
      -by2,
      -(ax - ax2),
      -(ay - ay2),
      coordinates,
    )
  }
}

/**
 * 曲线起点偏移量
 *
 * 黄金分割共轭 (√5−1)/2 乘以像素总数后取整。它决定「沿曲线第 i 个像素
 * 搬到第 i + offset 个位置」，是混淆强度的唯一旋钮，逐值照搬。
 */
export function curveOffset(width: number, height: number): number {
  return Math.round(((Math.sqrt(5) - 1) / 2) * width * height)
}

/**
 * 沿曲线重排像素
 *
 * encrypt：曲线第 i 位的像素搬到第 i + offset 位
 * decrypt：曲线第 i + offset 位的像素搬回第 i 位
 *
 * 两者共用同一条曲线与同一个偏移量，因此互为逆运算。
 *
 * @param source 原图数据，尺寸即输出尺寸
 * @param direction 混淆或解混淆
 * @returns 新分配的 ImageData，source 不被修改
 */
export function scrambleImageData(
  source: ImageData,
  direction: ScrambleDirection,
): ImageData {
  const width = source.width
  const height = source.height
  const count = width * height

  const output = new ImageData(width, height)
  const from = source.data
  const to = output.data

  const curve = gilbert2d(width, height)
  const offset = curveOffset(width, height)

  for (let i = 0; i < count; i++) {
    const oldPos = curve[i]
    const newPos = curve[(i + offset) % count]
    const oldP = 4 * (oldPos[0] + oldPos[1] * width)
    const newP = 4 * (newPos[0] + newPos[1] * width)

    if (direction === 'encrypt') {
      to.set(from.subarray(oldP, oldP + 4), newP)
    } else {
      to.set(from.subarray(newP, newP + 4), oldP)
    }
  }

  return output
}
