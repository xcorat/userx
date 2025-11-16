import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

export const GET: RequestHandler = async ({ params, platform }) => {
	try {
		const { userId } = params;

		if (!userId) {
			return json({ error: 'userId required' }, { status: 400 });
		}

		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const stats = await memeRepo.getUserMemeStats(userId);

		return json(stats);
	} catch (error) {
		console.error('Error fetching user meme stats:', error);
		return json({ error: 'Failed to fetch stats' }, { status: 500 });
	}
};
