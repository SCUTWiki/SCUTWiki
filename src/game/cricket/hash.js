// 稳定哈希与可复现随机数：词条编译、战斗种子都依赖它。
// 不依赖平台随机源，同一个输入在任何浏览器里都会得到同一结果。

export function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function hashString(str) {
  return fnv1a(String(str))
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeRng(seed) {
  const next = mulberry32(seed)
  return {
    next,
    range(min, max) {
      return min + (max - min) * next()
    },
    int(min, max) {
      return Math.floor(min + (max - min + 1) * next())
    },
    pick(list) {
      return list[Math.floor(next() * list.length)]
    },
    chance(p) {
      return next() < p
    },
  }
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function round1(value) {
  return Math.round(value * 10) / 10
}

export function round2(value) {
  return Math.round(value * 100) / 100
}
