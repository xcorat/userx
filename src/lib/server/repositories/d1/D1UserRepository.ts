// D1 User Repository
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class D1UserRepository implements IUserRepository {
	constructor(private db: D1Database) {}

	private generateId(): string {
		return crypto.randomUUID();
	}

	async findAll(): Promise<User[]> {
		const { results } = await this.db.prepare(`
			SELECT id, username, name, email, avatar_url as avatarUrl, 
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			ORDER BY created_at DESC
		`).all();
		
		return results.map((row: any) => ({
			...row,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findById(id: string): Promise<User | null> {
		const row = await this.db.prepare(`
			SELECT id, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE id = ?
		`).bind(id).first();
		
		if (!row) return null;
		
		return {
			...row,
			createdAt: new Date(row.createdAt as string)
		} as User;
	}

	async findByEmail(email: string): Promise<User | null> {
		const row = await this.db.prepare(`
			SELECT id, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE email = ?
		`).bind(email).first();
		
		if (!row) return null;
		
		return {
			...row,
			createdAt: new Date(row.createdAt as string)
		} as User;
	}

	async findByUsername(username: string): Promise<User | null> {
		const row = await this.db.prepare(`
			SELECT id, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE username = ?
		`).bind(username).first();
		
		if (!row) return null;
		
		return {
			...row,
			createdAt: new Date(row.createdAt as string)
		} as User;
	}

	async searchUsers(query: string): Promise<User[]> {
		if (!query.trim()) {
			return [];
		}

		const { results } = await this.db.prepare(`
			SELECT id, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE username LIKE ? OR email LIKE ? OR name LIKE ?
			ORDER BY created_at DESC
		`).bind(`%${query}%`, `%${query}%`, `%${query}%`).all();

		return results.map((row: any) => ({
			...row,
			createdAt: new Date(row.createdAt)
		}));
	}

	async create(data: CreateUserDTO): Promise<User> {
		// Check if email already exists
		const existingEmail = await this.findByEmail(data.email);
		if (existingEmail) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Email already exists');
		}

		// Check if username already exists (if provided)
		if (data.username) {
			const existingUsername = await this.findByUsername(data.username);
			if (existingUsername) {
				throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Username already exists');
			}
		}

		const id = this.generateId();
		const now = new Date().toISOString();
		const username = data.username || `user_${id.substring(0, 8)}`;

		await this.db.prepare(`
			INSERT INTO users (id, username, name, email, password, avatar_url, birthdate, location, timezone, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			id,
			username,
			data.name,
			data.email,
			data.password,
			data.avatarUrl || null,
			data.birthdate || null,
			data.location || null,
			data.timezone || null,
			now,
			now
		).run();

		const user = await this.findById(id);
		if (!user) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create user');
		}

		return user;
	}

	async update(id: string, data: UpdateUserDTO): Promise<User> {
		const existing = await this.findById(id);
		if (!existing) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		// Check username uniqueness if updating username
		if (data.username && data.username !== existing.username) {
			const existingUsername = await this.findByUsername(data.username);
			if (existingUsername && existingUsername.id !== id) {
				throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Username already exists');
			}
		}

		const updates: string[] = [];
		const values: any[] = [];

		if (data.username !== undefined) {
			updates.push('username = ?');
			values.push(data.username);
		}
		if (data.name !== undefined) {
			updates.push('name = ?');
			values.push(data.name);
		}
		if (data.avatarUrl !== undefined) {
			updates.push('avatar_url = ?');
			values.push(data.avatarUrl);
		}
		if (data.birthdate !== undefined) {
			updates.push('birthdate = ?');
			values.push(data.birthdate);
		}
		if (data.location !== undefined) {
			updates.push('location = ?');
			values.push(data.location);
		}
		if (data.timezone !== undefined) {
			updates.push('timezone = ?');
			values.push(data.timezone);
		}

		if (updates.length > 0) {
			updates.push('updated_at = ?');
			values.push(new Date().toISOString());
			values.push(id);

			const stmt = this.db.prepare(`
				UPDATE users
				SET ${updates.join(', ')}
				WHERE id = ?
			`);

			await stmt.bind(...values).run();
		}

		const user = await this.findById(id);
		if (!user) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to update user');
		}

		return user;
	}

	async delete(id: string): Promise<void> {
		const result = await this.db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}
	}
}
