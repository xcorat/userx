// SQLite Database Adapter
// Encapsulates all SQLite repositories for local development

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';

import { SQLiteUserRepository } from '$lib/server/repositories/sqlite/SQLiteUserRepository';
import { SQLiteQuestionRepository } from '$lib/server/repositories/sqlite/SQLiteQuestionRepository';
import { SQLiteAnswerRepository } from '$lib/server/repositories/sqlite/SQLiteAnswerRepository';
import { SQLiteDMRepository } from '$lib/server/repositories/sqlite/SQLiteDMRepository';

/**
 * SQLite Database Adapter
 * Used for local development with better-sqlite3
 * Provides unified access to all SQLite repositories
 */
export class SQLiteAdapter {
	public readonly userRepo: IUserRepository;
	public readonly questionRepo: IQuestionRepository;
	public readonly answerRepo: IAnswerRepository;
	public readonly dmRepo: IDMRepository;

	private constructor() {
		this.userRepo = new SQLiteUserRepository();
		this.questionRepo = new SQLiteQuestionRepository();
		this.answerRepo = new SQLiteAnswerRepository();
		this.dmRepo = new SQLiteDMRepository();
	}

	/**
	 * Create new SQLite adapter instance
	 */
	static create(): SQLiteAdapter {
		return new SQLiteAdapter();
	}

	/**
	 * Get adapter type
	 */
	getType(): 'sqlite' {
		return 'sqlite';
	}
}