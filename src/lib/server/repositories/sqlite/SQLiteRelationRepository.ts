// SQLite Relation Repository
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';
import type { UserRelation, CreateRelationDTO, UpdateRelationDTO, RelationStatus } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';
import type Database from 'better-sqlite3';

export class SQLiteRelationRepository implements IRelationRepository {
	private db: Database.Database;
	private generateId: () => string;

	constructor(database: Database.Database, generateIdFn: () => string) {
		this.db = database;
		this.generateId = generateIdFn;
	}

	async findAll(): Promise<UserRelation[]> {
		const stmt = this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			ORDER BY created_at DESC
		`);

		const rows = stmt.all() as any[];
		return rows.map((row) => ({
			...row,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt)
		}));
	}

	async findById(id: string): Promise<UserRelation | null> {
		const stmt = this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE id = ?
		`);

		const row = stmt.get(id) as any;
		if (!row) return null;

		return {
			...row,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt)
		};
	}

	async findByUsers(fromUserId: string, toUserId: string): Promise<UserRelation | null> {
		const stmt = this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE (from_user_id = ? AND to_user_id = ?)
			   OR (from_user_id = ? AND to_user_id = ?)
		`);

		const row = stmt.get(fromUserId, toUserId, toUserId, fromUserId) as any;
		if (!row) return null;

		return {
			...row,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt)
		};
	}

	async findByUserId(userId: string): Promise<UserRelation[]> {
		const stmt = this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE from_user_id = ? OR to_user_id = ?
			ORDER BY created_at DESC
		`);

		const rows = stmt.all(userId, userId) as any[];
		return rows.map((row) => ({
			...row,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt)
		}));
	}

	async findByUserIdAndStatus(userId: string, status: RelationStatus): Promise<UserRelation[]> {
		const stmt = this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE (from_user_id = ? OR to_user_id = ?) AND status = ?
			ORDER BY created_at DESC
		`);

		const rows = stmt.all(userId, userId, status) as any[];
		return rows.map((row) => ({
			...row,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt)
		}));
	}

	async create(data: CreateRelationDTO): Promise<UserRelation> {
		// Check if relation already exists
		const existing = await this.findByUsers(data.fromUserId, data.toUserId);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Relation already exists');
		}

		const id = this.generateId();
		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
			INSERT INTO user_relations (id, from_user_id, to_user_id, status, created_at, updated_at)
			VALUES (?, ?, ?, 'pending', ?, ?)
		`);

		stmt.run(id, data.fromUserId, data.toUserId, now, now);

		return {
			id,
			fromUserId: data.fromUserId,
			toUserId: data.toUserId,
			status: 'pending' as RelationStatus,
			createdAt: new Date(now),
			updatedAt: new Date(now)
		};
	}

	async update(id: string, data: UpdateRelationDTO): Promise<UserRelation> {
		const existing = await this.findById(id);
		if (!existing) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Relation not found');
		}

		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
			UPDATE user_relations
			SET status = ?, updated_at = ?
			WHERE id = ?
		`);

		stmt.run(data.status, now, id);

		return {
			...existing,
			status: data.status,
			updatedAt: new Date(now)
		};
	}

	async delete(id: string): Promise<void> {
		const stmt = this.db.prepare('DELETE FROM user_relations WHERE id = ?');
		stmt.run(id);
	}
}
