// D1 Relation Repository
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';
import type { UserRelation, CreateRelationDTO, UpdateRelationDTO, RelationStatus } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class D1RelationRepository implements IRelationRepository {
	constructor(private db: D1Database) {}

	private generateId(): string {
		return crypto.randomUUID();
	}

	async findAll(): Promise<UserRelation[]> {
		const { results } = await this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			ORDER BY created_at DESC
		`).all();

		return results.map((row: any) => ({
			...row,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt)
		}));
	}

	async findById(id: string): Promise<UserRelation | null> {
		const row = await this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE id = ?
		`).bind(id).first();

		if (!row) return null;

		return {
			...row,
			createdAt: new Date(row.createdAt as string),
			updatedAt: new Date(row.updatedAt as string)
		} as UserRelation;
	}

	async findByUsers(fromUserId: string, toUserId: string): Promise<UserRelation | null> {
		const row = await this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE (from_user_id = ? AND to_user_id = ?)
			   OR (from_user_id = ? AND to_user_id = ?)
		`).bind(fromUserId, toUserId, toUserId, fromUserId).first();

		if (!row) return null;

		return {
			...row,
			createdAt: new Date(row.createdAt as string),
			updatedAt: new Date(row.updatedAt as string)
		} as UserRelation;
	}

	async findByUserId(userId: string): Promise<UserRelation[]> {
		const { results } = await this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE from_user_id = ? OR to_user_id = ?
			ORDER BY created_at DESC
		`).bind(userId, userId).all();

		return results.map((row: any) => ({
			...row,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt)
		}));
	}

	async findByUserIdAndStatus(userId: string, status: RelationStatus): Promise<UserRelation[]> {
		const { results } = await this.db.prepare(`
			SELECT id, from_user_id as fromUserId, to_user_id as toUserId,
			       status, created_at as createdAt, updated_at as updatedAt
			FROM user_relations
			WHERE (from_user_id = ? OR to_user_id = ?) AND status = ?
			ORDER BY created_at DESC
		`).bind(userId, userId, status).all();

		return results.map((row: any) => ({
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

		await this.db.prepare(`
			INSERT INTO user_relations (id, from_user_id, to_user_id, status, created_at, updated_at)
			VALUES (?, ?, ?, 'pending', ?, ?)
		`).bind(id, data.fromUserId, data.toUserId, now, now).run();

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

		await this.db.prepare(`
			UPDATE user_relations
			SET status = ?, updated_at = ?
			WHERE id = ?
		`).bind(data.status, now, id).run();

		return {
			...existing,
			status: data.status,
			updatedAt: new Date(now)
		};
	}

	async delete(id: string): Promise<void> {
		await this.db.prepare('DELETE FROM user_relations WHERE id = ?').bind(id).run();
	}
}
