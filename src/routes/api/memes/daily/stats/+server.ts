import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/daily/stats - getDailyStats()
export const GET: RequestHandler = async ({ url }) => {
	try {
		const dateStr = url.searchParams.get('date');
		
		if (!dateStr) {
			return json({ error: 'date required (YYYY-MM-DD)' }, { status: 400 });
		}
		
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) {
			return json({ error: 'Invalid date format' }, { status: 400 });
		}
		
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const stats = await memeRepo.getDailyStats(date);
		
		return json(stats);
	} catch (error) {
		console.error('Error fetching daily stats:', error);
		return json({ error: 'Failed to fetch daily stats' }, { status: 500 });
	}
};
