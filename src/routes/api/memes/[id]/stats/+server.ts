import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/[id]/stats - getMemeStats()
export const GET: RequestHandler = async ({ params }) => {
	try {
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const stats = await memeRepo.getMemeStats(params.id);
		
		return json(stats);
	} catch (error) {
		console.error('Error fetching meme stats:', error);
		return json({ error: 'Failed to fetch meme stats' }, { status: 500 });
	}
};
