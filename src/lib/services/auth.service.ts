// Auth Service
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { User, CreateUserDTO } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';
import { validateEmailFormat, validateUserName } from '$lib/utils/validation';

export class AuthService {
	constructor(private userRepo: IUserRepository) {}

	async login(email: string, password: string): Promise<User> {
		// In POC, skip actual password check
		const user = await this.userRepo.findByEmail(email);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}
		return user;
	}

	async signup(data: CreateUserDTO): Promise<User> {
		// Validate input
		validateUserName(data.name);
		validateEmailFormat(data.email);

		// Check if email already exists
		const existing = await this.userRepo.findByEmail(data.email);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Email already in use');
		}

		// Create user (password hashing would happen here in production)
		return await this.userRepo.create(data);
	}

	async getCurrentUser(userId: string): Promise<User | null> {
		return await this.userRepo.findById(userId);
	}
}
