// API Route: Questions
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SQLiteQuestionRepository } from '$lib/server/repositories';
import type { CreateQuestionDTO } from '$lib/models';

// GET /api/questions - List all public questions with pagination support
export const GET: RequestHandler = async ({ url }) => {
	try {
		const repo = new SQLiteQuestionRepository();
		const creatorId = url.searchParams.get('creatorId');
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		
		const questions = creatorId 
			? await repo.findByCreator(creatorId)
			: await repo.findAll();
		
		// Apply pagination
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedQuestions = questions.slice(startIndex, endIndex);
		
		// Return paginated response with metadata
		return json({
			questions: paginatedQuestions,
			pagination: {
				page,
				limit,
				total: questions.length,
				totalPages: Math.ceil(questions.length / limit),
				hasMore: endIndex < questions.length
			}
		});
	} catch (error) {
		console.error('GET /api/questions error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch questions' },
			{ status: 500 }
		);
	}
};

// POST /api/questions - Create new question
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: CreateQuestionDTO = await request.json();
		const repo = new SQLiteQuestionRepository();
		const question = await repo.create(data);
		return json(question, { status: 201 });
	} catch (error) {
		console.error('POST /api/questions error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to create question' },
			{ status: 400 }
		);
	}
};
