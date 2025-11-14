// API Route: Answer by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SQLiteAnswerRepository } from '$lib/server/repositories';
import { AnswerVisibility } from '$lib/models/types';

// GET /api/answers/[id] - Get answer by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = new SQLiteAnswerRepository();
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
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { visibility } = await request.json();
		
		if (!visibility || !Object.values(AnswerVisibility).includes(visibility)) {
			return json({ error: 'Invalid visibility value' }, { status: 400 });
		}
		
		const repo = new SQLiteAnswerRepository();
		const answer = await repo.updateVisibility(params.id, visibility);
		return json(answer);
	} catch (error) {
		console.error(`PUT /api/answers/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to update answer' },
			{ status: 400 }
		);
	}
};

// DELETE /api/answers/[id] - Delete answer (future soft delete)
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const repo = new SQLiteAnswerRepository();
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
