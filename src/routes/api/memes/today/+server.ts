import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/today - findTodaysSubmissions()
export const GET: RequestHandler = async () => {
	try {
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const memes = await memeRepo.findTodaysSubmissions();
		
		return json(memes);
	} catch (error) {
		console.error('Error fetching today\'s memes:', error);
		return json({ error: 'Failed to fetch today\'s memes' }, { status: 500 });
	}
};
