// Layout load function with auth guard
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { appConfig } from '$lib/config/app.config';

export const load = async ({ url }: { url: URL }) => {
	// Only run auth check in browser
	if (browser) {
		const stored = localStorage.getItem(appConfig.auth.sessionStorageKey);
		const isAuthenticated = !!stored;

		const publicPaths = ['/', '/login', '/signup', '/onboard', '/tests'];
		const isPublicPath = publicPaths.includes(url.pathname);

		// Redirect to landing if not authenticated and trying to access protected route
		if (!isAuthenticated && !isPublicPath) {
			throw redirect(307, '/');
		}

		// Redirect to questions feed if authenticated and trying to access public pages
		if (isAuthenticated && publicPaths.slice(0, 3).includes(url.pathname)) {
			throw redirect(307, '/questions');
		}
	}

	return {};
};
