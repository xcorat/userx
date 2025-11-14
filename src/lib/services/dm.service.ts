// DM Service
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type {
	DMQuestion,
	CreateDMQuestionDTO,
	DMAnswer,
	CreateDMAnswerDTO,
	DMConversation
} from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class DMService {
	constructor(
		private dmRepo: IDMRepository,
		private userRepo: IUserRepository
	) {}

	async sendDMQuestion(data: CreateDMQuestionDTO): Promise<DMQuestion> {
		// Validate users exist
		const sender = await this.userRepo.findById(data.senderId);
		const recipient = await this.userRepo.findById(data.recipientId);

		if (!sender || !recipient) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Invalid sender or recipient');
		}

		if (data.senderId === data.recipientId) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot send DM question to yourself');
		}

		return await this.dmRepo.createQuestion(data);
	}

	async getDMInbox(userId: string): Promise<DMConversation[]> {
		const questions = await this.dmRepo.findQuestionsByRecipient(userId);

		const conversations = await Promise.all(
			questions.map(async (question) => {
				const answer = await this.dmRepo.findAnswerByQuestion(question.id);
				const sender = await this.userRepo.findById(question.senderId);

				return {
					question,
					answer: answer || undefined,
					sender: {
						id: sender!.id,
						name: sender!.name,
						avatarUrl: sender?.avatarUrl
					}
				} as DMConversation;
			})
		);

		return conversations;
	}

	async getSentDMQuestions(userId: string): Promise<DMConversation[]> {
		const questions = await this.dmRepo.findQuestionsBySender(userId);

		const conversations = await Promise.all(
			questions.map(async (question) => {
				const answer = await this.dmRepo.findAnswerByQuestion(question.id);
				const recipient = await this.userRepo.findById(question.recipientId);

				return {
					question,
					answer: answer || undefined,
					sender: {
						id: recipient!.id,
						name: recipient!.name,
						avatarUrl: recipient?.avatarUrl
					}
				} as DMConversation;
			})
		);

		return conversations;
	}

	async answerDMQuestion(data: CreateDMAnswerDTO): Promise<DMAnswer> {
		// Check if already answered
		const existing = await this.dmRepo.findAnswerByQuestion(data.dmQuestionId);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'DM question already answered');
		}

		// Validate question exists
		const question = await this.dmRepo.findQuestionById(data.dmQuestionId);
		if (!question) {
			throw new AppError(ErrorCode.NOT_FOUND, 'DM question not found');
		}

		// Ensure answerer is the recipient
		if (question.recipientId !== data.userId) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authorized to answer this question');
		}

		// Validate choice if provided
		if (data.choiceId && question.choices) {
			const choiceExists = question.choices.some((c) => c.id === data.choiceId);
			if (!choiceExists) {
				throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid choice');
			}
		}

		return await this.dmRepo.createAnswer(data);
	}

	async getDMConversation(questionId: string, userId: string): Promise<DMConversation | null> {
		const question = await this.dmRepo.findQuestionById(questionId);
		if (!question) return null;

		// Check authorization
		if (question.senderId !== userId && question.recipientId !== userId) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authorized to view this conversation');
		}

		const answer = await this.dmRepo.findAnswerByQuestion(questionId);
		const sender = await this.userRepo.findById(question.senderId);

		return {
			question,
			answer: answer || undefined,
			sender: {
				id: sender!.id,
				name: sender!.name,
				avatarUrl: sender?.avatarUrl
			}
		};
	}
}
