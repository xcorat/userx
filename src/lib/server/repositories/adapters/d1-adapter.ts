// D1 Database Adapter
// Encapsulates all D1 repositories for Cloudflare Workers production

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';

import { D1UserRepository } from '$lib/server/repositories/d1/D1UserRepository';
import { D1QuestionRepository } from '$lib/server/repositories/d1/D1QuestionRepository';
import { D1AnswerRepository } from '$lib/server/repositories/d1/D1AnswerRepository';
import { D1DMRepository } from '$lib/server/repositories/d1/D1DMRepository';
import { D1MemeBallRepository } from '$lib/server/repositories/d1/D1MemeBallRepository';
import { D1RelationRepository } from '$lib/server/repositories/d1/D1RelationRepository';

/**
 * D1 Database Adapter
 * Used for Cloudflare Workers production with D1 database
 * Provides unified access to all D1 repositories
 */
export class D1Adapter {
	public readonly userRepo: IUserRepository;
	public readonly questionRepo: IQuestionRepository;
	public readonly answerRepo: IAnswerRepository;
	public readonly dmRepo: IDMRepository;
	public readonly memeRepo: IMemeBallRepository;
	public readonly relationRepo: IRelationRepository;
	private db: D1Database;

	private constructor(db: D1Database) {
		this.db = db;
		this.userRepo = new D1UserRepository(db);
		this.questionRepo = new D1QuestionRepository(db);
		this.answerRepo = new D1AnswerRepository(db);
		this.dmRepo = new D1DMRepository(db);
		this.memeRepo = new D1MemeBallRepository(db);
		this.relationRepo = new D1RelationRepository(db);
	}

	/**
	 * Create new D1 adapter instance
	 */
	static create(db: D1Database): D1Adapter {
		return new D1Adapter(db);
	}

	/**
	 * Get adapter type
	 */
	getType(): 'd1' {
		return 'd1';
	}

	/**
	 * Get database snapshot - query all tables with 5 most recent rows each
	 */
	async getSnapshot(): Promise<{ [tableName: string]: { count: number; data: any[] } }> {
		try {
			// Get all table names from information_schema
			const tablesResult = await this.db
				.prepare(
					`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
				)
				.all();

			const tableNames = tablesResult.results?.map((row: any) => row.name) || [];
			const result: { [tableName: string]: { count: number; data: any[] } } = {};

			for (const tableName of tableNames) {
				try {
					// Get total row count
					const countResult = await this.db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).first();
					const count = (countResult?.count as number) || 0;

					// Get 5 most recent rows
					let recentRows: any[] = [];
					try {
						const rowsResult = await this.db
							.prepare(`SELECT * FROM "${tableName}" ORDER BY rowid DESC LIMIT 5`)
							.all();
						recentRows = rowsResult.results || [];
					} catch {
						// If that fails, just get any 5 rows
						const rowsResult = await this.db.prepare(`SELECT * FROM "${tableName}" LIMIT 5`).all();
						recentRows = rowsResult.results || [];
					}

					result[tableName] = {
						count,
						data: recentRows.reverse()
					};
				} catch (tableError) {
					console.error(`Error querying table ${tableName}:`, tableError);
					result[tableName] = { count: 0, data: [] };
				}
			}

			return result;
		} catch (error) {
			console.error('[D1Adapter] Snapshot error:', error);
			throw error;
		}
	}
}