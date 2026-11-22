/**
 * 首页 → 其它页面的圆形放大转场
 *
 * 用 View Transitions API：新页面的快照以光标为圆心，用 clip-path 圆形展开，
 * 覆盖旧页面。圆圈里显示的就是目标页面本身（包括它自己的底色）。
 *
 * 不支持 View Transitions 的浏览器、或用户开启“减少动态效果”时，直接普通跳转。
 */
export function installPageTransition(router) {
  if (typeof document === 'undefined' || !document.startViewTransition) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (reducedMotion.matches) return

      const link = event.target.closest?.('a')
      if (!link) return
      if (link.target && link.target !== '_self') return
      if (link.hasAttribute('download')) return

      const href = link.getAttribute('href')
      if (!href || !href.startsWith('/')) return

      // 只在首页出发时生效
      if (router.currentRoute.value.path !== '/') return
      if (router.resolve(href).path === '/') return

      const to = router.resolve(href)
      if (!to.matched.length) return

      const x = event.clientX
      const y = event.clientY
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      // 阻止 RouterLink 自己的跳转，改由转场控制
      event.preventDefault()
      event.stopPropagation()

      const transition = document.startViewTransition(() => router.push(href))

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 520,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          )
        })
        .catch(() => {
          /* 转场失败时页面已经切过去了，忽略即可 */
        })
    },
    true,
  )
}
