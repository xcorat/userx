// Question Service
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { PublicQuestion, CreateQuestionDTO, QuestionWithStats } from '$lib/models';
import { sortQuestions, type SortOption } from '$lib/utils/sorting';
import {
	validateQuestionText,
	validateChoiceText,
	validateChoicesCount
} from '$lib/utils/validation';

export class QuestionService {
	constructor(
		private questionRepo: IQuestionRepository,
		private answerRepo: IAnswerRepository
	) {}

	async getPublicQuestions(
		sortBy: SortOption = 'newest',
		userId?: string
	): Promise<QuestionWithStats[]> {
		const questions = await this.questionRepo.findAll();
		const sorted = sortQuestions(questions, sortBy);

		// Enhance with stats
		const enhanced = await Promise.all(
			sorted.map(async (q) => {
				const answers = await this.answerRepo.findByQuestion(q.id);
				const userAnswer = userId
					? await this.answerRepo.findByUserAndQuestion(userId, q.id)
					: null;

				return {
					...q,
					totalAnswers: answers.length,
					userAnswered: !!userAnswer,
					userAnswerVisibility: userAnswer?.visibility
				} as QuestionWithStats;
			})
		);

		return enhanced;
	}

	async getPublicQuestionsPaginated(
		page: number = 1,
		limit: number = 20,
		sortBy: SortOption = 'newest',
		userId?: string
	): Promise<{
		questions: QuestionWithStats[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasMore: boolean;
		};
	}> {
		// Check if repository has pagination method
		const repo = this.questionRepo as any;
		let questions: PublicQuestion[];
		let pagination: any;

		if (typeof repo.findAllPaginated === 'function') {
			const result = await repo.findAllPaginated(page, limit);
			questions = result.questions;
			pagination = result.pagination;
		} else {
			// Fallback: load all and paginate in memory
			const allQuestions = await this.questionRepo.findAll();
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;
			questions = allQuestions.slice(startIndex, endIndex);
			pagination = {
				page,
				limit,
				total: allQuestions.length,
				totalPages: Math.ceil(allQuestions.length / limit),
				hasMore: endIndex < allQuestions.length
			};
		}

		const sorted = sortQuestions(questions, sortBy);

		// Enhance with stats
		const enhanced = await Promise.all(
			sorted.map(async (q) => {
				const answers = await this.answerRepo.findByQuestion(q.id);
				const userAnswer = userId
					? await this.answerRepo.findByUserAndQuestion(userId, q.id)
					: null;

				return {
					...q,
					totalAnswers: answers.length,
					userAnswered: !!userAnswer,
					userAnswerVisibility: userAnswer?.visibility
				} as QuestionWithStats;
			})
		);

		return {
			questions: enhanced,
			pagination
		};
	}

	async getQuestionById(id: string, userId?: string): Promise<QuestionWithStats | null> {
		const question = await this.questionRepo.findById(id);
		if (!question) return null;

		const answers = await this.answerRepo.findByQuestion(id);
		const userAnswer = userId ? await this.answerRepo.findByUserAndQuestion(userId, id) : null;

		return {
			...question,
			totalAnswers: answers.length,
			userAnswered: !!userAnswer,
			userAnswerVisibility: userAnswer?.visibility
		};
	}

	async createQuestion(data: CreateQuestionDTO): Promise<PublicQuestion> {
		// Validation
		validateQuestionText(data.text);
		validateChoicesCount(data.choices.length);

		data.choices.forEach((choice) => {
			validateChoiceText(choice.text);
		});

		return await this.questionRepo.create(data);
	}
}
