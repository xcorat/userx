import type { ThemeConfig, ThemeId } from '$lib/types';

/**
 * Look-and-feel themes for `userx`.
 * Each theme updates color tokens, font families, border radii, and UI decoration mode.
 * Saved strictly locally on the user's device.
 */
export const THEMES: ThemeConfig[] = [
	{
		id: 'forest',
		name: 'Forest Dark',
		description: 'Deep canopy slate, botanical emerald highlights & warm golden-hour accents.',
		colorScheme: 'dark',
		fonts: {
			body: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
			display: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif",
			serif: "'Fraunces', Georgia, 'Times New Roman', serif",
			mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			preview: 'Inter + Plus Jakarta Sans'
		},
		decoration: 'aura',
		swatches: {
			bg: '#08120e',
			card: '#0f1f18',
			primary: '#34d399',
			accent: '#f59e0b',
			fg: '#ecfdf5'
		},
		cssVars: {
			'--background': '#08120e',
			'--foreground': '#ecfdf5',
			'--card': '#0f1f18',
			'--card-foreground': '#ecfdf5',
			'--popover': '#0f1f18',
			'--popover-foreground': '#ecfdf5',
			'--primary': '#34d399',
			'--primary-foreground': '#032015',
			'--secondary': '#162b22',
			'--secondary-foreground': '#d1fae5',
			'--muted': '#14271f',
			'--muted-foreground': '#9ab8ab',
			'--accent': '#f59e0b',
			'--accent-foreground': '#1c1002',
			'--destructive': '#ef4444',
			'--border': '#213d31',
			'--input': '#213d31',
			'--ring': '#34d399',
			'--radius': '1rem'
		}
	},
	{
		id: 'obsidian',
		name: 'Obsidian Terminal',
		description: 'High-contrast midnight slate, crisp monospace accents & subtle tactical grid.',
		colorScheme: 'dark',
		fonts: {
			body: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
			display: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			serif: "'Fraunces', Georgia, 'Times New Roman', serif",
			mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			preview: 'Inter + JetBrains Mono'
		},
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
		colorScheme: 'light',
		fonts: {
			body: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
			display: "'Fraunces', Georgia, 'Times New Roman', serif",
			serif: "'Fraunces', Georgia, 'Times New Roman', serif",
			mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			preview: 'Plus Jakarta Sans + Fraunces'
		},
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
		colorScheme: 'dark',
		fonts: {
			body: "'Inter', ui-sans-serif, system-ui, sans-serif",
			display: "'Inter', ui-sans-serif, system-ui, sans-serif",
			serif: "'Fraunces', Georgia, 'Times New Roman', serif",
			mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			preview: 'Inter'
		},
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
		colorScheme: 'light',
		fonts: {
			body: "ui-sans-serif, system-ui, -apple-system, sans-serif",
			display: "ui-sans-serif, system-ui, -apple-system, sans-serif",
			serif: "Georgia, 'Times New Roman', serif",
			mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
			preview: 'System UI'
		},
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
	},
	{
		id: 'friendly',
		name: 'Soft & Friendly',
		description: 'Warm, approachable type with rounded headings and a calm mint palette.',
		colorScheme: 'dark',
		fonts: {
			body: "'Nunito', ui-sans-serif, system-ui, sans-serif",
			display: "'Fredoka', 'Nunito', ui-sans-serif, system-ui, sans-serif",
			serif: "'Fraunces', Georgia, 'Times New Roman', serif",
			mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			preview: 'Nunito + Fredoka'
		},
		decoration: 'aura',
		swatches: {
			bg: '#101a1a',
			card: '#192727',
			primary: '#5eead4',
			accent: '#fbbf24',
			fg: '#ecfdfb'
		},
		cssVars: {
			'--background': '#101a1a',
			'--foreground': '#ecfdfb',
			'--card': '#192727',
			'--card-foreground': '#ecfdfb',
			'--popover': '#192727',
			'--popover-foreground': '#ecfdfb',
			'--primary': '#5eead4',
			'--primary-foreground': '#062a27',
			'--secondary': '#203432',
			'--secondary-foreground': '#d5fffa',
			'--muted': '#1b302f',
			'--muted-foreground': '#a8c8c4',
			'--accent': '#fbbf24',
			'--accent-foreground': '#241902',
			'--destructive': '#fb7185',
			'--border': '#31504c',
			'--input': '#31504c',
			'--ring': '#5eead4',
			'--radius': '1.25rem'
		}
	}
];

export const DEFAULT_THEME_ID: ThemeId = 'forest';

export function getThemeById(id: ThemeId): ThemeConfig {
	return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
