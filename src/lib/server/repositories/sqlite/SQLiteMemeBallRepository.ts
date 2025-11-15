// SQLite Memeball Repository
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';
import type {
	Meme,
	CreateMemeDTO,
	MemeWithStats,
	MemeInteraction,
	CreateMemeInteractionDTO,
	UserMemeStats,
	DailyMemeStats
} from '$lib/models/meme.model';
import { MemeInteractionType } from '$lib/models/meme.model';
import { AppError, ErrorCode } from '$lib/utils/error-handling';
import type Database from 'better-sqlite3';

export class SQLiteMemeBallRepository implements IMemeBallRepository {
	private db: Database.Database;
	private generateId: () => string;

	constructor(database: Database.Database, generateIdFn: () => string) {
		this.db = database;
		this.generateId = generateIdFn;
	}

	async findAll(): Promise<Meme[]> {
		const stmt = this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			ORDER BY submitted_at DESC
		`);

		const rows = stmt.all() as any[];
		return rows.map((row) => this.mapRowToMeme(row));
	}

	async findById(id: string): Promise<Meme | null> {
		const stmt = this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE id = ?
		`);

		const row = stmt.get(id) as any;
		if (!row) return null;

		return this.mapRowToMeme(row);
	}

	async findByContentHash(contentHash: string): Promise<Meme | null> {
		const stmt = this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE content_hash = ?
		`);

		const row = stmt.get(contentHash) as any;
		if (!row) return null;

		return this.mapRowToMeme(row);
	}

	async create(data: CreateMemeDTO): Promise<Meme> {
		const memeId = this.generateId();
		const now = new Date().toISOString();
		const contentHash = 'hash_' + this.generateId(); // Simple hash generation

		const stmt = this.db.prepare(`
			INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`);

		stmt.run(memeId, contentHash, data.imageUrl, data.altText || null, data.submittedBy, now);

		const meme = await this.findById(memeId);
		if (!meme) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create meme');
		}

		return meme;
	}

	async delete(id: string): Promise<void> {
		const stmt = this.db.prepare('DELETE FROM memes WHERE id = ?');
		const result = stmt.run(id);

		if (result.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Meme not found');
		}
	}

	async findAvailableForUser(userId: string, limit = 10): Promise<MemeWithStats[]> {
		// Get memes the user hasn't interacted with and didn't submit
		const stmt = this.db.prepare(`
			SELECT m.id, m.content_hash as contentHash, m.image_url as imageUrl, m.alt_text as altText,
			       m.submitted_by as submittedBy, m.submitted_at as submittedAt,
			       m.width, m.height, m.is_animated as isAnimated, m.frame_count as frameCount,
			       COALESCE(SUM(CASE WHEN mi.interaction_type = 'pick' THEN 1 ELSE 0 END), 0) as totalPicks,
			       COALESCE(SUM(CASE WHEN mi.interaction_type = 'reject' THEN 1 ELSE 0 END), 0) as totalRejects
			FROM memes m
			LEFT JOIN meme_interactions mi ON m.id = mi.meme_id
			WHERE m.id NOT IN (
				SELECT meme_id FROM meme_interactions WHERE user_id = ?
			)
			AND m.submitted_by != ?
			GROUP BY m.id
			ORDER BY m.submitted_at DESC
			LIMIT ?
		`);

		const rows = stmt.all(userId, userId, limit) as any[];
		return rows.map((row) => this.mapRowToMemeWithStats(row));
	}

	async findBySubmitter(userId: string): Promise<Meme[]> {
		const stmt = this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE submitted_by = ?
			ORDER BY submitted_at DESC
		`);

		const rows = stmt.all(userId) as any[];
		return rows.map((row) => this.mapRowToMeme(row));
	}

	async findTodaysSubmissions(): Promise<Meme[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStart = today.toISOString();

		const stmt = this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE submitted_at >= ?
			ORDER BY submitted_at DESC
		`);

		const rows = stmt.all(todayStart) as any[];
		return rows.map((row) => this.mapRowToMeme(row));
	}

	async findUserInteraction(userId: string, memeId: string): Promise<MemeInteraction | null> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, meme_id as memeId, interaction_type as interactionType, interacted_at as interactedAt
			FROM meme_interactions
			WHERE user_id = ? AND meme_id = ?
		`);

		const row = stmt.get(userId, memeId) as any;
		if (!row) return null;

		return this.mapRowToInteraction(row);
	}

	async createInteraction(data: CreateMemeInteractionDTO): Promise<MemeInteraction> {
		const interactionId = this.generateId();
		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
			INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at)
			VALUES (?, ?, ?, ?, ?)
		`);

		stmt.run(interactionId, data.userId, data.memeId, data.interactionType, now);

		const interaction = await this.findUserInteraction(data.userId, data.memeId);
		if (!interaction) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create interaction');
		}

		return interaction;
	}

	async findUserInteractions(userId: string): Promise<MemeInteraction[]> {
		const stmt = this.db.prepare(`
			SELECT id, user_id as userId, meme_id as memeId, interaction_type as interactionType, interacted_at as interactedAt
			FROM meme_interactions
			WHERE user_id = ?
			ORDER BY interacted_at DESC
		`);

		const rows = stmt.all(userId) as any[];
		return rows.map((row) => this.mapRowToInteraction(row));
	}

	async getMemeStats(memeId: string): Promise<{ totalPicks: number; totalRejects: number }> {
		const stmt = this.db.prepare(`
			SELECT 
				COALESCE(SUM(CASE WHEN interaction_type = 'pick' THEN 1 ELSE 0 END), 0) as totalPicks,
				COALESCE(SUM(CASE WHEN interaction_type = 'reject' THEN 1 ELSE 0 END), 0) as totalRejects
			FROM meme_interactions
			WHERE meme_id = ?
		`);

		const row = stmt.get(memeId) as any;
		return {
			totalPicks: row?.totalPicks || 0,
			totalRejects: row?.totalRejects || 0
		};
	}

	async getTopDailyMeme(date: Date): Promise<Meme | null> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(date);
		dayEnd.setHours(23, 59, 59, 999);

		const stmt = this.db.prepare(`
			SELECT m.id, m.content_hash as contentHash, m.image_url as imageUrl, m.alt_text as altText,
			       m.submitted_by as submittedBy, m.submitted_at as submittedAt,
			       m.width, m.height, m.is_animated as isAnimated, m.frame_count as frameCount
			FROM memes m
			LEFT JOIN meme_interactions mi ON m.id = mi.meme_id AND mi.interaction_type = 'pick'
			WHERE DATE(m.submitted_at) = DATE(?)
			GROUP BY m.id
			ORDER BY COUNT(mi.id) DESC
			LIMIT 1
		`);

		const row = stmt.get(dayStart.toISOString()) as any;
		if (!row) return null;

		return this.mapRowToMeme(row);
	}

	async getDailyStats(date: Date): Promise<DailyMemeStats> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);

		// Get the top meme for the day (most picks)
		const topMemeStmt = this.db.prepare(`
			SELECT m.*, COUNT(CASE WHEN mi.interaction_type = 'pick' THEN 1 END) as totalPicks
			FROM memes m
			LEFT JOIN meme_interactions mi ON m.id = mi.meme_id AND DATE(mi.interacted_at) = DATE(?)
			WHERE DATE(m.submitted_at) = DATE(?)
			GROUP BY m.id
			ORDER BY totalPicks DESC
			LIMIT 1
		`);
		const topMemeRow = topMemeStmt.get(dayStart.toISOString(), dayStart.toISOString());

		// Get overall daily stats
		const statsStmt = this.db.prepare(`
			SELECT 
				COUNT(DISTINCT m.id) as totalSubmissions,
				COUNT(DISTINCT mi.id) as totalInteractions
			FROM memes m
			LEFT JOIN meme_interactions mi ON m.id = mi.meme_id AND DATE(mi.interacted_at) = DATE(?)
			WHERE DATE(m.submitted_at) = DATE(?)
		`);

		const statsRow = statsStmt.get(dayStart.toISOString(), dayStart.toISOString()) as any;

		return {
			date: dayStart,
			topMeme: topMemeRow ? this.mapRowToMeme(topMemeRow) : undefined,
			totalSubmissions: statsRow?.totalSubmissions || 0,
			totalInteractions: statsRow?.totalInteractions || 0
		};
	}

	async getUserMemeStats(userId: string): Promise<UserMemeStats> {
		const statsStmt = this.db.prepare(`
			SELECT 
				COUNT(DISTINCT CASE WHEN interaction_type = 'pick' THEN meme_id END) as totalPicks,
				COUNT(DISTINCT CASE WHEN interaction_type = 'reject' THEN meme_id END) as totalRejects
			FROM meme_interactions
			WHERE user_id = ?
		`);

		const statsRow = statsStmt.get(userId) as any;

		const submittedStmt = this.db.prepare(`
			SELECT 
				COUNT(*) as totalSubmissions,
				MAX(submitted_at) as lastSubmissionAt
			FROM memes 
			WHERE submitted_by = ?
		`);
		const submittedRow = submittedStmt.get(userId) as any;

		// Get today's submission count
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dailyStmt = this.db.prepare(`
			SELECT COUNT(*) as count
			FROM memes
			WHERE submitted_by = ? AND DATE(submitted_at) = DATE(?)
		`);
		const dailyRow = dailyStmt.get(userId, today.toISOString()) as any;

		return {
			userId,
			totalSubmissions: submittedRow?.totalSubmissions || 0,
			totalPicks: statsRow?.totalPicks || 0,
			totalRejects: statsRow?.totalRejects || 0,
			dailyTokensUsed: dailyRow?.count || 0,
			lastSubmissionAt: submittedRow?.lastSubmissionAt ? new Date(submittedRow.lastSubmissionAt) : undefined
		};
	}

	async getUserDailySubmissionCount(userId: string, date: Date): Promise<number> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);

		const stmt = this.db.prepare(`
			SELECT COUNT(*) as count
			FROM memes
			WHERE submitted_by = ? AND DATE(submitted_at) = DATE(?)
		`);

		const row = stmt.get(userId, dayStart.toISOString()) as any;
		return row?.count || 0;
	}

	private mapRowToMeme(row: any): Meme {
		return {
			id: row.id,
			contentHash: row.contentHash,
			imageUrl: row.imageUrl,
			altText: row.altText || undefined,
			submittedBy: row.submittedBy,
			submittedAt: new Date(row.submittedAt),
			width: row.width || undefined,
			height: row.height || undefined,
			isAnimated: row.isAnimated ? true : false,
			frameCount: row.frameCount || undefined
		};
	}

	private mapRowToMemeWithStats(row: any): MemeWithStats {
		const meme = this.mapRowToMeme(row);
		return {
			...meme,
			totalPicks: row.totalPicks || 0,
			totalRejects: row.totalRejects || 0,
			isEligibleForUser: true
		};
	}

	private mapRowToInteraction(row: any): MemeInteraction {
		return {
			id: row.id,
			userId: row.userId,
			memeId: row.memeId,
			interactionType: row.interactionType as MemeInteractionType,
			interactedAt: new Date(row.interactedAt)
		};
	}
}
