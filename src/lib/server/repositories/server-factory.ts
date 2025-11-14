// Server-side Repository Factory
// Creates repository instances based on runtime platform (SQLite for dev, D1 for Cloudflare Workers)

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';

import { SQLiteAdapter } from './adapters/sqlite-adapter';
import { D1Adapter } from './adapters/d1-adapter';

type RepositoryType = 'sqlite' | 'd1';
type DatabaseAdapter = SQLiteAdapter | D1Adapter;

/**
 * Server-side Repository Factory
 * Instantiates the correct repository implementation based on runtime environment
 * - SQLite for local development (pnpm dev)
 * - D1 for Cloudflare Workers production
 */
export class ServerRepositoryFactory {
	private static adapter: DatabaseAdapter | null = null;

	/**
	 * Initialize the factory with platform environment
	 * Should be called once at app startup (in hooks.server.ts)
	 */
	static initialize(platform?: App.Platform): void {
		if (platform?.env?.DB) {
			// Cloudflare Workers environment with D1 binding
			this.adapter = D1Adapter.create(platform.env.DB);
			console.log('[ServerRepositoryFactory] Initialized with D1 database');
		} else {
			// Local development with SQLite
			this.adapter = SQLiteAdapter.create();
			console.log('[ServerRepositoryFactory] Initialized with SQLite database');
		}
	}

	/**
	 * Get current repository type
	 */
	static getType(): RepositoryType {
		if (!this.adapter) {
			throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
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
			throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.userRepo;
	}

	/**
	 * Get Question Repository
	 */
	static getQuestionRepository(): IQuestionRepository {
		if (!this.adapter) {
			throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.questionRepo;
	}

	/**
	 * Get Answer Repository
	 */
	static getAnswerRepository(): IAnswerRepository {
		if (!this.adapter) {
			throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.answerRepo;
	}

	/**
	 * Get DM Repository
	 */
	static getDMRepository(): IDMRepository {
		if (!this.adapter) {
			throw new Error('ServerRepositoryFactory not initialized. Call initialize() first.');
		}
		return this.adapter.dmRepo;
	}
}
