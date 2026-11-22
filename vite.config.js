import { fileURLToPath, URL, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * 开发时监听 src/content 下的 Markdown 文件，
 * 改完自动重新生成 src/data/content.json 并刷新页面。
 */
function contentWatcher() {
  let timer = null

  return {
    name: 'scutwiki-content-watch',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root
      const contentDir = resolve(root, 'src/content').replace(/\\/g, '/')

      async function regenerate() {
        const script = pathToFileURL(resolve(root, 'scripts/gen-content.mjs')).href
        try {
          // 加时间戳绕过 ESM 缓存，让脚本重新执行
          await import(`${script}?t=${Date.now()}`)
          server.ws.send({ type: 'full-reload' })
        } catch (error) {
          server.config.logger.error(`[content] 生成失败：${error}`)
        }
      }

      server.watcher.add(contentDir)
      server.watcher.on('all', (event, file) => {
        const normalized = String(file).replace(/\\/g, '/')
        if (!normalized.startsWith(contentDir) || !normalized.endsWith('.md')) return
        clearTimeout(timer)
        timer = setTimeout(regenerate, 120)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    contentWatcher(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
