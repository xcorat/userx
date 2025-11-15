// API Route: Get user's friends
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { RelationService } from '$lib/services/relation.service';

// GET /api/relations/friends?userId=xxx - Get user's friends (approved relations)
export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		if (!userId) {
			return json({ error: 'userId query parameter is required' }, { status: 400 });
		}

		const relationRepo = ServerRepositoryFactory.getRelationRepository();
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const service = new RelationService(relationRepo, userRepo);
		
		const friends = await service.getFriends(userId);
		return json(friends);
	} catch (error) {
		console.error('GET /api/relations/friends error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch friends' },
			{ status: 500 }
		);
	}
};
