import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /api/memes - findAll() or findByContentHash() or findBySubmitter()
export const GET: RequestHandler = async ({ url }) => {
	try {
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		
		// Check for contentHash query param
		const contentHash = url.searchParams.get('contentHash');
		if (contentHash) {
			const meme = await memeRepo.findByContentHash(contentHash);
			return json(meme);
		}
		
		// Check for submittedBy query param
		const submittedBy = url.searchParams.get('submittedBy');
		if (submittedBy) {
			const memes = await memeRepo.findBySubmitter(submittedBy);
			return json(memes);
		}
		
		// Default: return all memes
		const memes = await memeRepo.findAll();
		return json(memes);
	} catch (error) {
		console.error('Error fetching memes:', error);
		return json({ error: 'Failed to fetch memes' }, { status: 500 });
	}
};

// POST /api/memes - create()
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		if (!data.imageUrl || !data.submittedBy) {
			return json({ error: 'imageUrl and submittedBy required' }, { status: 400 });
		}
		
		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const meme = await memeRepo.create(data);
		
		return json(meme, { status: 201 });
	} catch (error) {
		console.error('Error creating meme:', error);
		return json({ error: 'Failed to create meme' }, { status: 500 });
	}
};
