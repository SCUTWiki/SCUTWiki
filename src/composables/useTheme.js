import { ref, watch } from 'vue'

const STORAGE_KEY = 'scutwiki-theme'

function initial() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref('dark')

if (typeof window !== 'undefined') {
  theme.value = initial()
  document.documentElement.dataset.theme = theme.value

  watch(theme, (value) => {
    document.documentElement.dataset.theme = value
    localStorage.setItem(STORAGE_KEY, value)
  })
}

export function useTheme() {
  return {
    theme,
    toggle() {
      theme.value = theme.value === 'dark' ? 'light' : 'dark'
    },
  }
}
