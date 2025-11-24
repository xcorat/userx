import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/stats - Get all memes with their stats (picks and rejects)
export const GET: RequestHandler = async () => {
	try {
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const memesWithStats = await memeRepo.findAllWithStats();
		
		return json(memesWithStats);
	} catch (error) {
		console.error('Error fetching memes with stats:', error);
		return json({ error: 'Failed to fetch memes with stats' }, { status: 500 });
	}
};

