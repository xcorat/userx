// SQLite Repository Factory - Node.js development only
// This factory only includes SQLite repositories and will not be bundled for Cloudflare Workers

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';

import { SQLiteAdapter } from '$lib/server/repositories/adapters/sqlite-adapter';

type RepositoryType = 'sqlite';

interface DatabaseAdapter {
	userRepo: IUserRepository;
	questionRepo: IQuestionRepository;
	answerRepo: IAnswerRepository;
	dmRepo: IDMRepository;
	memeRepo: IMemeBallRepository;
	relationRepo: IRelationRepository;
	getType(): RepositoryType;
}

/**
 * SQLite Repository Factory - Node.js development only
 * Only includes SQLite adapter for local development
 */
export class SQLiteRepositoryFactory {
	private static adapter: DatabaseAdapter | null = null;

	/**
	 * Initialize with SQLite database
	 */
	static initialize(): void {
		this.adapter = SQLiteAdapter.create();
		console.log('[SQLiteRepositoryFactory] Initialized with SQLite database');
	}

	/**
	 * Get current repository type
	 */
	static getType(): RepositoryType {
		if (!this.adapter) {
			throw new Error('SQLiteRepositoryFactory not initialized. Call initialize() first.');
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
			throw new Error('SQLiteRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.userRepo;
	}

	/**
	 * Get Question Repository
	 */
	static getQuestionRepository(): IQuestionRepository {
		if (!this.adapter) {
			throw new Error('SQLiteRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.questionRepo;
	}

	/**
	 * Get Answer Repository
	 */
	static getAnswerRepository(): IAnswerRepository {
		if (!this.adapter) {
			throw new Error('SQLiteRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.answerRepo;
	}

	/**
	 * Get DM Repository
	 */
	static getDMRepository(): IDMRepository {
		if (!this.adapter) {
			throw new Error('SQLiteRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.dmRepo;
	}

	/**
	 * Get Memeball Repository
	 */
	static getMemeRepository(): IMemeBallRepository {
		if (!this.adapter) {
			throw new Error('SQLiteRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.memeRepo;
	}

	/**
	 * Get Relation Repository
	 */
	static getRelationRepository(): IRelationRepository {
		if (!this.adapter) {
			throw new Error('SQLiteRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.relationRepo;
	}
}