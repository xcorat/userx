// API Route: Relations Between Two Users
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/relations/between/[fromUserId]/[toUserId] - Get relation between two specific users
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { fromUserId, toUserId } = params;
		
		if (!fromUserId || !toUserId) {
			return json(
				{ error: 'fromUserId and toUserId are required' },
				{ status: 400 }
			);
		}

		const repo = ServerRepositoryFactory.getRelationRepository();
		const relation = await repo.findByUsers(fromUserId, toUserId);
		
		if (!relation) {
			return json(
				{ error: 'Relation not found' },
				{ status: 404 }
			);
		}

		return json(relation);
	} catch (error) {
		console.error('GET /api/relations/between/[fromUserId]/[toUserId] error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch relation between users' },
			{ status: 500 }
		);
	}
};