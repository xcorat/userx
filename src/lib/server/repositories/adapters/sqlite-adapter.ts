// SQLite Database Adapter
// Encapsulates all SQLite repositories for local development

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mockUsers, mockQuestions, mockAnswers, mockDMQuestions, mockDMAnswers } from '$lib/repositories/implementations/mock/mock-data';
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';

import { SQLiteUserRepository } from '$lib/server/repositories/sqlite/SQLiteUserRepository';
import { SQLiteQuestionRepository } from '$lib/server/repositories/sqlite/SQLiteQuestionRepository';
import { SQLiteAnswerRepository } from '$lib/server/repositories/sqlite/SQLiteAnswerRepository';
import { SQLiteDMRepository } from '$lib/server/repositories/sqlite/SQLiteDMRepository';
import { SQLiteRelationRepository } from '$lib/server/repositories/sqlite/SQLiteRelationRepository';

const DB_PATH = 'qna-app.db';
let db: Database.Database | null = null;

/**
 * Get SQLite database instance (internal to adapter)
 */
function getDatabase(): Database.Database {
	if (!db) {
		db = new Database(DB_PATH);
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		initializeDatabase(db);
	}
	return db;
}

function initializeDatabase(database: Database.Database) {
	// Check if database is already initialized
	const tableCheck = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
	
	if (!tableCheck) {
		console.log('Initializing database schema...');
		
		// Read and execute schema
		const schemaPath = join(process.cwd(), 'src/lib/server/db/schema.sql');
		const schema = readFileSync(schemaPath, 'utf-8');
		
		// Execute schema statements
		database.exec(schema);
		
		// Seed with mock data
		seedDatabase(database);
		
		console.log('Database initialized successfully');
	}
}

function seedDatabase(database: Database.Database) {
	console.log('Seeding database with mock data...');
	
	const insertUser = database.prepare(`
		INSERT INTO users (id, username, name, email, password, avatar_url, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);
	
	const insertQuestion = database.prepare(`
		INSERT INTO public_questions (id, text, created_by, created_at)
		VALUES (?, ?, ?, ?)
	`);
	
	const insertChoice = database.prepare(`
		INSERT INTO question_choices (id, question_id, text, order_index)
		VALUES (?, ?, ?, ?)
	`);
	
	const insertAnswer = database.prepare(`
		INSERT INTO public_answers (id, user_id, question_id, choice_id, visibility, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`);
	
	const insertDMQuestion = database.prepare(`
		INSERT INTO dm_questions (id, text, from_user_id, to_user_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`);
	
	const insertDMChoice = database.prepare(`
		INSERT INTO dm_question_choices (id, dm_question_id, text, order_index)
		VALUES (?, ?, ?, ?)
	`);
	
	const insertDMAnswer = database.prepare(`
		INSERT INTO dm_answers (id, dm_question_id, user_id, choice_id, text_answer, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`);
	
	// Seed users
	for (const user of mockUsers) {
		insertUser.run(
			user.id,
			user.username,
			user.name,
			user.email,
			'password', // Default password for all users
			user.avatarUrl || null,
			user.createdAt.toISOString(),
			user.createdAt.toISOString()
		);
	}
	
	// Seed public questions and choices
	for (const question of mockQuestions) {
		insertQuestion.run(
			question.id,
			question.text,
			question.createdBy,
			question.createdAt.toISOString()
		);
		
		for (const choice of question.choices) {
			insertChoice.run(
				choice.id,
				question.id,
				choice.text,
				choice.order
			);
		}
	}
	
	// Seed public answers
	for (const answer of mockAnswers) {
		insertAnswer.run(
			answer.id,
			answer.userId,
			answer.questionId,
			answer.choiceId,
			answer.visibility,
			answer.createdAt.toISOString()
		);
	}
	
	// Seed DM questions and choices
	for (const dmQuestion of mockDMQuestions) {
		insertDMQuestion.run(
			dmQuestion.id,
			dmQuestion.text,
			dmQuestion.senderId,
			dmQuestion.recipientId,
			dmQuestion.createdAt.toISOString()
		);
		
		if (dmQuestion.choices) {
			for (const choice of dmQuestion.choices) {
				insertDMChoice.run(
					choice.id,
					dmQuestion.id,
					choice.text,
					choice.order
				);
			}
		}
	}
	
	// Seed DM answers
	for (const dmAnswer of mockDMAnswers) {
		insertDMAnswer.run(
			dmAnswer.id,
			dmAnswer.dmQuestionId,
			dmAnswer.userId,
			dmAnswer.choiceId || null,
			dmAnswer.textAnswer || null,
			dmAnswer.createdAt.toISOString()
		);
	}
	
	console.log(`Seeded ${mockUsers.length} users, ${mockQuestions.length} questions, ${mockAnswers.length} answers`);
}

// Generate UUID v4
function generateId(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

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
	public readonly relationRepo: IRelationRepository;

	private constructor() {
		// Initialize database connection
		const database = getDatabase();
		
		this.userRepo = new SQLiteUserRepository(database, generateId);
		this.questionRepo = new SQLiteQuestionRepository(database, generateId);
		this.answerRepo = new SQLiteAnswerRepository(database, generateId);
		this.dmRepo = new SQLiteDMRepository(database, generateId);
		this.relationRepo = new SQLiteRelationRepository(database, generateId);
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

	/**
	 * Close database connection
	 */
	close(): void {
		if (db) {
			db.close();
			db = null;
		}
	}
}