// Theme token maps for programmatic application
// Single source of truth for all theme definitions
// Each theme maps CSS variable names to color values
export type ThemeMap = Record<string, string>;

export const themes: Record<string, ThemeMap> = {
  default: {
    '--background': 'oklch(1 0 0)',
    '--foreground': 'oklch(0.129 0.042 264.695)',
    '--card': 'oklch(1 0 0)',
    '--card-foreground': 'oklch(0.129 0.042 264.695)',
    '--popover': 'oklch(1 0 0)',
    '--popover-foreground': 'oklch(0.129 0.042 264.695)',
    '--primary': 'oklch(0.208 0.042 265.755)',
    '--primary-foreground': 'oklch(0.984 0.003 247.858)',
    '--secondary': 'oklch(0.968 0.007 247.896)',
    '--secondary-foreground': 'oklch(0.208 0.042 265.755)',
    '--muted': 'oklch(0.968 0.007 247.896)',
    '--muted-foreground': 'oklch(0.554 0.046 257.417)',
    '--accent': 'oklch(0.968 0.007 247.896)',
    '--accent-foreground': 'oklch(0.208 0.042 265.755)',
    '--destructive': 'oklch(0.577 0.245 27.325)',
    '--destructive-foreground': 'oklch(0.984 0.003 247.858)',
    '--border': 'oklch(0.929 0.013 255.508)',
    '--input': 'oklch(0.929 0.013 255.508)',
    '--ring': 'oklch(0.704 0.04 256.788)'
  },
  memeball: {
    '--background': '#040014',
    '--foreground': '#f8f5ff',
    '--card': '#0a0020',
    '--card-foreground': '#f8f5ff',
    '--popover': '#0a0020',
    '--popover-foreground': '#f8f5ff',
    '--primary': '#00b894',
    '--primary-foreground': '#ffffff',
    '--secondary': '#2b2b3b',
    '--secondary-foreground': '#f8f5ff',
    '--muted': '#2b2b3b',
    '--muted-foreground': '#bfbdd6',
    '--accent': '#7b2cbf',
    '--accent-foreground': '#ffffff',
    '--destructive': '#ef4444',
    '--destructive-foreground': '#ffffff',
    '--border': '#2b2b3b',
    '--input': '#2b2b3b',
    '--ring': '#6e00b9'
  },
  qna: {
    '--background': '#ffffff',
    '--foreground': '#111827',
    '--card': '#ffffff',
    '--card-foreground': '#111827',
    '--popover': '#ffffff',
    '--popover-foreground': '#111827',
    '--primary': '#2563eb',
    '--primary-foreground': '#ffffff',
    '--secondary': '#f3f4f6',
    '--secondary-foreground': '#111827',
    '--muted': '#f3f4f6',
    '--muted-foreground': '#6b7280',
    '--accent': '#059669',
    '--accent-foreground': '#ffffff',
    '--destructive': '#ef4444',
    '--destructive-foreground': '#ffffff',
    '--border': '#e5e7eb',
    '--input': '#e5e7eb',
    '--ring': '#60a5fa'
  }
};

export const defaultThemeName = 'default';
