// D1 Question Repository
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { PublicQuestion, CreateQuestionDTO, QuestionChoice, QuestionImage } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class D1QuestionRepository implements IQuestionRepository {
	constructor(private db: D1Database) {}

	private generateId(): string {
		return crypto.randomUUID();
	}

	async findAll(): Promise<PublicQuestion[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT pq.id, pq.text, pq.image_hash_id as imageHashId, pq.created_by as createdBy, pq.created_at as createdAt
			FROM public_questions pq
			ORDER BY pq.created_at DESC
		`).all();
		
		const questions: PublicQuestion[] = [];

		for (const row of rows) {
			const choices = await this.getChoices(row.id as string);
			questions.push({
				id: row.id as string,
				text: row.text as string,
				choices,
				imageHashId: (row.imageHashId as string) || undefined,
				createdBy: row.createdBy as string,
				createdAt: new Date(row.createdAt as string)
			});
		}

		return questions;
	}

	async findById(id: string): Promise<PublicQuestion | null> {
		const row = await this.db.prepare(`
			SELECT pq.id, pq.text, pq.image_hash_id as imageHashId, pq.created_by as createdBy, pq.created_at as createdAt
			FROM public_questions pq
			WHERE pq.id = ?
		`).bind(id).first();
		
		if (!row) return null;

		const choices = await this.getChoices(row.id as string);

		return {
			id: row.id as string,
			text: row.text as string,
			choices,
			imageHashId: (row.imageHashId as string) || undefined,
			createdBy: row.createdBy as string,
			createdAt: new Date(row.createdAt as string)
		};
	}

	async findByCreator(userId: string): Promise<PublicQuestion[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT pq.id, pq.text, pq.image_hash_id as imageHashId, pq.created_by as createdBy, pq.created_at as createdAt
			FROM public_questions pq
			WHERE pq.created_by = ?
			ORDER BY pq.created_at DESC
		`).bind(userId).all();
		
		const questions: PublicQuestion[] = [];

		for (const row of rows) {
			const choices = await this.getChoices(row.id as string);
			questions.push({
				id: row.id as string,
				text: row.text as string,
				choices,
				imageHashId: (row.imageHashId as string) || undefined,
				createdBy: row.createdBy as string,
				createdAt: new Date(row.createdAt as string)
			});
		}

		return questions;
	}

	async create(data: CreateQuestionDTO): Promise<PublicQuestion> {
		const questionId = this.generateId();
		const now = new Date().toISOString();
		let imageHashId: string | null = null;

		// Handle image if provided
		if (data.imageUrl) {
			imageHashId = 'img_' + this.generateId();
			
			// Insert image record
			await this.db.prepare(`
				INSERT INTO question_images (id, question_id, image_url, uploaded_at)
				VALUES (?, ?, ?, ?)
			`).bind(imageHashId, questionId, data.imageUrl, now).run();
		}

		// Insert question
		await this.db.prepare(`
			INSERT INTO public_questions (id, text, image_hash_id, created_by, created_at)
			VALUES (?, ?, ?, ?, ?)
		`).bind(questionId, data.text, imageHashId, data.createdBy, now).run();

		// Insert choices
		for (let i = 0; i < data.choices.length; i++) {
			const choiceId = this.generateId();
			await this.db.prepare(`
				INSERT INTO question_choices (id, question_id, text, order_index)
				VALUES (?, ?, ?, ?)
			`).bind(choiceId, questionId, data.choices[i].text, i).run();
		}

		const question = await this.findById(questionId);
		if (!question) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create question');
		}

		return question;
	}

	async delete(id: string): Promise<void> {
		const result = await this.db.prepare('DELETE FROM public_questions WHERE id = ?').bind(id).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Question not found');
		}
	}

	async findImageByQuestion(questionId: string): Promise<QuestionImage | null> {
		const row = await this.db.prepare(`
			SELECT id as hashId, image_url as imageUrl, uploaded_at as uploadedAt
			FROM question_images
			WHERE question_id = ?
		`).bind(questionId).first();
		
		if (!row) return null;

		return {
			hashId: row.hashId as string,
			imageUrl: row.imageUrl as string,
			uploadedAt: new Date(row.uploadedAt as string)
		};
	}

	private async getChoices(questionId: string): Promise<QuestionChoice[]> {
		const { results } = await this.db.prepare(`
			SELECT id, text, order_index as "order"
			FROM question_choices
			WHERE question_id = ?
			ORDER BY order_index
		`).bind(questionId).all();

		return results.map((row: any) => ({
			id: row.id as string,
			text: row.text as string,
			order: row.order as number
		}));
	}
}
