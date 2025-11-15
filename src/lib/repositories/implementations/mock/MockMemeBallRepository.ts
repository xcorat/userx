// Mock MemeBall Repository
import type { IMemeBallRepository } from '../../interfaces/IMemeBallRepository';
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

// Mock meme data with classic internet memes
const mockMemes: Meme[] = [
	{
		id: 'meme_1',
		contentHash: 'hash_distracted_bf',
		imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
		altText: 'Distracted Boyfriend meme - man looking at another woman while his girlfriend looks disapproving',
		submittedBy: 'user_1',
		submittedAt: new Date('2024-11-13T10:00:00Z'),
		width: 680,
		height: 450,
		isAnimated: false
	},
	{
		id: 'meme_2', 
		contentHash: 'hash_drake_pointing',
		imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
		altText: 'Drake pointing meme - Drake rejecting something, then pointing approvingly at something else',
		submittedBy: 'user_2',
		submittedAt: new Date('2024-11-13T11:30:00Z'),
		width: 500,
		height: 600,
		isAnimated: false
	},
	{
		id: 'meme_3',
		contentHash: 'hash_woman_yelling_cat',
		imageUrl: 'https://i.imgflip.com/345v97.jpg',
		altText: 'Woman yelling at confused cat meme',
		submittedBy: 'user_3',
		submittedAt: new Date('2024-11-13T14:15:00Z'),
		width: 680,
		height: 438,
		isAnimated: false
	},
	{
		id: 'meme_4',
		contentHash: 'hash_this_is_fine',
		imageUrl: 'https://i.imgflip.com/1wz2x6.jpg',
		altText: 'This is fine dog sitting in burning room',
		submittedBy: 'user_4',
		submittedAt: new Date('2024-11-13T16:45:00Z'),
		width: 580,
		height: 282,
		isAnimated: false
	},
	{
		id: 'meme_5',
		contentHash: 'hash_expanding_brain',
		imageUrl: 'https://i.imgflip.com/1jwhww.jpg',
		altText: 'Expanding brain meme template',
		submittedBy: 'user_5',
		submittedAt: new Date('2024-11-14T08:20:00Z'),
		width: 857,
		height: 1202,
		isAnimated: false
	}
];

export class MockMemeBallRepository implements IMemeBallRepository {
	private memes: Meme[] = [...mockMemes];
	private interactions: MemeInteraction[] = [];
	private interactionIdCounter = 1;

	constructor() {
		// Initialize some sample interactions
		this.seedInteractions();
	}

	private seedInteractions(): void {
		// Seed some sample interactions for testing
		const sampleInteractions: CreateMemeInteractionDTO[] = [
			{ userId: 'user_1', memeId: 'meme_2', interactionType: MemeInteractionType.PICK },
			{ userId: 'user_1', memeId: 'meme_3', interactionType: MemeInteractionType.REJECT },
			{ userId: 'user_2', memeId: 'meme_1', interactionType: MemeInteractionType.PICK },
			{ userId: 'user_2', memeId: 'meme_4', interactionType: MemeInteractionType.PICK },
			{ userId: 'user_3', memeId: 'meme_1', interactionType: MemeInteractionType.PICK },
			{ userId: 'user_4', memeId: 'meme_2', interactionType: MemeInteractionType.REJECT },
			{ userId: 'user_5', memeId: 'meme_1', interactionType: MemeInteractionType.PICK }
		];

		sampleInteractions.forEach(data => {
			this.interactions.push({
				id: `interaction_${this.interactionIdCounter++}`,
				...data,
				interactedAt: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24h
			});
		});
	}

	async findAll(): Promise<Meme[]> {
		return [...this.memes];
	}

	async findById(id: string): Promise<Meme | null> {
		return this.memes.find(m => m.id === id) || null;
	}

	async findByContentHash(contentHash: string): Promise<Meme | null> {
		return this.memes.find(m => m.contentHash === contentHash) || null;
	}

