// SQLite Answer Repository
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { PublicAnswer, CreateAnswerDTO } from '$lib/models';
import { AnswerVisibility } from '$lib/models/types';
import { AppError, ErrorCode } from '$lib/utils/error-handling';
import type Database from 'better-sqlite3';

export class SQLiteAnswerRepository implements IAnswerRepository {
	private db: Database.Database;
	private generateId: () => string;

	constructor(database: Database.Database, generateIdFn: () => string) {
		this.db = database;
		this.generateId = generateIdFn;
	}

	async findAll(): Promise<PublicAnswer[]> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all() as any[];
		return Promise.resolve(rows.map((row) => ({
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		})));
	}

	async findById(id: string): Promise<PublicAnswer | null> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE id = ?
		`);
		
		const row = stmt.get(id) as any;
		if (!row) return null;

		return {
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		};
	}

	async findByUser(userId: string): Promise<PublicAnswer[]> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE user_id = ?
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all(userId) as any[];
		return rows.map((row) => ({
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findByQuestion(questionId: string): Promise<PublicAnswer[]> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE question_id = ?
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all(questionId) as any[];
		return rows.map((row) => ({
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findByUserAndQuestion(userId: string, questionId: string): Promise<PublicAnswer | null> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE user_id = ? AND question_id = ?
		`);
		
		const row = stmt.get(userId, questionId) as any;
		if (!row) return null;

		return {
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		};
	}

	async findPublicByQuestion(questionId: string): Promise<PublicAnswer[]> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE question_id = ? AND visibility = 'public'
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all(questionId) as any[];
		return rows.map((row) => ({
			...row,
			visibility: AnswerVisibility.PUBLIC,
			createdAt: new Date(row.createdAt)
		}));
	}

	async create(data: CreateAnswerDTO): Promise<PublicAnswer> {
		// Check for duplicate
		const existing = await this.findByUserAndQuestion(data.userId, data.questionId);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'User has already answered this question');
		}

		const id = this.generateId();
		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
			INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`);

		stmt.run(id, data.userId, data.questionId, data.choiceId, data.visibility, now);

		const answer = await this.findByUserAndQuestion(data.userId, data.questionId);
		if (!answer) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create answer');
		}

		return answer;
	}

	async updateVisibility(id: string, visibility: AnswerVisibility): Promise<PublicAnswer> {
		const stmt = this.db.prepare(`
			UPDATE public_answers
			SET visibility = ?
			WHERE id = ?
		`);

		const result = stmt.run(visibility, id);

		if (result.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Answer not found');
		}

		// Find and return the updated answer
		const findStmt = this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE id = ?
		`);

		const row = findStmt.get(id) as any;
		return {
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		};
	}

	async delete(id: string): Promise<void> {
		const stmt = this.db.prepare('DELETE FROM public_answers WHERE id = ?');
		const result = stmt.run(id);

		if (result.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Answer not found');
		}
	}
}
