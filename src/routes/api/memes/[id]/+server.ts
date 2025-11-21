import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes/[id] - findById()
export const GET: RequestHandler = async ({ params }) => {
	try {
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const meme = await memeRepo.findById(params.id);
		
		if (!meme) {
			return json({ error: 'Meme not found' }, { status: 404 });
		}
		
		return json(meme);
	} catch (error) {
		console.error('Error fetching meme:', error);
		return json({ error: 'Failed to fetch meme' }, { status: 500 });
	}
};

// DELETE /api/memes/[id] - delete()
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		await memeRepo.delete(params.id);
		
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting meme:', error);
		return json({ error: 'Failed to delete meme' }, { status: 500 });
	}
};
