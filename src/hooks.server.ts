// SvelteKit Server Hooks
// Initializes server-side resources at app startup
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

let isInitialized = false;

/**
 * Initialize hook - runs once at app startup
 * Bootstraps database connection and repository factory
 */
async function bootstrap({ event, resolve }) {
	// Only initialize once at app startup
	if (!isInitialized) {
		isInitialized = true;
		try {
			ServerRepositoryFactory.initialize(event.platform);
			console.log('[App Bootstrap] Database initialized:', ServerRepositoryFactory.getType());
		} catch (error) {
			console.error('[App Bootstrap] Failed to initialize database:', error);
			throw error;
		}
	}

	const response = await resolve(event);
	return response;
}

/**
 * Handle hook - runs on every request after bootstrap
 * Ensures factory is ready for all requests
 */
async function requestHandler({ event, resolve }) {
	// Factory is already initialized, just ensure it's ready
	if (!isInitialized) {
		ServerRepositoryFactory.initialize(event.platform);
		isInitialized = true;
	}

	const response = await resolve(event);
	return response;
}

export const handle: Handle = sequence(bootstrap, requestHandler);
