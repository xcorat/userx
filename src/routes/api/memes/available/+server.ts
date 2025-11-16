import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const userId = url.searchParams.get('userId');
		const limit = parseInt(url.searchParams.get('limit') || '10');

		if (!userId) {
			return json({ error: 'userId required' }, { status: 400 });
		}

		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const memes = await memeRepo.findAvailableForUser(userId, limit);

		return json(memes);
	} catch (error) {
		console.error('Error fetching available memes:', error);
		return json({ error: 'Failed to fetch memes' }, { status: 500 });
	}
};
