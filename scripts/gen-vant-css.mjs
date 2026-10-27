#!/usr/bin/env node
/* eslint-disable no-console -- 这是命令行脚本，输出本来就该走 stdout/stderr */
/**
 * 生成 app/assets/styles/vant.css —— Vant 按需样式清单
 *
 * 用法：
 *   node scripts/gen-vant-css.mjs           生成（内容无变化时不写盘）
 *   node scripts/gen-vant-css.mjs --check   只校验，不一致 exit 1（CI 用）
 *
 * 为什么要有这个脚本：清单是 28 条 @import，手写必漏。而且「漏」不会报错——
 * 组件照样渲染，只是样式缺了（例如 dialog 依赖 action-bar 的样式，但项目里
 * 从没 import 过 ActionBar，手写清单不可能想到这一条）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIRS = ['app'] // 只扫客户端源码：server/ 不产出样式
const VANT_ES = path.join(ROOT, 'node_modules/vant/es')
const OUT_FILE = path.join(ROOT, 'app/assets/styles/vant.css')
const CHECK_ONLY = process.argv.includes('--check')

/**
 * 函数式 API 不是组件，按 PascalCase→kebab 会转成 show-toast 这种不存在的目录，
 * 必须显式映射到实际承载样式的组件目录。
 */
const FN_TO_DIR = {
  showToast: 'toast',
  showLoadingToast: 'toast',
  showSuccessToast: 'toast',
  showFailToast: 'toast',
  closeToast: 'toast',
  showConfirmDialog: 'dialog',
  showDialog: 'dialog',
  closeDialog: 'dialog',
  showNotify: 'notify',
  closeNotify: 'notify',
  showImagePreview: 'image-preview',
}

const kebab = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** 递归收集源码里从 'vant' 导入的标识符 */
function scanImportedNames() {
  const names = new Set()
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!/\.(vue|ts|mts|js|mjs)$/.test(entry.name)) {
        continue
      }
      const text = fs.readFileSync(full, 'utf8')
      // 具名导入（跨行也能匹配；import type { X } 不会命中，类型没有样式）
      for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*'vant'/g)) {
        for (const raw of m[1].split(',')) {
          const name = raw.trim().split(/\s+as\s+/)[0].trim()
          if (name) {
            names.add(name)
          }
        }
      }
      // 深导入：import { Button } from 'vant/es/button'
      for (const m of text.matchAll(/from\s*'vant\/es\/([\w-]+)'/g)) {
        names.add(`__deep__${m[1]}`)
      }
    }
  }
  for (const dir of SRC_DIRS) {
    const abs = path.join(ROOT, dir)
    if (fs.existsSync(abs)) {
      walk(abs)
    }
  }
  return names
}

/** 名字 → 组件样式目录（返回 null 表示该名字没有独立样式） */
function dirOf(name) {
  if (name.startsWith('__deep__')) {
    return name.slice('__deep__'.length)
  }
  const dir = FN_TO_DIR[name] ?? kebab(name)
  return fs.existsSync(path.join(VANT_ES, dir, 'style/index.mjs')) ? dir : null
}

/** 从某个组件样式入口递归展开 @import，得到 css 绝对路径（父在前、依赖在后、去重） */
function expandCss(entryMjs, seen, out) {
  const text = fs.readFileSync(entryMjs, 'utf8')
  for (const m of text.matchAll(/import\s*['"]([^'"]+\.css)['"]/g)) {
    collectCss(path.join(path.dirname(entryMjs), m[1]), seen, out)
  }
}

function collectCss(cssPath, seen, out) {
  const abs = path.resolve(cssPath)
  if (seen.has(abs) || !fs.existsSync(abs)) {
    return
  }
  seen.add(abs)
  out.push(abs)
  const text = fs.readFileSync(abs, 'utf8')
  for (const m of text.matchAll(/@import\s+['"]([^'"]+\.css)['"]/g)) {
    collectCss(path.join(path.dirname(abs), m[1]), seen, out)
  }
}

