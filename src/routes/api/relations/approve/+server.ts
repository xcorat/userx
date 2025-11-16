// API Route: Approve friend request
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { RelationService } from '$lib/services/relation.service';

// POST /api/relations/approve - Approve friend request
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
		
		const relation = await service.approveRequest(userId, relationId);
		return json(relation);
	} catch (error) {
		console.error('POST /api/relations/approve error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to approve request' },
			{ status: 400 }
		);
	}
};
