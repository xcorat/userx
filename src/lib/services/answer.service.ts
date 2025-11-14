// Answer Service
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { PublicAnswer, CreateAnswerDTO, AnswerWithQuestion, AnswerVisibility } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class AnswerService {
	constructor(
		private answerRepo: IAnswerRepository,
		private questionRepo: IQuestionRepository,
		private userRepo: IUserRepository
	) {}

	async createAnswer(data: CreateAnswerDTO): Promise<PublicAnswer> {
		// Check if user already answered
		const existing = await this.answerRepo.findByUserAndQuestion(data.userId, data.questionId);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'You have already answered this question');
		}

		// Validate question and choice exist
		const question = await this.questionRepo.findById(data.questionId);
		if (!question) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Question not found');
		}

		const choiceExists = question.choices.some((c) => c.id === data.choiceId);
		if (!choiceExists) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid choice');
		}

		return await this.answerRepo.create(data);
	}

	async getUserAnswers(userId: string): Promise<AnswerWithQuestion[]> {
		const answers = await this.answerRepo.findByUser(userId);

		const enhanced = await Promise.all(
			answers.map(async (answer) => {
				const question = await this.questionRepo.findById(answer.questionId);
				if (!question) throw new AppError(ErrorCode.NOT_FOUND, 'Question not found');

				const choice = question.choices.find((c) => c.id === answer.choiceId);
				if (!choice) throw new AppError(ErrorCode.NOT_FOUND, 'Choice not found');

				return {
					...answer,
					question: {
						id: question.id,
						text: question.text,
						choices: question.choices
					},
					choiceText: choice.text
				} as AnswerWithQuestion;
			})
		);

		return enhanced;
	}

	async getPublicAnswersForUser(userId: string): Promise<AnswerWithQuestion[]> {
		const allAnswers = await this.getUserAnswers(userId);
		return allAnswers.filter((a) => a.visibility === 'public');
	}

	async updateAnswerVisibility(
		answerId: string,
		visibility: AnswerVisibility
	): Promise<PublicAnswer> {
		return await this.answerRepo.updateVisibility(answerId, visibility);
	}

	async deleteAnswer(answerId: string): Promise<void> {
		await this.answerRepo.delete(answerId);
	}
}
