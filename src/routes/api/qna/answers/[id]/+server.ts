// API Route: Answer by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import { AnswerVisibility } from '$lib/models/types';

// GET /api/answers/[id] - Get answer by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getAnswerRepository();
		const answer = await repo.findById(params.id);
		
		if (!answer) {
			return json({ error: 'Answer not found' }, { status: 404 });
		}
		
		return json(answer);
	} catch (error) {
		console.error(`GET /api/answers/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch answer' },
			{ status: 500 }
		);
	}
};

// PUT /api/answers/[id] - Update answer visibility
// PATCH /api/answers/[id] - Update answer visibility
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const repo = ServerRepositoryFactory.getAnswerRepository();
		const { visibility } = await request.json();
		
		if (!visibility || !Object.values(AnswerVisibility).includes(visibility)) {
			return json({ error: 'Invalid visibility value' }, { status: 400 });
		}
		
		const answer = await repo.updateVisibility(params.id, visibility);
		return json(answer);
	} catch (error) {
		console.error(`PATCH /api/answers/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to update answer' },
			{ status: 400 }
		);
	}
};

// DELETE /api/answers/[id] - Delete answer
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getAnswerRepository();
		await repo.delete(params.id);
		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error(`DELETE /api/answers/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to delete answer' },
			{ status: 500 }
		);
	}
};

