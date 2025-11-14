// API Route: Find user by username
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/users/username/[username] - Find user by username
export const GET: RequestHandler = async ({ params }) => {
	try {
		const username = decodeURIComponent(params.username);
		const repo = ServerRepositoryFactory.getUserRepository();
		const user = await repo.findByUsername(username);
		
		if (!user) {
			return json({ exists: false }, { status: 200 });
		}
		
		return json({ exists: true, user });
	} catch (error) {
		console.error(`GET /api/users/username/${params.username} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to check username' },
			{ status: 500 }
		);
	}
};
