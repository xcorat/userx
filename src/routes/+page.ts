import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { appConfig } from '$lib/config/app.config';

export const load = async () => {
	// Only check authentication in browser
	if (browser) {
		const stored = localStorage.getItem(appConfig.auth.sessionStorageKey);
		const isAuthenticated = !!stored;

		// Redirect unauthenticated users to welcome screen
		if (!isAuthenticated) {
			throw redirect(307, '/welcome');
		}
	}

	return {};
};

