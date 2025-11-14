// API Route: Question by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SQLiteQuestionRepository } from '$lib/server/repositories';

// GET /api/questions/[id] - Get question by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = new SQLiteQuestionRepository();
		const question = await repo.findById(params.id);
		
		if (!question) {
			return json({ error: 'Question not found' }, { status: 404 });
		}
		
		return json(question);
	} catch (error) {
		console.error(`GET /api/questions/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch question' },
			{ status: 500 }
		);
	}
};

// DELETE /api/questions/[id] - Delete question (future)
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const repo = new SQLiteQuestionRepository();
		await repo.delete(params.id);
		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error(`DELETE /api/questions/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to delete question' },
			{ status: 500 }
		);
	}
};
