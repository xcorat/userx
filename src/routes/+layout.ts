// Layout load function with auth guard
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { appConfig } from '$lib/config/app.config';

export const load = async ({ url }: { url: URL }) => {
	// Only run auth check in browser
	if (browser) {
		const stored = localStorage.getItem(appConfig.auth.sessionStorageKey);
		const isAuthenticated = !!stored;

		// Public paths list (root paths). Subpaths are allowed if they match a public root.
		// For example, '/tests' should cover '/tests/credentials' too.
		const publicPaths = ['/', '/login', '/signup', '/onboard', '/tests', '/about', '/memeball/transmission'];
		const isPublicPath = publicPaths.some(
			(p) => url.pathname === p || url.pathname.startsWith(`${p}/`)
		);

		// memeball itself is a public path, but not its children other than transmission
		const isMemeBallEntry = url.pathname === '/memeball'; 

		// Redirect to landing if not authenticated and trying to access protected route
		if (!isAuthenticated && !isPublicPath && !isMemeBallEntry) {
			throw redirect(307, '/');
		}

		// No automatic redirect for authenticated users - let them choose the app section
		// Remove the automatic redirect to /questions
	}

	return {};
};
