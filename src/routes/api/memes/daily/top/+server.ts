import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/daily/top - getTopDailyMeme()
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
		const meme = await memeRepo.getTopDailyMeme(date);
		
		if (!meme) {
			return json({ error: 'No top meme found for this date' }, { status: 404 });
		}
		
		return json(meme);
	} catch (error) {
		console.error('Error fetching top daily meme:', error);
		return json({ error: 'Failed to fetch top daily meme' }, { status: 500 });
	}
};
