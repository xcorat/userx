import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/interactions - findUserInteractions()
export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		if (!userId) {
			return json({ error: 'userId required' }, { status: 400 });
		}
		
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const interactions = await memeRepo.findUserInteractions(userId);
		
		return json(interactions);
	} catch (error) {
		console.error('Error fetching interactions:', error);
		return json({ error: 'Failed to fetch interactions' }, { status: 500 });
	}
};

// POST /api/memes/interactions - createInteraction()
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		if (!data.userId || !data.memeId || !data.interactionType) {
			return json({ error: 'userId, memeId, and interactionType required' }, { status: 400 });
		}
		
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const interaction = await memeRepo.createInteraction(data);
		
		return json(interaction, { status: 201 });
	} catch (error) {
		console.error('Error creating interaction:', error);
		return json({ error: 'Failed to create interaction' }, { status: 500 });
	}
};

// DELETE /api/memes/interactions - deleteUserInteractions()
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		
		if (!userId) {
			return json({ error: 'userId required' }, { status: 400 });
		}
		
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		await memeRepo.deleteUserInteractions(userId);
		
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting interactions:', error);
		return json({ error: 'Failed to delete interactions' }, { status: 500 });
	}
};
