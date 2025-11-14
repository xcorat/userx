// D1 Answer Repository
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { PublicAnswer, CreateAnswerDTO } from '$lib/models';
import { AnswerVisibility } from '$lib/models/types';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class D1AnswerRepository implements IAnswerRepository {
	constructor(private db: D1Database) {}

	private generateId(): string {
		return crypto.randomUUID();
	}

	async findAll(): Promise<PublicAnswer[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			ORDER BY created_at DESC
		`).all();
		
		return rows.map((row: any) => ({
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findById(id: string): Promise<PublicAnswer | null> {
		const row = await this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE id = ?
		`).bind(id).first();
		
		if (!row) return null;

		return {
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt as string)
		} as PublicAnswer;
	}

	async findByUser(userId: string): Promise<PublicAnswer[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE user_id = ?
			ORDER BY created_at DESC
		`).bind(userId).all();
		
		return rows.map((row: any) => ({
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findByQuestion(questionId: string): Promise<PublicAnswer[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE question_id = ?
			ORDER BY created_at DESC
		`).bind(questionId).all();
		
		return rows.map((row: any) => ({
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findByUserAndQuestion(userId: string, questionId: string): Promise<PublicAnswer | null> {
		const row = await this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE user_id = ? AND question_id = ?
		`).bind(userId, questionId).first();
		
		if (!row) return null;

		return {
			...row,
			visibility: row.visibility as AnswerVisibility,
			createdAt: new Date(row.createdAt as string)
		} as PublicAnswer;
	}

	async findPublicByQuestion(questionId: string): Promise<PublicAnswer[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, user_id as userId, question_id as questionId,
			       choice_id as choiceId, visibility, created_at as createdAt
			FROM public_answers
			WHERE question_id = ? AND visibility = 'public'
			ORDER BY created_at DESC
		`).bind(questionId).all();
		
		return rows.map((row: any) => ({
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

		await this.db.prepare(`
			INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`).bind(id, data.userId, data.questionId, data.choiceId, data.visibility, now).run();

		const answer = await this.findByUserAndQuestion(data.userId, data.questionId);
		if (!answer) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create answer');
		}

		return answer;
	}

	async updateVisibility(id: string, visibility: AnswerVisibility): Promise<PublicAnswer> {
		const result = await this.db.prepare(`
			UPDATE public_answers
			SET visibility = ?
			WHERE id = ?
		`).bind(visibility, id).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Answer not found');
		}

		const answer = await this.findById(id);
		if (!answer) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to update answer visibility');
		}

		return answer;
	}

	async delete(id: string): Promise<void> {
		const result = await this.db.prepare('DELETE FROM public_answers WHERE id = ?').bind(id).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Answer not found');
		}
	}
}
