// SQLite User Repository
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';
import type Database from 'better-sqlite3';

export class SQLiteUserRepository implements IUserRepository {
	private db: Database.Database;

	constructor(database: Database.Database) {
		this.db = database;
	}

	async findAll(): Promise<User[]> {
		const stmt = this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl, 
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			ORDER BY created_at DESC
		`);
		
		const rows = stmt.all() as any[];
		return rows.map((row) => ({
			...row,
			createdAt: new Date(row.createdAt)
		}));
	}

	async findById(publicKey: string): Promise<User | null> {
		const stmt = this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE public_key = ?
		`);
		
		const row = stmt.get(publicKey) as any;
		if (!row) return null;
		
		return {
			...row,
			createdAt: new Date(row.createdAt)
		};
	}

	async findByEmail(email: string): Promise<User | null> {
		const stmt = this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE email = ?
		`);
		
		const row = stmt.get(email) as any;
		if (!row) return null;
		
		return {
			...row,
			createdAt: new Date(row.createdAt)
		};
	}

	async findByUsername(username: string): Promise<User | null> {
		const stmt = this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
				   birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE LOWER(username) = LOWER(?)
		`);
        
		const row = stmt.get(username) as any;
		if (!row) return null;
		
		return {
			...row,
			createdAt: new Date(row.createdAt)
		};
	}

	async searchUsers(query: string): Promise<User[]> {
		if (!query.trim()) {
			return [];
		}

		const stmt = this.db.prepare(`
			SELECT public_key as publicKey, username, name, email, avatar_url as avatarUrl,
			       birthdate, location, timezone, created_at as createdAt
			FROM users
			WHERE username LIKE ? OR email LIKE ? OR name LIKE ?
			ORDER BY created_at DESC
		`);

		const searchTerm = `%${query}%`;
		const rows = stmt.all(searchTerm, searchTerm, searchTerm) as any[];
		
		return rows.map((row) => ({
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
		const userStmt = this.db.prepare(`
			INSERT INTO users (public_key, username, name, email, avatar_url, birthdate, location, timezone, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		userStmt.run(
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
		);

		// Insert into user_keypairs table
		const keypairStmt = this.db.prepare(`
			INSERT INTO user_keypairs (public_key, encrypted_private_key, created_at)
			VALUES (?, ?, ?)
		`);

		keypairStmt.run(data.publicKey, data.encryptedPrivateKey, now);

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

			stmt.run(...values);
		}

		const user = await this.findById(publicKey);
		if (!user) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'Failed to update user');
		}

		return user;
	}

	async delete(publicKey: string): Promise<void> {
		const stmt = this.db.prepare('DELETE FROM users WHERE public_key = ?');
		const result = stmt.run(publicKey);

		if (result.changes === 0) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}
	}

	async getEncryptedPrivateKey(publicKey: string): Promise<string | null> {
		const stmt = this.db.prepare(`
			SELECT encrypted_private_key as encryptedPrivateKey
			FROM user_keypairs
			WHERE public_key = ?
		`);
		
		const row = stmt.get(publicKey) as any;
		return row ? row.encryptedPrivateKey : null;
	}
}
