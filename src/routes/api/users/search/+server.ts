// API Route: Search users by query
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/users/search?q=query - Search users by username, email, or name
export const GET: RequestHandler = async ({ url }) => {
	try {
		const query = url.searchParams.get('q');
		
		if (!query?.trim()) {
			return json([]);
		}

		const repo = ServerRepositoryFactory.getUserRepository();
		const users = await repo.searchUsers(query);
		
		return json(users);
	} catch (error) {
		console.error('GET /api/users/search error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to search users' },
			{ status: 500 }
		);
	}
};