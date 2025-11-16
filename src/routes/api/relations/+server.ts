// API Route: Relations
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { RelationService } from '$lib/services/relation.service';

// Helper to get relation service
function getRelationService() {
	const relationRepo = ServerRepositoryFactory.getRelationRepository();
	const userRepo = ServerRepositoryFactory.getUserRepository();
	return new RelationService(relationRepo, userRepo);
}

// GET /api/relations - List all relations (for debugging)
export const GET: RequestHandler = async () => {
	try {
		const repo = ServerRepositoryFactory.getRelationRepository();
		const relations = await repo.findAll();
		return json(relations);
	} catch (error) {
		console.error('GET /api/relations error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch relations' },
			{ status: 500 }
		);
	}
};

// POST /api/relations - Send friend request
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { fromUserId, toUserId } = await request.json();
		
		if (!fromUserId || !toUserId) {
			return json(
				{ error: 'fromUserId and toUserId are required' },
				{ status: 400 }
			);
		}

		const service = getRelationService();
		const relation = await service.sendRequest(fromUserId, toUserId);
		return json(relation, { status: 201 });
	} catch (error) {
		console.error('POST /api/relations error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to send friend request' },
			{ status: 400 }
		);
	}
};
