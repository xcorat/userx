import type { ThemeConfig, ThemeId } from '$lib/types';

/**
 * Look-and-feel themes for `userx`.
 * Each theme updates color tokens, font families, border radii, and UI decoration mode.
 * Saved strictly locally on the user's device.
 */
export const THEMES: ThemeConfig[] = [
	{
		id: 'obsidian',
		name: 'Obsidian Terminal',
		description: 'High-contrast midnight slate, crisp monospace accents & subtle tactical grid.',
		fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
		headingFont: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
		decoration: 'grid',
		swatches: {
			bg: '#09090b',
			card: '#131318',
			primary: '#22d3ee',
			accent: '#a78bfa',
			fg: '#f4f4f5'
		},
		cssVars: {
			'--background': '#09090b',
			'--foreground': '#f4f4f5',
			'--card': '#131318',
			'--card-foreground': '#f4f4f5',
			'--popover': '#131318',
			'--popover-foreground': '#f4f4f5',
			'--primary': '#22d3ee',
			'--primary-foreground': '#041318',
			'--secondary': '#1e1e26',
			'--secondary-foreground': '#e4e4e7',
			'--muted': '#1c1c24',
			'--muted-foreground': '#a1a1aa',
			'--accent': '#a78bfa',
			'--accent-foreground': '#0f0720',
			'--destructive': '#f43f5e',
			'--border': '#27272f',
			'--input': '#27272f',
			'--ring': '#22d3ee',
			'--radius': '0.5rem'
		}
	},
	{
		id: 'solaris',
		name: 'Solaris Editorial',
		description: 'Warm archival paper, expressive serif headlines & classic bookish framing.',
		fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
		headingFont: "'Georgia', 'Times New Roman', serif",
		decoration: 'editorial',
		swatches: {
			bg: '#faf6ef',
			card: '#ffffff',
			primary: '#d9480f',
			accent: '#2b6cb0',
			fg: '#1f1a17'
		},
		cssVars: {
			'--background': '#faf6ef',
			'--foreground': '#1f1a17',
			'--card': '#ffffff',
			'--card-foreground': '#1f1a17',
			'--popover': '#ffffff',
			'--popover-foreground': '#1f1a17',
			'--primary': '#d9480f',
			'--primary-foreground': '#fffaf5',
			'--secondary': '#f0e8da',
			'--secondary-foreground': '#2d241e',
			'--muted': '#f0e8da',
			'--muted-foreground': '#6e6257',
			'--accent': '#2b6cb0',
			'--accent-foreground': '#ffffff',
			'--destructive': '#c92a2a',
			'--border': '#e2d7c5',
			'--input': '#e2d7c5',
			'--ring': '#d9480f',
			'--radius': '1rem'
		}
	},
	{
		id: 'araliya',
		name: 'Araliya Cosmic',
		description: 'Deep indigo space palette, rounded geometric type & ambient radial aura.',
		fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
		headingFont: "'Inter', ui-sans-serif, system-ui, sans-serif",
		decoration: 'aura',
		swatches: {
			bg: '#070318',
			card: '#120b2e',
			primary: '#00d2a0',
			accent: '#9d4edd',
			fg: '#f8f5ff'
		},
		cssVars: {
			'--background': '#070318',
			'--foreground': '#f8f5ff',
			'--card': '#120b2e',
			'--card-foreground': '#f8f5ff',
			'--popover': '#120b2e',
			'--popover-foreground': '#f8f5ff',
			'--primary': '#00d2a0',
			'--primary-foreground': '#021c15',
			'--secondary': '#1f1547',
			'--secondary-foreground': '#f3edff',
			'--muted': '#1f1547',
			'--muted-foreground': '#b5abd4',
			'--accent': '#9d4edd',
			'--accent-foreground': '#ffffff',
			'--destructive': '#ef4444',
			'--border': '#2e225c',
			'--input': '#2e225c',
			'--ring': '#00d2a0',
			'--radius': '1.25rem'
		}
	},
	{
		id: 'monolith',
		name: 'Monolith Minimal',
		description: 'Pure daylight ink & stone, distraction-free spacing & sharp corners.',
		fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
		headingFont: "ui-sans-serif, system-ui, -apple-system, sans-serif",
		decoration: 'minimal',
		swatches: {
			bg: '#f8fafc',
			card: '#ffffff',
			primary: '#0f172a',
			accent: '#059669',
			fg: '#0f172a'
		},
		cssVars: {
			'--background': '#f8fafc',
			'--foreground': '#0f172a',
			'--card': '#ffffff',
			'--card-foreground': '#0f172a',
			'--popover': '#ffffff',
			'--popover-foreground': '#0f172a',
			'--primary': '#0f172a',
			'--primary-foreground': '#f8fafc',
			'--secondary': '#e2e8f0',
			'--secondary-foreground': '#0f172a',
			'--muted': '#f1f5f9',
			'--muted-foreground': '#475569',
			'--accent': '#059669',
			'--accent-foreground': '#ffffff',
			'--destructive': '#dc2626',
			'--border': '#cbd5e1',
			'--input': '#cbd5e1',
			'--ring': '#0f172a',
			'--radius': '0.375rem'
		}
	}
];

export const DEFAULT_THEME_ID: ThemeId = 'araliya';

export function getThemeById(id: ThemeId): ThemeConfig {
	return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
