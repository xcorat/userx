// API Route: Relation by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/relations/[id] - Get relation by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getRelationRepository();
		const relation = await repo.findById(params.id);
		
		if (!relation) {
			return json({ error: 'Relation not found' }, { status: 404 });
		}
		
		return json(relation);
	} catch (error) {
		console.error('GET /api/relations/[id] error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch relation' },
			{ status: 500 }
		);
	}
};

// PUT /api/relations/[id] - Update relation (approve/reject)
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const updateData = await request.json();
		
		if (!updateData.userId) {
			return json({ error: 'userId is required' }, { status: 400 });
		}

		const relationRepo = ServerRepositoryFactory.getRelationRepository();
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const { RelationService } = await import('$lib/services/relation.service');
		const service = new RelationService(relationRepo, userRepo);
		
		// Update the relation in the repository
		const updatedRelation = await relationRepo.update(params.id, updateData);
		
		if (!updatedRelation) {
			return json({ error: 'Relation not found' }, { status: 404 });
		}
		
		return json(updatedRelation);
	} catch (error) {
		console.error('PUT /api/relations/[id] error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to update relation' },
			{ status: 400 }
		);
	}
};

// DELETE /api/relations/[id] - Remove relation
export const DELETE: RequestHandler = async ({ params, url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		if (!userId) {
			return json({ error: 'userId query parameter is required' }, { status: 400 });
		}

		const relationRepo = ServerRepositoryFactory.getRelationRepository();
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const { RelationService } = await import('$lib/services/relation.service');
		const service = new RelationService(relationRepo, userRepo);
		
		await service.removeRelation(userId, params.id);
		return json({ success: true });
	} catch (error) {
		console.error('DELETE /api/relations/[id] error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to remove relation' },
			{ status: 400 }
		);
	}
};
