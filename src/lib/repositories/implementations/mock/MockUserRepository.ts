// Mock User Repository
import type { IUserRepository } from '../../interfaces/IUserRepository';
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';
import { mockUsers } from './mock-data';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MockUserRepository implements IUserRepository {
	private users: User[] = [...mockUsers];

	async findAll(): Promise<User[]> {
		return this.users;
	}

	async findById(id: string): Promise<User | null> {
		return this.users.find((u) => u.id === id) || null;
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.users.find((u) => u.email === email) || null;
	}

	async findByUsername(username: string): Promise<User | null> {
		return this.users.find((u) => u.username === username) || null;
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
			id: `user_${Date.now()}`,
			username: data.username || `user_${Date.now()}`,
			name: data.name,
			email: data.email,
			avatarUrl: data.avatarUrl,
			birthdate: data.birthdate,
			location: data.location,
			timezone: data.timezone,
			createdAt: new Date()
		};
		this.users.push(user);
		return user;
	}

	async update(id: string, data: UpdateUserDTO): Promise<User> {
		const index = this.users.findIndex((u) => u.id === id);
		if (index === -1) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		this.users[index] = { ...this.users[index], ...data };
		return this.users[index];
	}

	async delete(id: string): Promise<void> {
		this.users = this.users.filter((u) => u.id !== id);
	}
}
