// SQLite Database Adapter
// Encapsulates all SQLite repositories for local development

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mockUsers, mockQuestions, mockAnswers, mockDMQuestions, mockDMAnswers, mockMemes, mockMemeInteractions } from '$lib/repositories/implementations/mock/mock-data';
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';

import { SQLiteUserRepository } from '$lib/server/repositories/sqlite/SQLiteUserRepository';
import { SQLiteQuestionRepository } from '$lib/server/repositories/sqlite/SQLiteQuestionRepository';
import { SQLiteAnswerRepository } from '$lib/server/repositories/sqlite/SQLiteAnswerRepository';
import { SQLiteDMRepository } from '$lib/server/repositories/sqlite/SQLiteDMRepository';
import { SQLiteMemeBallRepository } from '$lib/server/repositories/sqlite/SQLiteMemeBallRepository';
import { SQLiteRelationRepository } from '$lib/server/repositories/sqlite/SQLiteRelationRepository';

const DB_PATH = 'qna-app.db';
let db: Database.Database | null = null;

/**
 * Get SQLite database instance (internal to adapter)
 */
function getDatabase(): Database.Database {
	if (!db) {
		try {
			console.log(`[SQLite] Initializing database at: ${DB_PATH}`);
			db = new Database(DB_PATH);
			console.log('[SQLite] Database connection established');
			
			db.pragma('journal_mode = WAL');
			db.pragma('foreign_keys = ON');
			console.log('[SQLite] Pragmas configured (WAL mode, foreign keys enabled)');
			
			initializeDatabase(db);
		} catch (error) {
			console.error('[SQLite] Fatal error initializing database:', error);
			db = null;
			throw error;
		}
	}
	return db;
}

function initializeDatabase(database: Database.Database) {
	try {
		// Check if database is already initialized
		const tableCheck = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
		
		if (!tableCheck) {
			console.log('Initializing database schema...');
			
			try {
				// Read and execute schema
				const schemaPath = join(process.cwd(), 'src/lib/server/db/schema.sql');
				console.log(`Reading schema from: ${schemaPath}`);
				const schema = readFileSync(schemaPath, 'utf-8');
				console.log(`Schema loaded successfully (${schema.length} bytes)`);
				
				// Execute schema statements
				database.exec(schema);
				console.log('Schema executed successfully');
				
				// Seed with mock data
				seedDatabase(database);
				
				console.log('Database initialized successfully');
			} catch (schemaError) {
				console.error('Error during schema initialization:', schemaError);
				throw schemaError;
			}
		} else {
			console.log('Database already initialized, skipping schema creation');
		}
	} catch (error) {
		console.error('Fatal error initializing database:', error);
		throw error;
	}
}

function seedDatabase(database: Database.Database) {
	try {
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
		
		const insertMeme = database.prepare(`
			INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`);
		
		const insertMemeInteraction = database.prepare(`
			INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at)
			VALUES (?, ?, ?, ?, ?)
		`);
		
		// Seed users
		console.log(`Seeding ${mockUsers.length} users...`);
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
		console.log(`✓ Users seeded`);
		
		// Seed public questions and choices
		console.log(`Seeding ${mockQuestions.length} questions...`);
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
	
	// Seed users with exact UUIDs from mock data
	for (const user of mockUsers) {
		insertUser.run(
			user.id, // Use exact UUID from mock data
			user.username,
			user.name,
			user.email,
			'password', // Default password for all users
			user.avatarUrl || null,
			user.createdAt.toISOString(),
			user.createdAt.toISOString()
		);
	}
	
	// Seed public questions and choices with exact IDs from mock data
	for (const question of mockQuestions) {
		insertQuestion.run(
			question.id, // Use exact ID from mock data
			question.text,
			question.createdBy, // This now matches the deterministic user UUIDs
			question.createdAt.toISOString()
		);
		
		for (const choice of question.choices) {
			insertChoice.run(
				choice.id, // Use exact ID from mock data
				question.id,
				choice.text,
				choice.order
			);
		}
	}
	
	// Seed public answers with exact IDs from mock data
	for (const answer of mockAnswers) {
		insertAnswer.run(
			answer.id, // Use exact ID from mock data
			answer.userId,
			answer.questionId,
			answer.choiceId,
			answer.visibility,
			answer.createdAt.toISOString()
		);
	}
	
	// Seed DM questions and choices with exact IDs from mock data
	for (const dmQuestion of mockDMQuestions) {
		insertDMQuestion.run(
			dmQuestion.id, // Use exact ID from mock data
			dmQuestion.text,
			dmQuestion.senderId,
			dmQuestion.recipientId,
			dmQuestion.createdAt.toISOString()
		);
		
		if (dmQuestion.choices) {
			for (const choice of dmQuestion.choices) {
				insertDMChoice.run(
					choice.id, // Use exact ID from mock data
					dmQuestion.id,
					choice.text,
					choice.order
				);
			}
		}
		console.log(`✓ Questions seeded`);
		
		// Seed public answers
		console.log(`Seeding ${mockAnswers.length} answers...`);
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
		console.log(`✓ Answers seeded`);
		
		// Seed DM questions and choices
		console.log(`Seeding ${mockDMQuestions.length} DM questions...`);
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
		console.log(`✓ DM questions seeded`);
		
		// Seed DM answers
		console.log(`Seeding ${mockDMAnswers.length} DM answers...`);
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
		console.log(`✓ DM answers seeded`);
		
		// Seed memes using mock data
		console.log(`Seeding ${mockMemes.length} memes...`);
		for (const meme of mockMemes) {
			insertMeme.run(
				meme.id,
				meme.contentHash,
				meme.imageUrl,
				meme.altText || null,
				meme.submittedBy,
				meme.submittedAt.toISOString()
			);
		}
		console.log(`✓ Memes seeded`);
		
		// Seed meme interactions using mock data
		console.log(`Seeding ${mockMemeInteractions.length} meme interactions...`);
		for (const interaction of mockMemeInteractions) {
			insertMemeInteraction.run(
				interaction.id,
				interaction.userId,
				interaction.memeId,
				interaction.interactionType,
				interaction.interactedAt.toISOString()
			);
		}
		console.log(`✓ Meme interactions seeded`);
		
		console.log('✓ Database seeding completed successfully');
	} catch (error) {
		console.error('Error seeding database:', error);
		throw error;
	}
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
	public readonly memeRepo: IMemeBallRepository;
	public readonly relationRepo: IRelationRepository;

	private constructor() {
		// Initialize database connection
		const database = getDatabase();
		
		// Use a simple counter-based ID generator for new records
		const generateId = () => `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		this.userRepo = new SQLiteUserRepository(database, generateId);
		this.questionRepo = new SQLiteQuestionRepository(database, generateId);
		this.answerRepo = new SQLiteAnswerRepository(database, generateId);
		this.dmRepo = new SQLiteDMRepository(database, generateId);
		this.memeRepo = new SQLiteMemeBallRepository(database, generateId);
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