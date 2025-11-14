// Dependency Injection Container
import { RepositoryFactory } from '$lib/repositories/factory';

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';

import { AuthService } from '$lib/services/auth.service.js';
import { QuestionService } from '$lib/services/question.service.js';
import { AnswerService } from '$lib/services/answer.service.js';
import { AggregateService } from '$lib/services/aggregate.service.js';
import { ProfileService } from '$lib/services/profile.service.js';
import { DMService } from '$lib/services/dm.service.js';
import { UserService } from '$lib/services/user.service.js';

/**
 * Dependency Injection Container
 * Manages all service instances and their dependencies using Singleton pattern
 * Uses RepositoryFactory for storage layer abstraction
 */
class DIContainer {
	// Repository instances (singleton)
	private static _userRepo: IUserRepository | null = null;
	private static _questionRepo: IQuestionRepository | null = null;
	private static _answerRepo: IAnswerRepository | null = null;
	private static _dmRepo: IDMRepository | null = null;

	// Service instances (singleton)
	private static _authService: AuthService | null = null;
	private static _userService: UserService | null = null;
	private static _questionService: QuestionService | null = null;
	private static _answerService: AnswerService | null = null;
	private static _aggregateService: AggregateService | null = null;
	private static _profileService: ProfileService | null = null;
	private static _dmService: DMService | null = null;

	// Repository Getters
	private static get userRepo(): IUserRepository {
		if (!this._userRepo) {
			this._userRepo = RepositoryFactory.createUserRepository();
		}
		return this._userRepo;
	}

	private static get questionRepo(): IQuestionRepository {
		if (!this._questionRepo) {
			this._questionRepo = RepositoryFactory.createQuestionRepository();
		}
		return this._questionRepo;
	}

	private static get answerRepo(): IAnswerRepository {
		if (!this._answerRepo) {
			this._answerRepo = RepositoryFactory.createAnswerRepository();
		}
		return this._answerRepo;
	}

	private static get dmRepo(): IDMRepository {
		if (!this._dmRepo) {
			this._dmRepo = RepositoryFactory.createDMRepository();
		}
		return this._dmRepo;
	}

	// Service Getters (Public API)
	static getAuthService(): AuthService {
		if (!this._authService) {
			this._authService = new AuthService(this.userRepo);
		}
		return this._authService;
	}

	static getUserService(): UserService {
		if (!this._userService) {
			this._userService = new UserService(this.userRepo);
		}
		return this._userService;
	}

	static getQuestionService(): QuestionService {
		if (!this._questionService) {
			this._questionService = new QuestionService(this.questionRepo, this.answerRepo);
		}
		return this._questionService;
	}

	static getAnswerService(): AnswerService {
		if (!this._answerService) {
			this._answerService = new AnswerService(
				this.answerRepo,
				this.questionRepo,
				this.userRepo
			);
		}
		return this._answerService;
	}

	static getAggregateService(): AggregateService {
		if (!this._aggregateService) {
			this._aggregateService = new AggregateService(this.answerRepo, this.questionRepo);
		}
		return this._aggregateService;
	}

	static getProfileService(): ProfileService {
		if (!this._profileService) {
			this._profileService = new ProfileService(
				this.userRepo,
				this.answerRepo,
				this.questionRepo
			);
		}
		return this._profileService;
	}

	static getDMService(): DMService {
		if (!this._dmService) {
			this._dmService = new DMService(this.dmRepo, this.userRepo);
		}
		return this._dmService;
	}

	// Utility Methods
	static reset(): void {
		this._userRepo = null;
		this._questionRepo = null;
		this._answerRepo = null;
		this._dmRepo = null;
		this._authService = null;
		this._userService = null;
		this._questionService = null;
		this._answerService = null;
		this._aggregateService = null;
		this._profileService = null;
		this._dmService = null;
	}

	static setRepositories(repos: {
		userRepo?: IUserRepository;
		questionRepo?: IQuestionRepository;
		answerRepo?: IAnswerRepository;
		dmRepo?: IDMRepository;
	}): void {
		if (repos.userRepo) this._userRepo = repos.userRepo;
		if (repos.questionRepo) this._questionRepo = repos.questionRepo;
		if (repos.answerRepo) this._answerRepo = repos.answerRepo;
		if (repos.dmRepo) this._dmRepo = repos.dmRepo;

		// Reset services so they use new repositories
		this._authService = null;
		this._userService = null;
		this._questionService = null;
		this._answerService = null;
		this._aggregateService = null;
		this._profileService = null;
		this._dmService = null;
	}
}

export default DIContainer;
