// Layout load function with auth guard
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { appConfig } from '$lib/config/app.config';

export const load = async ({ url }: { url: URL }) => {
	// Only run auth check in browser
	if (browser) {
		const stored = localStorage.getItem(appConfig.auth.sessionStorageKey);
		const isAuthenticated = !!stored;

		// Handle redirects for unauthenticated users
		if (!isAuthenticated) {
			// Redirect /memeball to /memeball/transmission
			if (url.pathname === '/memeball') {
				throw redirect(307, '/memeball/transmission');
			}
			
			// Note: /qna redirect is now handled by /qna/+page.ts
		}

		// Public paths list (root paths). Subpaths are allowed if they match a public root.
		// For example, '/tests' should cover '/tests/credentials' too.
		const publicPaths = ['/welcome', '/login', '/signup', '/tests', '/about', '/memeball/transmission', '/qna/onboarding'];
		const isPublicPath = publicPaths.some(
			(p) => url.pathname === p || url.pathname.startsWith(`${p}/`)
		);

		// Redirect to welcome screen if not authenticated and trying to access protected route
		if (!isAuthenticated && !isPublicPath) {
			throw redirect(307, '/welcome');
		}

		// No automatic redirect for authenticated users - let them choose the app section
		// Remove the automatic redirect to /questions
	}

	return {};
};
