// API Route: Relations by User ID and Status
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import type { RelationStatus } from '$lib/models';

// GET /api/relations/user/[userId]/status/[status] - Get relations for a user with specific status
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { userId, status } = params;
		
		if (!userId || !status) {
			return json(
				{ error: 'userId and status are required' },
				{ status: 400 }
			);
		}

		// Validate status
		const validStatuses: RelationStatus[] = ['pending', 'approved', 'rejected'];
		if (!validStatuses.includes(status as RelationStatus)) {
			return json(
				{ error: 'Invalid status. Must be: pending, approved, or rejected' },
				{ status: 400 }
			);
		}

		const repo = ServerRepositoryFactory.getRelationRepository();
		const relations = await repo.findByUserIdAndStatus(userId, status as RelationStatus);
		return json(relations);
	} catch (error) {
		console.error('GET /api/relations/user/[userId]/status/[status] error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch user relations by status' },
			{ status: 500 }
		);
	}
};