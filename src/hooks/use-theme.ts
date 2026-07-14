'use client'

import { useTheme } from 'next-themes'

export function useAppTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  return { theme, setTheme, resolvedTheme, isDark: resolvedTheme === 'dark' }
}
