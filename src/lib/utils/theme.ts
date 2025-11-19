import { themes, defaultThemeName, type ThemeMap } from '$lib/config/themes';

function setCssVars(map: ThemeMap) {
  // Guard against server-side rendering where `document` is undefined
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;
  Object.entries(map).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function removeCssVars(map: ThemeMap) {
  // Guard against server-side rendering where `document` is undefined
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;
  Object.keys(map).forEach((key) => {
    root.style.removeProperty(key);
  });
}

export function applyTheme(themeName: string) {
  const theme = themes[themeName];
  if (!theme) {
    console.warn(`[theme] Theme '${themeName}' not found, defaulting to '${defaultThemeName}'`);
    setCssVars(themes[defaultThemeName]);
    return;
  }
  setCssVars(theme);
}

export function resetTheme() {
  // Remove all known token overrides to fallback to :root
  Object.values(themes).forEach((map) => removeCssVars(map));
}
