// Meme Service for Memeball feature
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { 
	Meme, 
	CreateMemeDTO, 
	MemeWithStats, 
	MemeInteraction,
	CreateMemeInteractionDTO,
	UserMemeStats,
	DailyMemeStats
} from '$lib/models/meme.model';
import { MemeInteractionType, MemeSubmissionStatus } from '$lib/models/meme.model';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MemeService {
	private readonly DAILY_SUBMISSION_LIMIT = 1; // One meme per day per user
	
	constructor(
		private memeRepo: IMemeBallRepository,
		private userRepo: IUserRepository
	) {}

	/**
	 * Get memes available for a user to vote on
	 * Excludes: memes user already interacted with, user's own submissions
	 */
	async getAvailableMemesForUser(userId: string, limit = 10): Promise<MemeWithStats[]> {
		// Validate user exists
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new AppError('User not found', ErrorCode.NOT_FOUND);
		}

		return await this.memeRepo.findAvailableForUser(userId, limit);
	}

	/**
	 * Submit a new meme (with daily limit validation)
	 */
	async submitMeme(data: CreateMemeDTO): Promise<{ 
		meme: Meme; 
		status: MemeSubmissionStatus 
	}> {
		// Validate user exists
		const user = await this.userRepo.findById(data.submittedBy);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		// Check daily submission limit
		const today = new Date();
		const dailyCount = await this.memeRepo.getUserDailySubmissionCount(data.submittedBy, today);
		if (dailyCount >= this.DAILY_SUBMISSION_LIMIT) {
			return { 
				meme: {} as Meme, 
				status: MemeSubmissionStatus.DAILY_LIMIT_REACHED 
			};
		}

		// Basic image URL validation
		if (!this.isValidImageUrl(data.imageUrl)) {
			return { 
				meme: {} as Meme, 
				status: MemeSubmissionStatus.INVALID_IMAGE 
			};
		}

		// TODO: Generate actual content hash from image data
		// For now, just check URL duplication as simple duplicate detection
		const existingMeme = await this.findMemeByUrl(data.imageUrl);
		if (existingMeme) {
			return { 
				meme: {} as Meme, 
				status: MemeSubmissionStatus.DUPLICATE_DETECTED 
			};
		}

		// Create the meme
		const meme = await this.memeRepo.create(data);
		return { 
			meme, 
			status: MemeSubmissionStatus.SUCCESS 
		};
	}

	/**
	 * Record user interaction with a meme (pick/reject)
	 */
	async interactWithMeme(
		userId: string, 
		memeId: string, 
		interactionType: MemeInteractionType
	): Promise<MemeInteraction> {
		// Validate user exists
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		// Validate meme exists
		const meme = await this.memeRepo.findById(memeId);
		if (!meme) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Meme not found');
		}

		// Check if user can interact with this meme
		if (meme.submittedBy === userId) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot interact with your own meme');
		}

		// Check if user already interacted
		const existingInteraction = await this.memeRepo.findUserInteraction(userId, memeId);
		if (existingInteraction) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'User has already interacted with this meme');
		}

		// Create the interaction
		const interactionData: CreateMemeInteractionDTO = {
			userId,
			memeId,
			interactionType
		};

		return await this.memeRepo.createInteraction(interactionData);
	}

	/**
	 * Get memes submitted by a specific user
	 */
	async getUserSubmittedMemes(userId: string): Promise<Meme[]> {
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		return await this.memeRepo.findBySubmitter(userId);
	}

	/**
	 * Get user's meme statistics
	 */
	async getUserMemeStats(userId: string): Promise<UserMemeStats> {
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		return await this.memeRepo.getUserMemeStats(userId);
	}

	/**
	 * Get daily meme statistics
	 */
	async getDailyStats(date = new Date()): Promise<DailyMemeStats> {
		return await this.memeRepo.getDailyStats(date);
	}

	/**
	 * Get top meme for a given day
	 */
	async getTopDailyMeme(date = new Date()): Promise<Meme | null> {
		return await this.memeRepo.getTopDailyMeme(date);
	}

	/**
	 * Get all memes submitted today
	 */
	async getTodaysSubmissions(): Promise<Meme[]> {
		return await this.memeRepo.findTodaysSubmissions();
	}

	/**
	 * Check if user can submit a meme today
	 */
	async canUserSubmitToday(userId: string): Promise<{
		canSubmit: boolean;
		tokensUsed: number;
		tokensRemaining: number;
	}> {
		const today = new Date();
		const tokensUsed = await this.memeRepo.getUserDailySubmissionCount(userId, today);
		
		return {
			canSubmit: tokensUsed < this.DAILY_SUBMISSION_LIMIT,
			tokensUsed,
			tokensRemaining: Math.max(0, this.DAILY_SUBMISSION_LIMIT - tokensUsed)
		};
	}

	/**
	 * Clear all user interactions (reset swipes)
	 */
	async clearUserInteractions(userId: string): Promise<void> {
		// Validate user exists
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
		}

		await this.memeRepo.deleteUserInteractions(userId);
	}

	// Private helper methods

	private isValidImageUrl(url: string): boolean {
		try {
			const parsed = new URL(url);
			return ['http:', 'https:'].includes(parsed.protocol);
		} catch {
			return false;
		}
	}

	private async findMemeByUrl(imageUrl: string): Promise<Meme | null> {
		// Simple implementation: check all memes for URL match
		// In production, would use proper content hashing
		const allMemes = await this.memeRepo.findAll();
		return allMemes.find(meme => meme.imageUrl === imageUrl) || null;
	}
}