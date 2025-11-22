// Theme names that map to CSS class names
const THEME_CLASSES = ['memeball-theme', 'qna-theme'] as const;
export type ThemeName = 'memeball' | 'qna' | 'default';

/**
 * Get the theme name from the current route pathname
 */
export function getThemeFromRoute(pathname: string): ThemeName {
  if (pathname.startsWith('/memeball')) {
    return 'memeball';
  }
  if (pathname.startsWith('/qna')) {
    return 'qna';
  }
  return 'default';
}

/**
 * Apply a theme by adding the corresponding CSS class to the document element
 */
export function applyTheme(themeName: ThemeName) {
  // Guard against server-side rendering where `document` is undefined
  if (typeof document === 'undefined' || !document.documentElement) return;
  
  const root = document.documentElement;
  
  // Remove all theme classes first
  THEME_CLASSES.forEach(className => {
    root.classList.remove(className);
  });
  
  // Add the new theme class (if not default)
  if (themeName !== 'default') {
    const themeClass = `${themeName}-theme`;
    root.classList.add(themeClass);
  }
}

/**
 * Reset theme by removing all theme classes (fallback to :root default theme)
 */
export function resetTheme() {
  // Guard against server-side rendering where `document` is undefined
  if (typeof document === 'undefined' || !document.documentElement) return;
  
  const root = document.documentElement;
  
  // Remove all theme classes
  THEME_CLASSES.forEach(className => {
    root.classList.remove(className);
  });
}
