// D1 Repository Factory - Cloudflare Workers only
// This factory only includes D1 repositories to avoid bundling SQLite dependencies

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';

import { D1Adapter } from '$lib/server/repositories/adapters/d1-adapter';

type RepositoryType = 'd1';

interface DatabaseAdapter {
	userRepo: IUserRepository;
	questionRepo: IQuestionRepository;
	answerRepo: IAnswerRepository;
	dmRepo: IDMRepository;
	memeRepo: IMemeBallRepository;
	getType(): RepositoryType;
}

/**
 * D1 Repository Factory - Cloudflare Workers only
 * Only includes D1 adapter to prevent SQLite bundling
 */
export class D1RepositoryFactory {
	private static adapter: DatabaseAdapter | null = null;

	/**
	 * Initialize with D1 database
	 */
	static initialize(db: D1Database): void {
		this.adapter = D1Adapter.create(db);
		console.log('[D1RepositoryFactory] Initialized with D1 database');
	}

	/**
	 * Get current repository type
	 */
	static getType(): RepositoryType {
		if (!this.adapter) {
			throw new Error('D1RepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.getType();
	}

	/**
	 * Reset factory (useful for testing)
	 */
	static reset(): void {
		this.adapter = null;
	}

	/**
	 * Get User Repository
	 */
	static getUserRepository(): IUserRepository {
		if (!this.adapter) {
			throw new Error('D1RepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.userRepo;
	}

	/**
	 * Get Question Repository
	 */
	static getQuestionRepository(): IQuestionRepository {
		if (!this.adapter) {
			throw new Error('D1RepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.questionRepo;
	}

	/**
	 * Get Answer Repository
	 */
	static getAnswerRepository(): IAnswerRepository {
		if (!this.adapter) {
			throw new Error('D1RepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.answerRepo;
	}

	/**
	 * Get DM Repository
	 */
	static getDMRepository(): IDMRepository {
		if (!this.adapter) {
			throw new Error('D1RepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.dmRepo;
	}

	/**
	 * Get Memeball Repository
	 */
	static getMemeRepository(): IMemeBallRepository {
		if (!this.adapter) {
			throw new Error('D1RepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.memeRepo;
	}
}