// API Route: DM Questions
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';
import type { CreateDMQuestionDTO } from '$lib/models';

// GET /api/dm/questions - Get DM questions for user
export const GET: RequestHandler = async ({ url }) => {
	try {
		const repo = ServerRepositoryFactory.getDMRepository();
		const userId = url.searchParams.get('userId');
		const sent = url.searchParams.get('sent') === 'true';
		const received = url.searchParams.get('received') === 'true';
		
		if (!userId) {
			return json({ error: 'userId parameter required' }, { status: 400 });
		}
		
		let questions;
		if (sent && !received) {
			questions = await repo.findQuestionsBySender(userId);
		} else if (received && !sent) {
			questions = await repo.findQuestionsByRecipient(userId);
		} else {
			const sentQuestions = await repo.findQuestionsBySender(userId);
			const receivedQuestions = await repo.findQuestionsByRecipient(userId);
			questions = [...sentQuestions, ...receivedQuestions];
		}
		
		return json(questions);
	} catch (error) {
		console.error('GET /api/dm/questions error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch DM questions' },
			{ status: 500 }
		);
	}
};

// POST /api/dm/questions - Create new DM question
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: CreateDMQuestionDTO = await request.json();
		const repo = ServerRepositoryFactory.getDMRepository();
		const question = await repo.createQuestion(data);
		return json(question, { status: 201 });
	} catch (error) {
		console.error('POST /api/dm/questions error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to create DM question' },
			{ status: 400 }
		);
	}
};
