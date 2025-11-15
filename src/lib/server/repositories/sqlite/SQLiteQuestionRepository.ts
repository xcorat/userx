// SQLite Question Repository
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { PublicQuestion, CreateQuestionDTO, QuestionChoice, QuestionImage } from '$lib/models';
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
			SELECT id, text, COALESCE(image_hash_id, NULL) as imageHashId, created_by as createdBy, created_at as createdAt
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
				imageHashId: row.imageHashId || undefined,
				createdBy: row.createdBy,
				createdAt: new Date(row.createdAt)
			});
		}

		return questions;
	}

	async findById(id: string): Promise<PublicQuestion | null> {
		const stmt = this.db.prepare(`
			SELECT id, text, COALESCE(image_hash_id, NULL) as imageHashId, created_by as createdBy, created_at as createdAt
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
			imageHashId: row.imageHashId || undefined,
			createdBy: row.createdBy,
			createdAt: new Date(row.createdAt)
		};
	}

	async findByCreator(userId: string): Promise<PublicQuestion[]> {
		const stmt = this.db.prepare(`
			SELECT id, text, COALESCE(image_hash_id, NULL) as imageHashId, created_by as createdBy, created_at as createdAt
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
				imageHashId: row.imageHashId || undefined,
				createdBy: row.createdBy,
				createdAt: new Date(row.createdAt)
			});
		}

		return questions;
	}

	async create(data: CreateQuestionDTO): Promise<PublicQuestion> {
		const questionId = this.generateId();
		const now = new Date().toISOString();
		let imageHashId: string | null = null;

		// Validate required fields
		if (!data.text?.trim() || !data.createdBy) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Question text and createdBy are required');
		}

		if (!Array.isArray(data.choices) || data.choices.length === 0) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'At least one choice is required');
		}

		// Insert question FIRST (without image reference)
		const insertQuestion = this.db.prepare(`
			INSERT INTO public_questions (id, text, image_hash_id, created_by, created_at)
			VALUES (?, ?, ?, ?, ?)
		`);

		insertQuestion.run(questionId, data.text, null, data.createdBy, now);

		// Handle image if provided - INSERT AFTER question exists
		if (data.imageUrl) {
			imageHashId = 'img_' + this.generateId();
			
			// Insert image record (content-addressed, no FK constraint)
			const insertImage = this.db.prepare(`
				INSERT INTO question_images (id, image_url, uploaded_at)
				VALUES (?, ?, ?)
			`);
			insertImage.run(imageHashId, data.imageUrl, now);

			// Update question with image_hash_id
			const updateQuestion = this.db.prepare(`
				UPDATE public_questions SET image_hash_id = ? WHERE id = ?
			`);
			updateQuestion.run(imageHashId, questionId);
		}

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

	async findImageByQuestion(questionId: string): Promise<QuestionImage | null> {
		// First get the question to find its image_hash_id
		const questionStmt = this.db.prepare(`
			SELECT image_hash_id FROM public_questions WHERE id = ?
		`);
		const questionRow = questionStmt.get(questionId) as any;
		
		if (!questionRow?.image_hash_id) return null;
		
		// Then get the image by its hash ID
		const imageStmt = this.db.prepare(`
			SELECT id as hashId, image_url as imageUrl, uploaded_at as uploadedAt
			FROM question_images
			WHERE id = ?
		`);
		
		const row = imageStmt.get(questionRow.image_hash_id) as any;
		if (!row) return null;

		return {
			hashId: row.hashId,
			imageUrl: row.imageUrl,
			uploadedAt: new Date(row.uploadedAt)
		};
	}

	private getChoices(questionId: string): QuestionChoice[] {
		const stmt = this.db.prepare(`
			SELECT id, text, order_index as "order"
			FROM question_choices
			WHERE question_id = ?
			ORDER BY order_index
		`);

		return stmt.all(questionId) as Array<{ id: string; text: string; order: number }>;
	}
}
