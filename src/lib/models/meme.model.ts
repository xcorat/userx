// Meme domain model for Memeball feature
// Uses hash-based identity separate from question system

export interface Meme {
	id: string;           // Unique ID for database
	contentHash: string;  // Hash of image content (SHA-256 of image data)
	imageUrl: string;     // URL to the meme image
	altText?: string;     // Alt text for accessibility
	submittedBy: string;  // User ID who submitted
	submittedAt: Date;    // When submitted
	width?: number;       // Image dimensions for display
	height?: number;
	isAnimated?: boolean; // For GIFs/animated content
	frameCount?: number;  // For animated memes
}

export interface CreateMemeDTO {
	imageUrl: string;     // Client provides image URL
	altText?: string;     // Optional alt text
	submittedBy: string;  // User ID
}

export interface MemeWithStats extends Meme {
	totalPicks: number;    // How many users picked (liked) this meme
	totalRejects: number;  // How many users rejected this meme
	userInteraction?: MemeInteractionType;  // Current user's interaction
	isEligibleForUser: boolean;  // Can current user see/vote on this meme
}

export interface MemeInteraction {
	id: string;
	userId: string;
	memeId: string;
	interactionType: MemeInteractionType;
	interactedAt: Date;
}

export interface CreateMemeInteractionDTO {
	userId: string;
	memeId: string;
	interactionType: MemeInteractionType;
}

export enum MemeInteractionType {
	PICK = 'pick',      // User picked/liked the meme (swipe right)
	REJECT = 'reject'   // User rejected the meme (swipe left)
}

export enum MemeStatus {
	PENDING = 'pending',     // Recently submitted, not yet available for voting
	ACTIVE = 'active',       // Available for user voting
	ARCHIVED = 'archived'    // No longer shown to users
}

export enum MemeSubmissionStatus {
	SUCCESS = 'success',
	DAILY_LIMIT_REACHED = 'daily_limit_reached',
	DUPLICATE_DETECTED = 'duplicate_detected',
	INVALID_IMAGE = 'invalid_image'
}

// Daily meme stats for global leaderboard
export interface DailyMemeStats {
	date: Date;
	topMeme?: Meme;       // Most picked meme of the day
	totalSubmissions: number;
	totalInteractions: number;
}

// User's meme activity summary
export interface UserMemeStats {
	userId: string;
	totalSubmissions: number;
	totalPicks: number;
	totalRejects: number;
	dailyTokensUsed: number;    // How many submissions today
	lastSubmissionAt?: Date;
}