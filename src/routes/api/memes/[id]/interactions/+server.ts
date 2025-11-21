import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/[id]/interactions - findUserInteraction()
export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		if (!userId) {
			return json({ error: 'userId required' }, { status: 400 });
		}
		
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const interaction = await memeRepo.findUserInteraction(userId, params.id);
		
		if (!interaction) {
			return json({ error: 'Interaction not found' }, { status: 404 });
		}
		
		return json(interaction);
	} catch (error) {
		console.error('Error fetching interaction:', error);
		return json({ error: 'Failed to fetch interaction' }, { status: 500 });
	}
};
