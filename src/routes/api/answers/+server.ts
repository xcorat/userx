// API Route: Answers
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SQLiteAnswerRepository } from '$lib/server/repositories';
import type { CreateAnswerDTO } from '$lib/models';

// GET /api/answers - Query answers with filters
export const GET: RequestHandler = async ({ url }) => {
	try {
		const repo = new SQLiteAnswerRepository();
		const userId = url.searchParams.get('userId');
		const questionId = url.searchParams.get('questionId');
		const publicOnly = url.searchParams.get('publicOnly') === 'true';
		
		let answers;
		if (userId && questionId) {
			answers = [await repo.findByUserAndQuestion(userId, questionId)].filter(Boolean);
		} else if (userId) {
			answers = await repo.findByUser(userId);
		} else if (questionId && publicOnly) {
			answers = await repo.findPublicByQuestion(questionId);
		} else if (questionId) {
			answers = await repo.findByQuestion(questionId);
		} else {
			answers = await repo.findAll();
		}
		
		return json(answers);
	} catch (error) {
		console.error('GET /api/answers error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch answers' },
			{ status: 500 }
		);
	}
};

// POST /api/answers - Create new answer
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: CreateAnswerDTO = await request.json();
		const repo = new SQLiteAnswerRepository();
		const answer = await repo.create(data);
		return json(answer, { status: 201 });
	} catch (error) {
		console.error('POST /api/answers error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to create answer' },
			{ status: 400 }
		);
	}
};
