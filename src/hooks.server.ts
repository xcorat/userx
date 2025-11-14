// SvelteKit Server Hooks
// Initializes server-side resources at app startup
import type { Handle } from '@sveltejs/kit';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

let isInitialized = false;

/**
 * Initialize hook - runs once at app startup
 * Bootstraps database connection and repository factory
 */
const bootstrap: Handle = async ({ event, resolve }) => {
	// Only initialize once at app startup
	if (!isInitialized) {
		isInitialized = true;
		try {
			await ServerRepositoryFactory.initialize(event.platform);
			console.log('[App Bootstrap] Database initialized:', ServerRepositoryFactory.getType());
		} catch (error) {
			console.error('[App Bootstrap] Failed to initialize database:', error);
			throw error;
		}
	}

	const response = await resolve(event);
	return response;
};

export const handle: Handle = bootstrap;
