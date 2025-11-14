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
		
		return json({
			success: true,
			repoType,
			timestamp: new Date().toISOString(),
			counts: {
				users: users.length,
				questions: questions.length,
				answers: answers.length,
				dmQuestions: dmQuestions.length
			},
			sampleData: {
				firstUser: users[0] || null,
				firstQuestion: questions[0] || null,
				firstAnswer: answers[0] || null,
				firstDMQuestion: dmQuestions[0] || null
			}
		});
	} catch (error) {
		console.error('GET /tests error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch repository info' },
			{ status: 500 }
		);
	}
};
