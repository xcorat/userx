// Memeball Repository Interface
import type { 
	Meme, 
	CreateMemeDTO, 
	MemeWithStats, 
	MemeInteraction, 
	CreateMemeInteractionDTO,
	UserMemeStats,
	DailyMemeStats,
	MemeInteractionType 
} from '$lib/models/meme.model';

export interface IMemeBallRepository {
	// Meme CRUD operations
	findAll(): Promise<Meme[]>;
	findById(id: string): Promise<Meme | null>;
	findByContentHash(contentHash: string): Promise<Meme | null>;
	create(data: CreateMemeDTO): Promise<Meme>;
	delete(id: string): Promise<void>;
	
	// Meme filtering and availability
	findAvailableForUser(userId: string, limit?: number): Promise<MemeWithStats[]>;
	findBySubmitter(userId: string): Promise<Meme[]>;
	findTodaysSubmissions(): Promise<Meme[]>;
	
	// User interactions with memes
	findUserInteraction(userId: string, memeId: string): Promise<MemeInteraction | null>;
	createInteraction(data: CreateMemeInteractionDTO): Promise<MemeInteraction>;
	findUserInteractions(userId: string): Promise<MemeInteraction[]>;
	deleteUserInteractions(userId: string): Promise<void>;
	
	// Meme statistics and rankings
	getMemeStats(memeId: string): Promise<{ totalPicks: number; totalRejects: number }>;
	getTopDailyMeme(date: Date): Promise<Meme | null>;
	getDailyStats(date: Date): Promise<DailyMemeStats>;
	
	// User statistics
	getUserMemeStats(userId: string): Promise<UserMemeStats>;
	getUserDailySubmissionCount(userId: string, date: Date): Promise<number>;
}