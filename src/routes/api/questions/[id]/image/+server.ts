// API Route: Question Image by ID
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/questions/[id]/image - Get image for question
export const GET: RequestHandler = async ({ params }) => {
	try {
		const repo = ServerRepositoryFactory.getQuestionRepository();
		const image = await repo.findImageByQuestion(params.id);
		
		if (!image) {
			return json({ error: 'Image not found for this question' }, { status: 404 });
		}
		
		return json(image);
	} catch (error) {
		console.error(`GET /api/questions/${params.id}/image error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch question image' },
			{ status: 500 }
		);
	}
};