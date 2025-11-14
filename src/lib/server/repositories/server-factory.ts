// Server-side Repository Factory
// Creates repository instances based on runtime platform (SQLite for dev, D1 for Cloudflare Workers)

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';

import {
	SQLiteUserRepository,
	SQLiteQuestionRepository,
	SQLiteAnswerRepository,
	SQLiteDMRepository
} from './sqlite';

import {
	D1UserRepository,
	D1QuestionRepository,
	D1AnswerRepository,
	D1DMRepository
} from './d1';

type RepositoryType = 'sqlite' | 'd1';

/**
 * Server-side Repository Factory
 * Instantiates the correct repository implementation based on runtime environment
 * - SQLite for local development (pnpm dev)
 * - D1 for Cloudflare Workers production
 */
export class ServerRepositoryFactory {
	private static repositoryType: RepositoryType | null = null;
	private static d1Database: D1Database | null = null;

	// Singleton instances
	private static _userRepo: IUserRepository | null = null;
	private static _questionRepo: IQuestionRepository | null = null;
	private static _answerRepo: IAnswerRepository | null = null;
	private static _dmRepo: IDMRepository | null = null;

	/**
	 * Initialize the factory with platform environment
	 * Should be called once at app startup (in hooks.server.ts)
	 */
	static initialize(platform?: App.Platform): void {
		if (platform?.env?.DB) {
			// Cloudflare Workers environment with D1 binding
			this.repositoryType = 'd1';
			this.d1Database = platform.env.DB;
			console.log('[ServerRepositoryFactory] Initialized with D1 database');
		} else {
			// Local development with SQLite
			this.repositoryType = 'sqlite';
			console.log('[ServerRepositoryFactory] Initialized with SQLite database');
		}
	}

	/**
	 * Get current repository type
	 */
	static getType(): RepositoryType {
		if (!this.repositoryType) {
			// Auto-initialize with SQLite if not explicitly initialized
			console.warn('[ServerRepositoryFactory] Not initialized, defaulting to SQLite');
			this.repositoryType = 'sqlite';
		}
		return this.repositoryType;
	}

	/**
	 * Reset factory (useful for testing)
	 */
	static reset(): void {
		this.repositoryType = null;
		this.d1Database = null;
		this._userRepo = null;
		this._questionRepo = null;
		this._answerRepo = null;
		this._dmRepo = null;
	}

	/**
	 * Create User Repository
	 */
	static getUserRepository(): IUserRepository {
		if (!this._userRepo) {
			const type = this.getType();
			
			if (type === 'd1') {
				if (!this.d1Database) {
					throw new Error('D1 database not initialized. Call ServerRepositoryFactory.initialize() first.');
				}
				this._userRepo = new D1UserRepository(this.d1Database);
			} else {
				this._userRepo = new SQLiteUserRepository();
			}
		}
		return this._userRepo;
	}

	/**
	 * Create Question Repository
	 */
	static getQuestionRepository(): IQuestionRepository {
		if (!this._questionRepo) {
			const type = this.getType();
			
			if (type === 'd1') {
				if (!this.d1Database) {
					throw new Error('D1 database not initialized. Call ServerRepositoryFactory.initialize() first.');
				}
				this._questionRepo = new D1QuestionRepository(this.d1Database);
			} else {
				this._questionRepo = new SQLiteQuestionRepository();
			}
		}
		return this._questionRepo;
	}

	/**
	 * Create Answer Repository
	 */
	static getAnswerRepository(): IAnswerRepository {
		if (!this._answerRepo) {
			const type = this.getType();
			
			if (type === 'd1') {
				if (!this.d1Database) {
					throw new Error('D1 database not initialized. Call ServerRepositoryFactory.initialize() first.');
				}
				this._answerRepo = new D1AnswerRepository(this.d1Database);
			} else {
				this._answerRepo = new SQLiteAnswerRepository();
			}
		}
		return this._answerRepo;
	}

	/**
	 * Create DM Repository
	 */
	static getDMRepository(): IDMRepository {
		if (!this._dmRepo) {
			const type = this.getType();
			
			if (type === 'd1') {
				if (!this.d1Database) {
					throw new Error('D1 database not initialized. Call ServerRepositoryFactory.initialize() first.');
				}
				this._dmRepo = new D1DMRepository(this.d1Database);
			} else {
				this._dmRepo = new SQLiteDMRepository();
			}
		}
		return this._dmRepo;
	}
}
