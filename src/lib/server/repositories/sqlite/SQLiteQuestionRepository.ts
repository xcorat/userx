// SQLite Question Repository
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { PublicQuestion, CreateQuestionDTO, QuestionChoice } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';
import type Database from 'better-sqlite3';

export class SQLiteQuestionRepository implements IQuestionRepository {
	private db: Database.Database;
	private generateId: () => string;

	constructor(database: Database.Database, generateIdFn: () => string) {
		this.db = database;
		this.generateId = generateIdFn;
	}

	async findAll(): Promise<PublicQuestion[]> {
		const stmt = this.db.prepare(`
			SELECT id, text, created_by as createdBy, created_at as createdAt
			FROM public_questions
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all() as any[];
		const questions: PublicQuestion[] = [];

		for (const row of rows) {
			const choices = this.getChoices(row.id);
			questions.push({
				id: row.id,
				text: row.text,
				choices,
				createdBy: row.createdBy,
				createdAt: new Date(row.createdAt)
			});
		}

		return questions;
	}

	async findById(id: string): Promise<PublicQuestion | null> {
		const stmt = this.db.prepare(`
			SELECT id, text, created_by as createdBy, created_at as createdAt
			FROM public_questions
			WHERE id = ?
		`);
		
		const row = stmt.get(id) as any;
		if (!row) return null;

		const choices = this.getChoices(row.id);

		return {
			id: row.id,
			text: row.text,
			choices,
			createdBy: row.createdBy,
			createdAt: new Date(row.createdAt)
		};
	}

	async findByCreator(userId: string): Promise<PublicQuestion[]> {
		const stmt = this.db.prepare(`
			SELECT id, text, created_by as createdBy, created_at as createdAt
			FROM public_questions
			WHERE created_by = ?
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all(userId) as any[];
		const questions: PublicQuestion[] = [];

		for (const row of rows) {
			const choices = this.getChoices(row.id);
			questions.push({
				id: row.id,
				text: row.text,
				choices,
				createdBy: row.createdBy,
				createdAt: new Date(row.createdAt)
			});
		}

		return questions;
	}

	async create(data: CreateQuestionDTO): Promise<PublicQuestion> {
		const questionId = this.generateId();
		const now = new Date().toISOString();

		// Validate required fields
		if (!data.text?.trim() || !data.createdBy) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Question text and createdBy are required');
		}

		if (!Array.isArray(data.choices) || data.choices.length === 0) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'At least one choice is required');
		}

		// Insert question
		const insertQuestion = this.db.prepare(`
			INSERT INTO public_questions (id, text, created_by, created_at)
			VALUES (?, ?, ?, ?)
		`);

		insertQuestion.run(questionId, data.text, data.createdBy, now);

		// Insert choices
		const insertChoice = this.db.prepare(`
			INSERT INTO question_choices (id, question_id, text, order_index)
			VALUES (?, ?, ?, ?)
		`);

		for (let i = 0; i < data.choices.length; i++) {
			const choiceId = this.generateId();
			insertChoice.run(choiceId, questionId, data.choices[i].text, i);
		}

		const question = await this.findById(questionId);
		if (!question) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create question');
		}

		return question;
	}

	async delete(id: string): Promise<void> {
		const stmt = this.db.prepare('DELETE FROM public_questions WHERE id = ?');
		const result = stmt.run(id);

		if (result.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Question not found');
		}
	}

	private getChoices(questionId: string) {
		const stmt = this.db.prepare(`
			SELECT id, text, order_index as "order"
			FROM question_choices
			WHERE question_id = ?
			ORDER BY order_index
		`);

		return stmt.all(questionId) as Array<{ id: string; text: string; order: number }>;
	}
}
