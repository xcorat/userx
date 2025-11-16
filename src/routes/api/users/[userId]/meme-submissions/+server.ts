import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

export const GET: RequestHandler = async ({ params, url, platform }) => {
	try {
		const { userId } = params;
		const dateStr = url.searchParams.get('date');

		if (!userId) {
			return json({ error: 'userId required' }, { status: 400 });
		}

		if (!dateStr) {
			return json({ error: 'date required' }, { status: 400 });
		}

		const date = new Date(dateStr);
		if (isNaN(date.getTime())) {
			return json({ error: 'invalid date format' }, { status: 400 });
		}

		const memeRepo = ServerRepositoryFactory.getMemeRepository();
		const count = await memeRepo.getUserDailySubmissionCount(userId, date);

		return json({ count });
	} catch (error) {
		console.error('Error fetching daily submission count:', error);
		return json({ error: 'Failed to fetch submission count' }, { status: 500 });
	}
};
