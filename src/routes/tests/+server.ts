// API Route: Database Test/Debug Endpoint
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerRepositoryFactory } from '$lib/server/repositories/server-factory';

// GET /tests - Get repository debug information
export const GET: RequestHandler = async () => {
	try {
		// Get repository type and basic info
		const repoType = ServerRepositoryFactory.getType();
		
		// Test all repositories to ensure they're working
		const userRepo = ServerRepositoryFactory.getUserRepository();
		const questionRepo = ServerRepositoryFactory.getQuestionRepository();
		const answerRepo = ServerRepositoryFactory.getAnswerRepository();
		const dmRepo = ServerRepositoryFactory.getDMRepository();
		
		const users = await userRepo.findAll();
		const questions = await questionRepo.findAll();
		const answers = await answerRepo.findAll();
		
		// Get a sample user ID for DM queries (avoid empty result)
		const sampleUserId = users.length > 0 ? users[0].id : 'no-users';
		const dmQuestions = await dmRepo.findAllQuestions(sampleUserId);
		
		// Transform data into table format expected by frontend
		const tables = [
			{ name: 'users', count: users.length, sampleRows: users.slice(0, 3) },
			{ name: 'questions', count: questions.length, sampleRows: questions.slice(0, 3) },
			{ name: 'answers', count: answers.length, sampleRows: answers.slice(0, 3) },
			{ name: 'dm_questions', count: dmQuestions.length, sampleRows: dmQuestions.slice(0, 3) }
		];

		return json({
			repoType,
			timestamp: new Date().toISOString(),
			tableCount: tables.length,
			tables
		});
	} catch (error) {
		console.error('GET /tests error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch repository info' },
			{ status: 500 }
		);
	}
};
