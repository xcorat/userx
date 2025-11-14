// Database connection and initialization
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mockUsers, mockQuestions, mockAnswers, mockDMQuestions, mockDMAnswers } from '$lib/repositories/implementations/mock/mock-data';
import type { PublicQuestion } from '$lib/models';

const DB_PATH = 'qna-app.db';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
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
	
	// Seed users (generate username from name)
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

export function closeDatabase() {
	if (db) {
		db.close();
		db = null;
	}
}

// Generate UUID v4
export function generateId(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
