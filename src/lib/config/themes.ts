// Theme token maps for programmatic application
// Each theme maps CSS variable names to color values
export type ThemeMap = Record<string, string>;

export const themes: Record<string, ThemeMap> = {
  default: {
    '--background': 'oklch(1 0 0)',
    '--foreground': 'oklch(0.129 0.042 264.695)',
    '--primary': 'oklch(0.208 0.042 265.755)',
    '--primary-foreground': 'oklch(0.984 0.003 247.858)',
    '--accent': 'oklch(0.968 0.007 247.896)',
    '--accent-foreground': 'oklch(0.208 0.042 265.755)',
    '--muted': 'oklch(0.968 0.007 247.896)',
    '--muted-foreground': 'oklch(0.554 0.046 257.417)',
    '--destructive': 'oklch(0.577 0.245 27.325)',
    '--ring': 'oklch(0.704 0.04 256.788)'
  },
  memeball: {
    '--background': '#040014',
    '--foreground': '#f8f5ff',
    '--primary': '#00b894',
    '--primary-foreground': '#ffffff',
    '--accent': '#7b2cbf',
    '--accent-foreground': '#ffffff',
    '--muted': '#2b2b3b',
    '--muted-foreground': '#bfbdd6',
    '--destructive': '#ef4444',
    '--ring': '#6e00b9'
  },
  qna: {
    '--background': '#ffffff',
    '--foreground': '#111827',
    '--primary': '#2563eb',
    '--primary-foreground': '#ffffff',
    '--accent': '#059669',
    '--accent-foreground': '#ffffff',
    '--muted': '#f3f4f6',
    '--muted-foreground': '#6b7280',
    '--destructive': '#ef4444',
    '--ring': '#60a5fa'
  }
};

export const defaultThemeName = 'default';