	async create(data: CreateMemeDTO): Promise<Meme> {
		// Simple hash generation (in production, would hash actual image content)
		const contentHash = `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const meme: Meme = {
			id: `meme_${Date.now()}`,
			contentHash,
			imageUrl: data.imageUrl,
			altText: data.altText,
			submittedBy: data.submittedBy,
			submittedAt: new Date(),
			isAnimated: false // TODO: detect from image/URL
		};

		this.memes.push(meme);
		return meme;
	}

	async delete(id: string): Promise<void> {
		this.memes = this.memes.filter(m => m.id !== id);
		// Also clean up interactions
		this.interactions = this.interactions.filter(i => i.memeId !== id);
	}

	async findAvailableForUser(userId: string, limit = 10): Promise<MemeWithStats[]> {
		// Get user's interactions to filter out already interacted memes
		const userInteractions = this.interactions.filter(i => i.userId === userId);
		const interactedMemeIds = new Set(userInteractions.map(i => i.memeId));
		
		// Filter out memes user has already interacted with and their own submissions
		const availableMemes = this.memes.filter(m => 
			!interactedMemeIds.has(m.id) && m.submittedBy !== userId
		);

		// Convert to MemeWithStats and limit results
		const memesWithStats = await Promise.all(
			availableMemes.slice(0, limit).map(async (meme) => {
				const stats = await this.getMemeStats(meme.id);
				const userInteraction = userInteractions.find(i => i.memeId === meme.id);
				
				return {
					...meme,
					totalPicks: stats.totalPicks,
					totalRejects: stats.totalRejects,
					userInteraction: userInteraction?.interactionType,
					isEligibleForUser: true
				} as MemeWithStats;
			})
		);

		return memesWithStats;
	}

	async findBySubmitter(userId: string): Promise<Meme[]> {
		return this.memes.filter(m => m.submittedBy === userId);
	}

	async findTodaysSubmissions(): Promise<Meme[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		return this.memes.filter(m => m.submittedAt >= today);
	}

	async findUserInteraction(userId: string, memeId: string): Promise<MemeInteraction | null> {
		return this.interactions.find(i => i.userId === userId && i.memeId === memeId) || null;
	}

	async createInteraction(data: CreateMemeInteractionDTO): Promise<MemeInteraction> {
		// Check if interaction already exists
		const existing = await this.findUserInteraction(data.userId, data.memeId);
		if (existing) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'User has already interacted with this meme');
		}

		const interaction: MemeInteraction = {
			id: `interaction_${this.interactionIdCounter++}`,
			...data,
			interactedAt: new Date()
		};

		this.interactions.push(interaction);
		return interaction;
	}

	async findUserInteractions(userId: string): Promise<MemeInteraction[]> {
		return this.interactions.filter(i => i.userId === userId);
	}

	async getMemeStats(memeId: string): Promise<{ totalPicks: number; totalRejects: number }> {
		const memeInteractions = this.interactions.filter(i => i.memeId === memeId);
		
		return {
			totalPicks: memeInteractions.filter(i => i.interactionType === MemeInteractionType.PICK).length,
			totalRejects: memeInteractions.filter(i => i.interactionType === MemeInteractionType.REJECT).length
		};
	}

	async getTopDailyMeme(date: Date): Promise<Meme | null> {
		// Simple implementation: get meme with most picks for given day
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(date);
		dayEnd.setHours(23, 59, 59, 999);

		const dayInteractions = this.interactions.filter(i => 
			i.interactedAt >= dayStart && i.interactedAt <= dayEnd &&
			i.interactionType === MemeInteractionType.PICK
		);

		// Count picks per meme
		const pickCounts = new Map<string, number>();
		dayInteractions.forEach(interaction => {
			const count = pickCounts.get(interaction.memeId) || 0;
			pickCounts.set(interaction.memeId, count + 1);
		});

		// Find meme with most picks
		let topMemeId: string | null = null;
		let maxPicks = 0;
		
		for (const [memeId, picks] of pickCounts.entries()) {
			if (picks > maxPicks) {
				maxPicks = picks;
				topMemeId = memeId;
			}
		}

		return topMemeId ? await this.findById(topMemeId) : null;
	}

	async getDailyStats(date: Date): Promise<DailyMemeStats> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(date);
		dayEnd.setHours(23, 59, 59, 999);

		const daySubmissions = this.memes.filter(m => 
			m.submittedAt >= dayStart && m.submittedAt <= dayEnd
		);

		const dayInteractions = this.interactions.filter(i => 
			i.interactedAt >= dayStart && i.interactedAt <= dayEnd
		);

		const topMeme = await this.getTopDailyMeme(date);

		return {
			date,
			topMeme: topMeme || undefined,
			totalSubmissions: daySubmissions.length,
			totalInteractions: dayInteractions.length
		};
	}

	async getUserMemeStats(userId: string): Promise<UserMemeStats> {
		const userSubmissions = this.memes.filter(m => m.submittedBy === userId);
		const userInteractions = this.interactions.filter(i => i.userId === userId);
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todaySubmissions = userSubmissions.filter(m => m.submittedAt >= today);

		const lastSubmission = userSubmissions
			.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

		return {
			userId,
			totalSubmissions: userSubmissions.length,
			totalPicks: userInteractions.filter(i => i.interactionType === MemeInteractionType.PICK).length,
			totalRejects: userInteractions.filter(i => i.interactionType === MemeInteractionType.REJECT).length,
			dailyTokensUsed: todaySubmissions.length,
			lastSubmissionAt: lastSubmission?.submittedAt
		};
	}

	async getUserDailySubmissionCount(userId: string, date: Date): Promise<number> {
		const dayStart = new Date(date);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(date);
		dayEnd.setHours(23, 59, 59, 999);

		return this.memes.filter(m => 
			m.submittedBy === userId &&
			m.submittedAt >= dayStart && 
			m.submittedAt <= dayEnd
		).length;
	}
}