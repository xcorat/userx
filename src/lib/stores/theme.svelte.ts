import { browser } from '$app/environment';
import { DEFAULT_THEME_ID, getThemeById, THEMES } from '$lib/config/themes.config';
import type { ThemeConfig, ThemeId } from '$lib/types';

const LOCAL_THEME_STORAGE_KEY = 'userx_local_only_theme';

/**
 * Local-only theme store.
 * Intentionally never synced to the user's data ledger or any relay.
 */
class ThemeStore {
	themeId = $state<ThemeId>(DEFAULT_THEME_ID);

	currentTheme = $derived<ThemeConfig>(getThemeById(this.themeId));
	availableThemes = THEMES;

	constructor() {
		if (browser) {
			const saved = localStorage.getItem(LOCAL_THEME_STORAGE_KEY) as ThemeId | null;
			if (saved && THEMES.some((t) => t.id === saved)) {
				this.themeId = saved;
			}
			this.applyToDocument(this.currentTheme);
		}
	}

	setTheme(id: ThemeId) {
		this.themeId = id;
		if (browser) {
			localStorage.setItem(LOCAL_THEME_STORAGE_KEY, id);
			this.applyToDocument(getThemeById(id));
		}
	}

	applyCurrent() {
		if (browser) {
			this.applyToDocument(this.currentTheme);
		}
	}

	private applyToDocument(theme: ThemeConfig) {
		const root = document.documentElement;
		root.dataset.theme = theme.id;
		root.dataset.decoration = theme.decoration;
		root.dataset.colorScheme = theme.colorScheme;
		root.style.colorScheme = theme.colorScheme;

		for (const [token, value] of Object.entries(theme.cssVars)) {
			root.style.setProperty(token, value);
		}

		root.style.setProperty('--font-body', theme.fonts.body);
		root.style.setProperty('--font-display', theme.fonts.display);
		root.style.setProperty('--font-serif-family', theme.fonts.serif);
		root.style.setProperty('--font-mono-family', theme.fonts.mono);

		const themeColorMeta = document.querySelector('meta[name="theme-color"]');
		if (themeColorMeta) {
			themeColorMeta.setAttribute('content', theme.swatches.bg);
		}
	}
}

export const themeStore = new ThemeStore();
