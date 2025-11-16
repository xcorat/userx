// API Route: Reject friend request
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { RelationService } from '$lib/services/relation.service';

// POST /api/relations/reject - Reject friend request
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, relationId } = await request.json();
		
		if (!userId || !relationId) {
			return json(
				{ error: 'userId and relationId are required' },
				{ status: 400 }
			);
		}

		const relationRepo = ServerRepositoryFactory.getRelationRepository();
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const service = new RelationService(relationRepo, userRepo);
		
		const relation = await service.rejectRequest(userId, relationId);
		return json(relation);
	} catch (error) {
		console.error('POST /api/relations/reject error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to reject request' },
			{ status: 400 }
		);
	}
};
