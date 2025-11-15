// API Route: Get sent friend requests
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { RelationService } from '$lib/services/relation.service';

// GET /api/relations/sent?userId=xxx - Get friend requests sent by user
export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		if (!userId) {
			return json({ error: 'userId query parameter is required' }, { status: 400 });
		}

		const relationRepo = ServerRepositoryFactory.getRelationRepository();
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const service = new RelationService(relationRepo, userRepo);
		
		const requests = await service.getSentRequests(userId);
		return json(requests);
	} catch (error) {
		console.error('GET /api/relations/sent error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch sent requests' },
			{ status: 500 }
		);
	}
};
