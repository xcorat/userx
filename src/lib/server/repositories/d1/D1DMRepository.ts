// D1 DM Repository
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { DMQuestion, DMAnswer, CreateDMQuestionDTO, CreateDMAnswerDTO } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class D1DMRepository implements IDMRepository {
	constructor(private db: D1Database) {}

	private generateId(): string {
		return crypto.randomUUID();
	}

	// DM Questions
	async findAllQuestions(): Promise<DMQuestion[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			ORDER BY created_at DESC
		`).all();
		
		const questions: DMQuestion[] = [];

		for (const row of rows) {
			const choices = await this.getQuestionChoices(row.id as string);
			questions.push({
				id: row.id as string,
				text: row.text as string,
				senderId: row.fromUserId as string,
				recipientId: row.toUserId as string,
				choices: choices.length > 0 ? choices : undefined,
				createdAt: new Date(row.createdAt as string)
			});
		}

		return questions;
	}

	async findQuestionById(id: string): Promise<DMQuestion | null> {
		const row = await this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			WHERE id = ?
		`).bind(id).first();
		
		if (!row) return null;

		const choices = await this.getQuestionChoices(row.id as string);

		return {
			id: row.id as string,
			text: row.text as string,
			senderId: row.fromUserId as string,
			recipientId: row.toUserId as string,
			choices: choices.length > 0 ? choices : undefined,
			createdAt: new Date(row.createdAt as string)
		};
	}

	async findQuestionsByRecipient(userId: string): Promise<DMQuestion[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			WHERE to_user_id = ?
			ORDER BY created_at DESC
		`).bind(userId).all();
		
		const questions: DMQuestion[] = [];

		for (const row of rows) {
			const choices = await this.getQuestionChoices(row.id as string);
			questions.push({
				id: row.id as string,
				text: row.text as string,
				senderId: row.fromUserId as string,
				recipientId: row.toUserId as string,
				choices: choices.length > 0 ? choices : undefined,
				createdAt: new Date(row.createdAt as string)
			});
		}

		return questions;
	}

	async findQuestionsBySender(userId: string): Promise<DMQuestion[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			WHERE from_user_id = ?
			ORDER BY created_at DESC
		`).bind(userId).all();
		
		const questions: DMQuestion[] = [];

		for (const row of rows) {
			const choices = await this.getQuestionChoices(row.id as string);
			questions.push({
				id: row.id as string,
				text: row.text as string,
				senderId: row.fromUserId as string,
				recipientId: row.toUserId as string,
				choices: choices.length > 0 ? choices : undefined,
				createdAt: new Date(row.createdAt as string)
			});
		}

		return questions;
	}

	async createQuestion(data: CreateDMQuestionDTO): Promise<DMQuestion> {
		const questionId = this.generateId();
		const now = new Date().toISOString();

		// Insert question
		await this.db.prepare(`
			INSERT INTO dm_questions (id, text, from_user_id, to_user_id, created_at)
			VALUES (?, ?, ?, ?, ?)
		`).bind(questionId, data.text, data.senderId, data.recipientId, now).run();

		// Insert choices if provided
		if (data.choices && data.choices.length > 0) {
			for (let i = 0; i < data.choices.length; i++) {
				const choiceId = this.generateId();
				await this.db.prepare(`
					INSERT INTO dm_question_choices (id, dm_question_id, text, order_index)
					VALUES (?, ?, ?, ?)
				`).bind(choiceId, questionId, data.choices[i], i).run();
			}
		}

		const question = await this.findQuestionById(questionId);
		if (!question) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create DM question');
		}

		return question;
	}

	async deleteQuestion(id: string): Promise<void> {
		const result = await this.db.prepare('DELETE FROM dm_questions WHERE id = ?').bind(id).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'DM question not found');
		}
	}

	// DM Answers
	async findAllAnswers(): Promise<DMAnswer[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			ORDER BY created_at DESC
		`).all();
		
		return rows.map((row: any) => ({
			id: row.id,
			dmQuestionId: row.dmQuestionId,
			userId: row.userId,
			choiceId: row.choiceId || undefined,
			textAnswer: row.textAnswer || undefined,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findAnswerByQuestion(dmQuestionId: string): Promise<DMAnswer | null> {
		const row = await this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			WHERE dm_question_id = ?
			ORDER BY created_at DESC
			LIMIT 1
		`).bind(dmQuestionId).first();
		
		if (!row) return null;

		return {
			id: row.id as string,
			dmQuestionId: row.dmQuestionId as string,
			userId: row.userId as string,
			choiceId: (row.choiceId as string) || undefined,
			textAnswer: (row.textAnswer as string) || undefined,
			createdAt: new Date(row.createdAt as string)
		};
	}

	async findAnswersByQuestion(dmQuestionId: string): Promise<DMAnswer[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			WHERE dm_question_id = ?
			ORDER BY created_at DESC
		`).bind(dmQuestionId).all();
		
		return rows.map((row: any) => ({
			id: row.id,
			dmQuestionId: row.dmQuestionId,
			userId: row.userId,
			choiceId: row.choiceId || undefined,
			textAnswer: row.textAnswer || undefined,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findAnswerByUserAndQuestion(userId: string, dmQuestionId: string): Promise<DMAnswer | null> {
		const row = await this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			WHERE user_id = ? AND dm_question_id = ?
		`).bind(userId, dmQuestionId).first();
		
		if (!row) return null;

		return {
			id: row.id as string,
			dmQuestionId: row.dmQuestionId as string,
			userId: row.userId as string,
			choiceId: (row.choiceId as string) || undefined,
			textAnswer: (row.textAnswer as string) || undefined,
			createdAt: new Date(row.createdAt as string)
		};
	}

	async createAnswer(data: CreateDMAnswerDTO): Promise<DMAnswer> {
		// Check for duplicate
		const existing = await this.findAnswerByUserAndQuestion(data.userId, data.dmQuestionId);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'User has already answered this DM question');
		}

		const id = this.generateId();
		const now = new Date().toISOString();

		await this.db.prepare(`
			INSERT INTO dm_answers (id, dm_question_id, user_id, choice_id, text_answer, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`).bind(
			id,
			data.dmQuestionId,
			data.userId,
			data.choiceId || null,
			data.textAnswer || null,
			now
		).run();

		const answer = await this.findAnswerByUserAndQuestion(data.userId, data.dmQuestionId);
		if (!answer) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create DM answer');
		}

		return answer;
	}

	async deleteAnswer(id: string): Promise<void> {
		const result = await this.db.prepare('DELETE FROM dm_answers WHERE id = ?').bind(id).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'DM answer not found');
		}
	}

	private async getQuestionChoices(dmQuestionId: string): Promise<Array<{ id: string; text: string; order: number }>> {
		const { results } = await this.db.prepare(`
			SELECT id, text, order_index as "order"
			FROM dm_question_choices
			WHERE dm_question_id = ?
			ORDER BY order_index
		`).bind(dmQuestionId).all();

		return results.map((row: any) => ({
			id: row.id as string,
			text: row.text as string,
			order: row.order as number
		}));
	}
}
