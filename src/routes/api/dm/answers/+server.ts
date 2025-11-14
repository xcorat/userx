// API Route: DM Answers
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SQLiteDMRepository } from '$lib/server/repositories';
import type { CreateDMAnswerDTO } from '$lib/models';

// GET /api/dm/answers - Get DM answers
export const GET: RequestHandler = async ({ url }) => {
	try {
		const repo = new SQLiteDMRepository();
		const questionId = url.searchParams.get('questionId');
		
		if (questionId) {
			const answer = await repo.findAnswerByQuestion(questionId);
			return json(answer ? [answer] : []);
		}
		
		return json({ error: 'questionId parameter required' }, { status: 400 });
	} catch (error) {
		console.error('GET /api/dm/answers error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch DM answers' },
			{ status: 500 }
		);
	}
};

// POST /api/dm/answers - Create new DM answer
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: CreateDMAnswerDTO = await request.json();
		const repo = new SQLiteDMRepository();
		const answer = await repo.createAnswer(data);
		return json(answer, { status: 201 });
	} catch (error) {
		console.error('POST /api/dm/answers error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to create DM answer' },
			{ status: 400 }
		);
	}
};
