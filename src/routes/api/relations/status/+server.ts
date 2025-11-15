// API Route: Get relation status between two users
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { RelationService } from '$lib/services/relation.service';

// GET /api/relations/status?userId=xxx&otherUserId=yyy - Get relation status between users
export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		const otherUserId = url.searchParams.get('otherUserId');
		
		if (!userId || !otherUserId) {
			return json(
				{ error: 'userId and otherUserId query parameters are required' },
				{ status: 400 }
			);
		}

		const relationRepo = ServerRepositoryFactory.getRelationRepository();
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const service = new RelationService(relationRepo, userRepo);
		
		const status = await service.getRelationStatus(userId, otherUserId);
		return json(status);
	} catch (error) {
		console.error('GET /api/relations/status error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch relation status' },
			{ status: 500 }
		);
	}
};
