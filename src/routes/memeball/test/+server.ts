// Memeball Database Test Endpoint
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /memeball/test - Get memeball repository debug information
export const GET: RequestHandler = async () => {
	try {
		// Get repository type
		const repoType = ServerRepositoryFactory.getType();

		// Get meme repository
		const memeRepo = ServerRepositoryFactory.getMemeRepository();

		// Query meme tables
		const memes = await memeRepo.findAll();
		const memeInteractions: any[] = [];

		// Get sample interactions
		if (memes.length > 0) {
			const userInteractions = await memeRepo.findUserInteractions(memes[0].submittedBy);
			memeInteractions.push(...userInteractions.slice(0, 5));
		}

		// Transform into table format
		const tables = [
			{
				name: 'memes',
				count: memes.length,
				sampleRows: memes.slice(0, 3).map((m) => ({
					id: m.id,
					contentHash: m.contentHash,
					imageUrl: m.imageUrl,
					submittedBy: m.submittedBy,
					submittedAt: m.submittedAt.toISOString()
				}))
			},
			{
				name: 'meme_interactions',
				count: memeInteractions.length,
				sampleRows: memeInteractions.slice(0, 3).map((mi) => ({
					id: mi.id,
					userId: mi.userId,
					memeId: mi.memeId,
					interactionType: mi.interactionType,
					interactedAt: mi.interactedAt.toISOString()
				}))
			}
		];

		return json({
			repoType,
			timestamp: new Date().toISOString(),
			tableCount: tables.length,
			tables
		});
	} catch (error) {
		console.error('GET /memeball/test error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch memeball database info' },
			{ status: 500 }
		);
	}
};
