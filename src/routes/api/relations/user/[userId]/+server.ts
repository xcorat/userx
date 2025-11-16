// API Route: Relations by User ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/relations/user/[userId] - Get all relations for a user
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { userId } = params;
		
		if (!userId) {
			return json(
				{ error: 'userId is required' },
				{ status: 400 }
			);
		}

		const repo = ServerRepositoryFactory.getRelationRepository();
		const relations = await repo.findByUserId(userId);
		return json(relations);
	} catch (error) {
		console.error('GET /api/relations/user/[userId] error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch user relations' },
			{ status: 500 }
		);
	}
};