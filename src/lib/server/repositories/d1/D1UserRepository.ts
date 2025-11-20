// D1 User Repository
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class D1UserRepository implements IUserRepository {
	constructor(private db: D1Database) {}

	async findAll(): Promise<User[]> {
		const { results } = await this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl, 
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			ORDER BY created_at DESC
		`).all();
		
		return results.map((row: any) => ({
			...row,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findById(publicKey: string): Promise<User | null> {
		const row = await this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE public_key = ?
		`).bind(publicKey).first();
		
		if (!row) return null;
		
		return {
			...row,
			createdAt: new Date(row.createdAt as string)
		} as User;
	}

	async findByEmail(email: string): Promise<User | null> {
		const row = await this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
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
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
				   birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE LOWER(username) = LOWER(?)
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
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
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

		const now = new Date().toISOString();
		const username = data.username || `user_${data.publicKey.substring(0, 8)}`;

		// Insert into users table
		await this.db.prepare(`
			INSERT INTO users (public_key, username, name, email, avatar_url, birthdate, location, timezone, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			data.publicKey,
			username,
			data.name,
			data.email,
			data.avatarUrl || null,
			data.birthdate || null,
			data.location || null,
			data.timezone || null,
			now,
			now
		).run();

		// Insert into user_keypairs table
		await this.db.prepare(`
			INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at)
			VALUES (?, ?, ?)
		`).bind(data.publicKey, data.encryptedPrivateKey, now).run();

		const user = await this.findById(data.publicKey);
		if (!user) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to create user');
		}

		return user;
	}

	async update(publicKey: string, data: UpdateUserDTO): Promise<User> {
		const existing = await this.findById(publicKey);
		if (!existing) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		// Check username uniqueness if updating username
		if (data.username && data.username !== existing.username) {
			const existingUsername = await this.findByUsername(data.username);
			if (existingUsername && existingUsername.publicKey !== publicKey) {
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
			values.push(publicKey);

			const stmt = this.db.prepare(`
				UPDATE users
				SET ${updates.join(', ')}
				WHERE public_key = ?
			`);

			await stmt.bind(...values).run();
		}

		const user = await this.findById(publicKey);
		if (!user) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to update user');
		}

		return user;
	}

	async delete(publicKey: string): Promise<void> {
		const result = await this.db.prepare('DELETE FROM users WHERE public_key = ?').bind(publicKey).run();

		if (!result.success || result.meta.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}
	}

	async getEncryptedPrivateKey(publicKey: string): Promise<string | null> {
		const row = await this.db.prepare(`
			SELECT encrypted_private_key as encryptedPrivateKey
			FROM user_keypairs
			WHERE public_key = ?
		`).bind(publicKey).first();
		
		return row ? (row as any).encryptedPrivateKey : null;
	}
}
