// Profile Service
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { UserProfile, UpdateUserDTO, AnswerWithQuestion } from '$lib/models';
import { AnswerService } from './answer.service';

export class ProfileService {
	private answerService: AnswerService;

	constructor(
		private userRepo: IUserRepository,
		private answerRepo: IAnswerRepository,
		questionRepo: IQuestionRepository
	) {
		this.answerService = new AnswerService(answerRepo, questionRepo, userRepo);
	}

	async getUserProfile(userId: string): Promise<UserProfile | null> {
		const user = await this.userRepo.findById(userId);
		if (!user) return null;

		const answers = await this.answerRepo.findByUser(userId);
		const publicAnswers = answers.filter((a) => a.visibility === 'public');
		const privateAnswers = answers.filter((a) => a.visibility === 'private');

		return {
			...user,
			publicAnswerCount: publicAnswers.length,
			privateAnswerCount: privateAnswers.length,
			questionsAnswered: answers.length
		};
	}

	async getProfileAnswers(userId: string, includePrivate = false): Promise<AnswerWithQuestion[]> {
		if (includePrivate) {
			return await this.answerService.getUserAnswers(userId);
		} else {
			return await this.answerService.getPublicAnswersForUser(userId);
		}
	}

	async updateProfile(userId: string, data: UpdateUserDTO): Promise<UserProfile> {
		await this.userRepo.update(userId, data);
		const profile = await this.getUserProfile(userId);
		if (!profile) throw new Error('Profile not found');
		return profile;
	}
}
