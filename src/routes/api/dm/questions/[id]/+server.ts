// API Route: DM Question by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/dm/questions/[id] - Get DM question by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getDMRepository();
		const question = await repo.findQuestionById(params.id);
		
		if (!question) {
			return json({ error: 'DM question not found' }, { status: 404 });
		}
		
		return json(question);
	} catch (error) {
		console.error(`GET /api/dm/questions/${params.id} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch DM question' },
			{ status: 500 }
		);
	}
};
