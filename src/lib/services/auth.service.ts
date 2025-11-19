// Auth Service
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { User, CreateUserDTO } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';
import { validateEmailFormat, validateUserName } from '$lib/utils/validation';
import { generateEd25519KeyPair, verifySignature } from '$lib/utils/keypair';
import { encryptPrivateKey } from '$lib/utils/encryption';

export interface LoginStep1Response {
	publicKey: string;
	encryptedPrivateKey: string;
	challenge: string;
}

export class AuthService {
	private challenges: Map<string, { challenge: string; expires: number }> = new Map();

	constructor(private userRepo: IUserRepository) {}

	/**
	 * Step 1 of login: Get user's encrypted private key and generate challenge
	 */
	async loginStep1(username: string): Promise<LoginStep1Response> {
		const user = await this.userRepo.findByUsername(username);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		const encryptedPrivateKey = await this.userRepo.getEncryptedPrivateKey(user.publicKey);
		if (!encryptedPrivateKey) {
			throw new AppError(ErrorCode.SERVER_ERROR, 'User keypair not found');
		}

		// Generate a random challenge (nonce)
		const challenge = crypto.randomUUID();
		const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

		// Store challenge temporarily
		this.challenges.set(user.publicKey, { challenge, expires });

		return {
			publicKey: user.publicKey,
			encryptedPrivateKey,
			challenge
		};
	}

	/**
	 * Step 2 of login: Verify signature and authenticate user
	 */
	async loginStep2(publicKey: string, challenge: string, signature: string): Promise<User> {
		// Verify challenge exists and hasn't expired
		const storedChallenge = this.challenges.get(publicKey);
		if (!storedChallenge) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid or expired challenge');
		}

		if (storedChallenge.challenge !== challenge) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Challenge mismatch');
		}

		if (Date.now() > storedChallenge.expires) {
			this.challenges.delete(publicKey);
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Challenge expired');
		}

		// Verify the signature
		const isValid = await verifySignature(challenge, signature, publicKey);
		if (!isValid) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid signature');
		}

		// Clean up used challenge
		this.challenges.delete(publicKey);

		// Return authenticated user
		const user = await this.userRepo.findById(publicKey);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		return user;
	}

	/**
	 * Legacy login method (deprecated - use loginStep1/loginStep2)
	 */
	async login(email: string, password: string): Promise<User> {
		const user = await this.userRepo.findByEmail(email);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}
		return user;
	}

	/**
	 * Signup with client-side keypair generation
	 * Note: keypair generation and encryption should happen client-side.
	 * This method expects publicKey and encryptedPrivateKey in the DTO.
	 */
	async signup(data: CreateUserDTO): Promise<User> {
		// Validate input
		validateUserName(data.name);
		validateEmailFormat(data.email);

		// Validate that publicKey and encryptedPrivateKey are provided
		if (!data.publicKey || !data.encryptedPrivateKey) {
			throw new AppError(
				ErrorCode.VALIDATION_ERROR,
				'Public key and encrypted private key are required'
			);
		}

		// Check if email already exists
		const existing = await this.userRepo.findByEmail(data.email);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Email already in use');
		}

		// Check if username already exists (if provided)
		if (data.username) {
			const existingUsername = await this.userRepo.findByUsername(data.username);
			if (existingUsername) {
				throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Username already in use');
			}
		}

		// Create user with publicKey and encryptedPrivateKey
		return await this.userRepo.create(data);
	}

	async getCurrentUser(publicKey: string): Promise<User | null> {
		return await this.userRepo.findById(publicKey);
	}
}
