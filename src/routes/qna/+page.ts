import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { appConfig } from '$lib/config/app.config';

export const load = async () => {
	// Only run redirect in browser (localStorage not available on server)
	if (browser) {
		const stored = localStorage.getItem(appConfig.auth.sessionStorageKey);
		const isAuthenticated = !!stored;

		// Redirect authenticated users to /qna/questions
		if (isAuthenticated) {
			throw redirect(307, '/qna/questions');
		}

		// Redirect unauthenticated users to /qna/onboarding
		throw redirect(307, '/qna/onboarding');
	}

	// Server-side: return empty data, client-side load will handle redirect
	return {};
};

