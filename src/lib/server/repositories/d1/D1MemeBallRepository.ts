// D1 Memeball Repository
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

export class D1MemeBallRepository implements IMemeBallRepository {
	constructor(private db: D1Database) {}

	private generateId(): string {
		return crypto.randomUUID();
	}

	async findAll(): Promise<Meme[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			ORDER BY submitted_at DESC
		`).all();

		return rows.map((row: any) => this.mapRowToMeme(row));
	}

	async findById(id: string): Promise<Meme | null> {
		const row = await this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE id = ?
		`).bind(id).first();

		if (!row) return null;

		return this.mapRowToMeme(row as any);
	}

	async findByContentHash(contentHash: string): Promise<Meme | null> {
		const row = await this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE content_hash = ?
		`).bind(contentHash).first();

		if (!row) return null;

		return this.mapRowToMeme(row as any);
	}

	async create(data: CreateMemeDTO): Promise<Meme> {
		const memeId = this.generateId();
		const now = new Date().toISOString();
		const contentHash = 'hash_' + this.generateId(); // Simple hash generation

		await this.db.prepare(`
			INSERT INTO memes (id, content_hash, image_url, alt_text, submitted_by, submitted_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`).bind(memeId, contentHash, data.imageUrl, data.altText || null, data.submittedBy, now).run();

		const meme = await this.findById(memeId);
		if (!meme) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create meme');
		}

		return meme;
	}

	async delete(id: string): Promise<void> {
		const result = await this.db.prepare('DELETE FROM memes WHERE id = ?').bind(id).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Meme not found');
		}
	}

	async findAvailableForUser(userId: string, limit = 10): Promise<MemeWithStats[]> {
		// Get memes the user hasn't interacted with and didn't submit
		const { results: rows } = await this.db.prepare(`
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
		`).bind(userId, userId, limit).all();

		return rows.map((row: any) => this.mapRowToMemeWithStats(row));
	}

	async findBySubmitter(userId: string): Promise<Meme[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE submitted_by = ?
			ORDER BY submitted_at DESC
		`).bind(userId).all();

		return rows.map((row: any) => this.mapRowToMeme(row));
	}

	async findTodaysSubmissions(): Promise<Meme[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStart = today.toISOString();

		const { results: rows } = await this.db.prepare(`
			SELECT id, content_hash as contentHash, image_url as imageUrl, alt_text as altText,
			       submitted_by as submittedBy, submitted_at as submittedAt,
			       width, height, is_animated as isAnimated, frame_count as frameCount
			FROM memes
			WHERE submitted_at >= ?
			ORDER BY submitted_at DESC
		`).bind(todayStart).all();

		return rows.map((row: any) => this.mapRowToMeme(row));
	}

	async findUserInteraction(userId: string, memeId: string): Promise<MemeInteraction | null> {
		const row = await this.db.prepare(`
			SELECT id, user_id as userId, meme_id as memeId, interaction_type as interactionType, interacted_at as interactedAt
			FROM meme_interactions
			WHERE user_id = ? AND meme_id = ?
		`).bind(userId, memeId).first();

		if (!row) return null;

		return this.mapRowToInteraction(row as any);
	}

	async createInteraction(data: CreateMemeInteractionDTO): Promise<MemeInteraction> {
		const interactionId = this.generateId();
		const now = new Date().toISOString();

		await this.db.prepare(`
			INSERT INTO meme_interactions (id, user_id, meme_id, interaction_type, interacted_at)
			VALUES (?, ?, ?, ?, ?)
		`).bind(interactionId, data.userId, data.memeId, data.interactionType, now).run();

		const interaction = await this.findUserInteraction(data.userId, data.memeId);
		if (!interaction) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create interaction');
		}

		return interaction;
	}

	async findUserInteractions(userId: string): Promise<MemeInteraction[]> {
		const { results: rows } = await this.db.prepare(`
			SELECT id, user_id as userId, meme_id as memeId, interaction_type as interactionType, interacted_at as interactedAt
			FROM meme_interactions
			WHERE user_id = ?
			ORDER BY interacted_at DESC
		`).bind(userId).all();

		return rows.map((row: any) => this.mapRowToInteraction(row));
	}

	async deleteUserInteractions(userId: string): Promise<void> {
		await this.db.prepare('DELETE FROM meme_interactions WHERE user_id = ?').bind(userId).run();
	}

	async getMemeStats(memeId: string): Promise<{ totalPicks: number; totalRejects: number }> {
		const row = await this.db.prepare(`
			SELECT 
				COALESCE(SUM(CASE WHEN interaction_type = 'pick' THEN 1 ELSE 0 END), 0) as totalPicks,
				COALESCE(SUM(CASE WHEN interaction_type = 'reject' THEN 1 ELSE 0 END), 0) as totalRejects
			FROM meme_interactions
			WHERE meme_id = ?
		`).bind(memeId).first();

		return {
			totalPicks: (row as any)?.totalPicks || 0,
			totalRejects: (row as any)?.totalRejects || 0
		};
	}

	async getTopDailyMeme(date: Date): Promise<Meme | null> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);

		const row = await this.db.prepare(`
			SELECT m.id, m.content_hash as contentHash, m.image_url as imageUrl, m.alt_text as altText,
			       m.submitted_by as submittedBy, m.submitted_at as submittedAt,
			       m.width, m.height, m.is_animated as isAnimated, m.frame_count as frameCount
			FROM memes m
			LEFT JOIN meme_interactions mi ON m.id = mi.meme_id AND mi.interaction_type = 'pick'
			WHERE DATE(m.submitted_at) = DATE(?)
			GROUP BY m.id
			ORDER BY COUNT(mi.id) DESC
			LIMIT 1
		`).bind(dayStart.toISOString()).first();

		if (!row) return null;

		return this.mapRowToMeme(row as any);
	}

	async getDailyStats(date: Date): Promise<DailyMemeStats> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);

		// Get the top meme for the day (most picks)
		const topMemeRow = await this.db.prepare(`
			SELECT m.*, COUNT(CASE WHEN mi.interaction_type = 'pick' THEN 1 END) as totalPicks
			FROM memes m
			LEFT JOIN meme_interactions mi ON m.id = mi.meme_id AND DATE(mi.interacted_at) = DATE(?)
			WHERE DATE(m.submitted_at) = DATE(?)
			GROUP BY m.id
			ORDER BY totalPicks DESC
			LIMIT 1
		`).bind(dayStart.toISOString(), dayStart.toISOString()).first();

		// Get overall daily stats
		const statsRow = await this.db.prepare(`
			SELECT 
				COUNT(DISTINCT m.id) as totalSubmissions,
				COUNT(DISTINCT mi.id) as totalInteractions
			FROM memes m
			LEFT JOIN meme_interactions mi ON m.id = mi.meme_id AND DATE(mi.interacted_at) = DATE(?)
			WHERE DATE(m.submitted_at) = DATE(?)
		`).bind(dayStart.toISOString(), dayStart.toISOString()).first();

		return {
			date: dayStart,
			topMeme: topMemeRow ? this.mapRowToMeme(topMemeRow as any) : undefined,
			totalSubmissions: (statsRow as any)?.totalSubmissions || 0,
			totalInteractions: (statsRow as any)?.totalInteractions || 0
		};
	}

	async getUserMemeStats(userId: string): Promise<UserMemeStats> {
		const statsRow = await this.db.prepare(`
			SELECT 
				COUNT(DISTINCT CASE WHEN interaction_type = 'pick' THEN meme_id END) as totalPicks,
				COUNT(DISTINCT CASE WHEN interaction_type = 'reject' THEN meme_id END) as totalRejects
			FROM meme_interactions
			WHERE user_id = ?
		`).bind(userId).first();

		const submittedRow = await this.db.prepare(`
			SELECT 
				COUNT(*) as totalSubmissions,
				MAX(submitted_at) as lastSubmissionAt
			FROM memes 
			WHERE submitted_by = ?
		`).bind(userId).first();

		// Get today's submission count
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dailyRow = await this.db.prepare(`
			SELECT COUNT(*) as count
			FROM memes
			WHERE submitted_by = ? AND DATE(submitted_at) = DATE(?)
		`).bind(userId, today.toISOString()).first();

		return {
			userId,
			totalSubmissions: (submittedRow as any)?.totalSubmissions || 0,
			totalPicks: (statsRow as any)?.totalPicks || 0,
			totalRejects: (statsRow as any)?.totalRejects || 0,
			dailyTokensUsed: (dailyRow as any)?.count || 0,
			lastSubmissionAt: (submittedRow as any)?.lastSubmissionAt ? new Date((submittedRow as any).lastSubmissionAt) : undefined
		};
	}

	async getUserDailySubmissionCount(userId: string, date: Date): Promise<number> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);

		const row = await this.db.prepare(`
			SELECT COUNT(*) as count
			FROM memes
			WHERE submitted_by = ? AND DATE(submitted_at) = DATE(?)
		`).bind(userId, dayStart.toISOString()).first();

		return (row as any)?.count || 0;
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
