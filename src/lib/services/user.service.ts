// User Service
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { User } from '$lib/models';

export class UserService {
	constructor(private userRepo: IUserRepository) {}

	async getAllUsers(): Promise<User[]> {
		return await this.userRepo.findAll();
	}

	async getUserById(publicKey: string): Promise<User | null> {
		return await this.userRepo.findById(publicKey);
	}

	async getUserByEmail(email: string): Promise<User | null> {
		return await this.userRepo.findByEmail(email);
	}

	async getUserByUsername(username: string): Promise<User | null> {
		return await this.userRepo.findByUsername(username);
	}

	async searchUsers(query: string): Promise<User[]> {
		return await this.userRepo.searchUsers(query);
	}
}
