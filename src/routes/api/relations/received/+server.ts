// API Route: Get received friend requests
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { RelationService } from '$lib/services/relation.service';

// GET /api/relations/received?userId=xxx - Get friend requests received by user
export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		if (!userId) {
			return json({ error: 'userId query parameter is required' }, { status: 400 });
		}

		const relationRepo = ServerRepositoryFactory.getRelationRepository();
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const service = new RelationService(relationRepo, userRepo);
		
		const requests = await service.getReceivedRequests(userId);
		return json(requests);
	} catch (error) {
		console.error('GET /api/relations/received error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch received requests' },
			{ status: 500 }
		);
	}
};
