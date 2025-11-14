// SQLite DM Repository
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { DMQuestion, DMAnswer, CreateDMQuestionDTO, CreateDMAnswerDTO } from '$lib/models';
import { getDatabase, generateId } from '$lib/server/db/database';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class SQLiteDMRepository implements IDMRepository {
	private get db() {
		return getDatabase();
	}

	// DM Questions
	async findAllQuestions(): Promise<DMQuestion[]> {
		const stmt = this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all() as any[];
		const questions: DMQuestion[] = [];

		for (const row of rows) {
			const choices = this.getQuestionChoices(row.id);
			questions.push({
				id: row.id,
				text: row.text,
				senderId: row.fromUserId,
				recipientId: row.toUserId,
				choices: choices.length > 0 ? choices : undefined,
				createdAt: new Date(row.createdAt)
			});
		}

		return questions;
	}

	async findQuestionById(id: string): Promise<DMQuestion | null> {
		const stmt = this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			WHERE id = ?
		`);
		
		const row = stmt.get(id) as any;
		if (!row) return null;

		const choices = this.getQuestionChoices(row.id);

		return {
			id: row.id,
			text: row.text,
			senderId: row.fromUserId,
			recipientId: row.toUserId,
			choices: choices.length > 0 ? choices : undefined,
			createdAt: new Date(row.createdAt)
		};
	}

	async findQuestionsByRecipient(userId: string): Promise<DMQuestion[]> {
		const stmt = this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			WHERE to_user_id = ?
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all(userId) as any[];
		const questions: DMQuestion[] = [];

		for (const row of rows) {
			const choices = this.getQuestionChoices(row.id);
			questions.push({
				id: row.id,
				text: row.text,
				senderId: row.fromUserId,
				recipientId: row.toUserId,
				choices: choices.length > 0 ? choices : undefined,
				createdAt: new Date(row.createdAt)
			});
		}

		return questions;
	}

	async findQuestionsBySender(userId: string): Promise<DMQuestion[]> {
		const stmt = this.db.prepare(`
			SELECT id, text, from_user_id as fromUserId, to_user_id as toUserId,
			       created_at as createdAt
			FROM dm_questions
			WHERE from_user_id = ?
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all(userId) as any[];
		const questions: DMQuestion[] = [];

		for (const row of rows) {
			const choices = this.getQuestionChoices(row.id);
			questions.push({
				id: row.id,
				text: row.text,
				senderId: row.fromUserId,
				recipientId: row.toUserId,
				choices: choices.length > 0 ? choices : undefined,
				createdAt: new Date(row.createdAt)
			});
		}

		return questions;
	}

	async createQuestion(data: CreateDMQuestionDTO): Promise<DMQuestion> {
		const questionId = generateId();
		const now = new Date().toISOString();

		// Insert question
		const insertQuestion = this.db.prepare(`
			INSERT INTO dm_questions (id, text, from_user_id, to_user_id, created_at)
			VALUES (?, ?, ?, ?, ?)
		`);

		insertQuestion.run(questionId, data.text, data.senderId, data.recipientId, now);

		// Insert choices if provided
		if (data.choices && data.choices.length > 0) {
			const insertChoice = this.db.prepare(`
				INSERT INTO dm_question_choices (id, dm_question_id, text, order_index)
				VALUES (?, ?, ?, ?)
			`);

			for (let i = 0; i < data.choices.length; i++) {
				const choiceId = generateId();
				insertChoice.run(choiceId, questionId, data.choices[i], i);
			}
		}

		const question = await this.findQuestionById(questionId);
		if (!question) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create DM question');
		}

		return question;
	}

	async deleteQuestion(id: string): Promise<void> {
		const stmt = this.db.prepare('DELETE FROM dm_questions WHERE id = ?');
		const result = stmt.run(id);

		if (result.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'DM question not found');
		}
	}

	// DM Answers
	async findAllAnswers(): Promise<DMAnswer[]> {
		const stmt = this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all() as any[];
		return rows.map((row) => ({
			id: row.id,
			dmQuestionId: row.dmQuestionId,
			userId: row.userId,
			choiceId: row.choiceId || undefined,
			textAnswer: row.textAnswer || undefined,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findAnswerByQuestion(dmQuestionId: string): Promise<DMAnswer | null> {
		const stmt = this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			WHERE dm_question_id = ?
			ORDER BY created_at DESC
			LIMIT 1
		`);
		
		const row = stmt.get(dmQuestionId) as any;
		if (!row) return null;

		return {
			id: row.id,
			dmQuestionId: row.dmQuestionId,
			userId: row.userId,
			choiceId: row.choiceId || undefined,
			textAnswer: row.textAnswer || undefined,
			createdAt: new Date(row.createdAt)
		};
	}

	async findAnswersByQuestion(dmQuestionId: string): Promise<DMAnswer[]> {
		const stmt = this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			WHERE dm_question_id = ?
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all(dmQuestionId) as any[];
		return rows.map((row) => ({
			id: row.id,
			dmQuestionId: row.dmQuestionId,
			userId: row.userId,
			choiceId: row.choiceId || undefined,
			textAnswer: row.textAnswer || undefined,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findAnswerByUserAndQuestion(userId: string, dmQuestionId: string): Promise<DMAnswer | null> {
		const stmt = this.db.prepare(`
			SELECT id, dm_question_id as dmQuestionId, user_id as userId,
			       choice_id as choiceId, text_answer as textAnswer, created_at as createdAt
			FROM dm_answers
			WHERE user_id = ? AND dm_question_id = ?
		`);
		
		const row = stmt.get(userId, dmQuestionId) as any;
		if (!row) return null;

		return {
			id: row.id,
			dmQuestionId: row.dmQuestionId,
			userId: row.userId,
			choiceId: row.choiceId || undefined,
			textAnswer: row.textAnswer || undefined,
			createdAt: new Date(row.createdAt)
		};
	}

	async createAnswer(data: CreateDMAnswerDTO): Promise<DMAnswer> {
		// Check for duplicate
		const existing = await this.findAnswerByUserAndQuestion(data.userId, data.dmQuestionId);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'User has already answered this DM question');
		}

		const id = generateId();
		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
			INSERT INTO dm_answers (id, dm_question_id, user_id, choice_id, text_answer, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`);

		stmt.run(
			id,
			data.dmQuestionId,
			data.userId,
			data.choiceId || null,
			data.textAnswer || null,
			now
		);

		const answer = await this.findAnswerByUserAndQuestion(data.userId, data.dmQuestionId);
		if (!answer) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create DM answer');
		}

		return answer;
	}

	async deleteAnswer(id: string): Promise<void> {
		const stmt = this.db.prepare('DELETE FROM dm_answers WHERE id = ?');
		const result = stmt.run(id);

		if (result.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'DM answer not found');
		}
	}

	private getQuestionChoices(dmQuestionId: string) {
		const stmt = this.db.prepare(`
			SELECT id, text, order_index as "order"
			FROM dm_question_choices
			WHERE dm_question_id = ?
			ORDER BY order_index
		`);

		return stmt.all(dmQuestionId) as Array<{ id: string; text: string; order: number }>;
	}
}
