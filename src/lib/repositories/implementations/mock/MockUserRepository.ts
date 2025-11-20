// Mock User Repository
import type { IUserRepository } from '../../interfaces/IUserRepository';
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';
import { mockUsers, testKeypairs } from './mock-data';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MockUserRepository implements IUserRepository {
	private users: User[] = [...mockUsers];
	private keypairs: Map<string, string> = new Map(); // publicKey -> encryptedPrivateKey
	
	constructor() {
		// Initialize with test keypairs from mock-data
		mockUsers.forEach((user, index) => {
			const keypairValues = Object.values(testKeypairs);
			if (index < keypairValues.length) {
				this.keypairs.set(user.publicKey, keypairValues[index]);
			}
		});
	}

	async findAll(): Promise<User[]> {
		return this.users;
	}

	async findById(publicKey: string): Promise<User | null> {
		return this.users.find((u) => u.publicKey === publicKey) || null;
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.users.find((u) => u.email === email) || null;
	}

	async findByUsername(username: string): Promise<User | null> {
		return this.users.find((u) => u.username === username) || null;
	}

	async searchUsers(query: string): Promise<User[]> {
		if (!query.trim()) {
			return [];
		}

		const lowerQuery = query.toLowerCase();
		return this.users.filter(
			(user) =>
				user.username?.toLowerCase().includes(lowerQuery) ||
				user.email.toLowerCase().includes(lowerQuery) ||
				user.name.toLowerCase().includes(lowerQuery)
		);
	}

	async create(data: CreateUserDTO): Promise<User> {
		// Check for duplicate email
		if (await this.findByEmail(data.email)) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Email already exists');
		}

		// Check for duplicate username if provided
		if (data.username && (await this.findByUsername(data.username))) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Username already exists');
		}

		const user: User = {
			publicKey: data.publicKey,
			username: data.username || `user_${data.publicKey.substring(0, 8)}`,
			name: data.name,
			email: data.email,
			avatarUrl: data.avatarUrl,
			birthdate: data.birthdate,
			location: data.location,
			timezone: data.timezone,
			createdAt: new Date()
		};
		
		// Store encrypted private key
		this.keypairs.set(data.publicKey, data.encryptedPrivateKey);
		
		this.users.push(user);
		return user;
	}

	async update(publicKey: string, data: UpdateUserDTO): Promise<User> {
		const index = this.users.findIndex((u) => u.publicKey === publicKey);
		if (index === -1) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		this.users[index] = { ...this.users[index], ...data };
		return this.users[index];
	}

	async delete(publicKey: string): Promise<void> {
		this.users = this.users.filter((u) => u.publicKey !== publicKey);
		this.keypairs.delete(publicKey);
	}

	async getEncryptedPrivateKey(publicKey: string): Promise<string | null> {
		return this.keypairs.get(publicKey) || null;
	}
}
