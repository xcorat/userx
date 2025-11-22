import { themes } from '$lib/config/themes';

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
 * This approach uses CSS classes defined in app.css that match themes.ts
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
 * Apply theme programmatically by setting CSS variables directly
 * This is an alternative to using CSS classes and allows dynamic theme application
 * without requiring CSS class definitions in app.css
 */
export function applyThemeDynamic(themeName: ThemeName) {
  // Guard against server-side rendering where `document` is undefined
  if (typeof document === 'undefined' || !document.documentElement) return;
  
  const theme = themes[themeName];
  if (!theme) return;
  
  const root = document.documentElement;
  
  // Apply each CSS variable from the theme
  Object.entries(theme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
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
