// SvelteKit Server Hooks
// Initializes server-side resources at app startup
import type { Handle } from '@sveltejs/kit';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

/**
 * Handle hook runs on every server request
 * We use it to initialize the repository factory once with the platform context
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Initialize repository factory with platform environment (D1 or SQLite)
	// This only needs to be done once, but calling it multiple times is safe
	ServerRepositoryFactory.initialize(event.platform);

	// Continue with request handling
	const response = await resolve(event);
	return response;
};