function build() {
  const names = scanImportedNames()
  const dirs = new Set()
  const unknown = []
  for (const name of names) {
    const dir = dirOf(name)
    if (dir) {
      dirs.add(dir)
    }
    else {
      unknown.push(name)
    }
  }

  // 排序保证确定性：同样输入 → 同样字节，否则每次 diff 都是噪音
  const sortedDirs = [...dirs].sort()
  const seen = new Set()
  const collected = []
  for (const dir of sortedDirs) {
    expandCss(path.join(VANT_ES, dir, 'style/index.mjs'), seen, collected)
  }

  // base.css 必须第一个：它定义 CSS 变量与 reset，是其余样式的基线
  const rel = collected.map(p => path.posix.join('vant/es', path.relative(VANT_ES, p).split(path.sep).join('/')))
  const isBase = p => p === 'vant/es/style/base.css'
  const ordered = [...rel.filter(isBase), ...rel.filter(p => !isBase(p))]

  const bytes = collected.reduce((sum, p) => sum + fs.statSync(p).size, 0)
  return { ordered, bytes, componentCount: sortedDirs.length, unknown }
}

function render({ ordered, bytes, componentCount }) {
  const kb = (bytes / 1024).toFixed(1)
  const lines = ordered.map(p => `@import '${p}';`).join('\n')
  return `/* ⚠️ 此文件由 scripts/gen-vant-css.mjs 自动生成，请勿手动编辑
 *
 * 重新生成：npm run gen:vant
 * 校验（CI 会跑，不一致即 fail）：node scripts/gen-vant-css.mjs --check
 *
 * 内容来源：扫描 app/ 下所有 import { X } from 'vant'，解析每个组件的
 * node_modules/vant/es/<组件>/style/index.mjs，再对 css 之间的 @import 递归展开去重。
 * 当前 ${componentCount} 个组件 → ${ordered.length} 个 css 文件 / ${kb} KB
 *（全量 vant/lib/index.css 是 195 KB）。
 *
 * 为什么聚成一个文件，而不是在 nuxt.config 的 css 数组里逐条列：
 * nuxt.config 里写 node_modules 内的路径时，Nuxt dev 会把同一文件注入成
 * 「/@fs/D:/...」和「/D:/...」两个 URL，浏览器下载两遍（28 个文件 → 56 个请求）。
 * 项目内文件走 ~/ alias 只注入一次，所以在这里聚合。
 *
 * 为什么不用 unplugin-vue-components + VantResolver 自动按需：
 * 那套在 Vite 8 的 dev SSR 下失效过，且 noExternal 把依赖塞进 worker 导致 OOM（10-25 回滚）。
 *
 * @import 必须置顶（CSS 规范），base.css 必须第一个（变量与 reset 是其余样式的前提）。
 */
${lines}
`
}

function main() {
  if (!fs.existsSync(VANT_ES)) {
    console.error('✗ 找不到 node_modules/vant，请先 npm install')
    process.exit(1)
  }

  const result = build()
  if (result.ordered.length === 0) {
    console.error('✗ 没扫到任何 Vant 组件，拒绝生成空清单（检查 SRC_DIRS 或导入写法）')
    process.exit(1)
  }
  if (result.unknown.length) {
    console.warn(`⚠ 这些名字没有找到样式入口，已跳过：${result.unknown.join(', ')}`)
  }

  const next = render(result)
  const prev = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : ''

  if (CHECK_ONLY) {
    if (next === prev) {
      console.log(`✓ Vant 样式清单是最新的（${result.ordered.length} 个文件）`)
      return
    }
    const prevLines = new Set(prev.match(/@import '[^']+'/g) ?? [])
    const nextLines = new Set(next.match(/@import '[^']+'/g) ?? [])
    const missing = [...nextLines].filter(l => !prevLines.has(l))
    const extra = [...prevLines].filter(l => !nextLines.has(l))
    console.error('✗ Vant 样式清单与源码不一致，请运行：npm run gen:vant')
    if (missing.length) {
      console.error(`  缺少 ${missing.length} 条：`)
      missing.forEach(l => console.error(`    + ${l}`))
    }
    if (extra.length) {
      console.error(`  多余 ${extra.length} 条：`)
      extra.forEach(l => console.error(`    - ${l}`))
    }
    if (!missing.length && !extra.length) {
      console.error('  （条目相同但顺序不同）')
    }
    process.exit(1)
  }

  if (next === prev) {
    console.log(`✓ 无变化（${result.ordered.length} 个文件 / ${(result.bytes / 1024).toFixed(1)} KB）`)
    return
  }
  fs.writeFileSync(OUT_FILE, next, 'utf8')
  console.log(`✓ 已写入 app/assets/styles/vant.css（${result.ordered.length} 个文件 / ${(result.bytes / 1024).toFixed(1)} KB）`)
}

main()
