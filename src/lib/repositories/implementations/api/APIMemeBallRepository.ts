// API MemeBall Repository
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

const API_BASE = '/api';

export class APIMemeBallRepository implements IMemeBallRepository {
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		return response.json();
	}

	private parseMeme(meme: any): Meme {
		return {
			...meme,
			submittedAt: new Date(meme.submittedAt)
		};
	}

	private parseInteraction(interaction: any): MemeInteraction {
		return {
			...interaction,
			interactedAt: new Date(interaction.interactedAt)
		};
	}

	async findAll(): Promise<Meme[]> {
		const response = await fetch(`${API_BASE}/memes`);
		const memes = await this.handleResponse<any[]>(response);
		return memes.map(m => this.parseMeme(m));
	}

	async findById(id: string): Promise<Meme | null> {
		const response = await fetch(`${API_BASE}/memes/${encodeURIComponent(id)}`);
		if (response.status === 404) return null;
		const meme = await this.handleResponse<any>(response);
		return this.parseMeme(meme);
	}

	async findByContentHash(contentHash: string): Promise<Meme | null> {
		const response = await fetch(`${API_BASE}/memes?contentHash=${encodeURIComponent(contentHash)}`);
		if (response.status === 404) return null;
		const meme = await this.handleResponse<any>(response);
		return meme ? this.parseMeme(meme) : null;
	}

	async create(data: CreateMemeDTO): Promise<Meme> {
		const response = await fetch(`${API_BASE}/memes`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const meme = await this.handleResponse<any>(response);
		return this.parseMeme(meme);
	}

	async delete(id: string): Promise<void> {
		const response = await fetch(`${API_BASE}/memes/${encodeURIComponent(id)}`, { method: 'DELETE' });
		await this.handleResponse<void>(response);
	}

	async findAvailableForUser(userId: string, limit: number = 20): Promise<MemeWithStats[]> {
		const response = await fetch(`${API_BASE}/memes/available?userId=${encodeURIComponent(userId)}&limit=${limit}`);
		const memes = await this.handleResponse<any[]>(response);
		return memes.map(m => ({
			...this.parseMeme(m),
			stats: m.stats || { totalPicks: 0, totalRejects: 0 }
		}));
	}

	async findBySubmitter(userId: string): Promise<Meme[]> {
		const response = await fetch(`${API_BASE}/memes?submittedBy=${encodeURIComponent(userId)}`);
		const memes = await this.handleResponse<any[]>(response);
		return memes.map(m => this.parseMeme(m));
	}

	async findTodaysSubmissions(): Promise<Meme[]> {
		const response = await fetch(`${API_BASE}/memes/today`);
		const memes = await this.handleResponse<any[]>(response);
		return memes.map(m => this.parseMeme(m));
	}

	async findUserInteraction(userId: string, memeId: string): Promise<MemeInteraction | null> {
		const response = await fetch(`${API_BASE}/memes/${encodeURIComponent(memeId)}/interactions?userId=${encodeURIComponent(userId)}`);
		if (response.status === 404) return null;
		const interaction = await this.handleResponse<any>(response);
		return interaction ? this.parseInteraction(interaction) : null;
	}

	async createInteraction(data: CreateMemeInteractionDTO): Promise<MemeInteraction> {
		const response = await fetch(`${API_BASE}/memes/interactions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const interaction = await this.handleResponse<any>(response);
		return this.parseInteraction(interaction);
	}

	async findUserInteractions(userId: string): Promise<MemeInteraction[]> {
		const response = await fetch(`${API_BASE}/memes/interactions?userId=${encodeURIComponent(userId)}`);
		const interactions = await this.handleResponse<any[]>(response);
		return interactions.map(i => this.parseInteraction(i));
	}

	async deleteUserInteractions(userId: string): Promise<void> {
		const response = await fetch(`${API_BASE}/memes/interactions?userId=${encodeURIComponent(userId)}`, {
			method: 'DELETE'
		});
		await this.handleResponse<void>(response);
	}

	async getMemeStats(memeId: string): Promise<{ totalPicks: number; totalRejects: number }> {
		const response = await fetch(`${API_BASE}/memes/${encodeURIComponent(memeId)}/stats`);
		return this.handleResponse<{ totalPicks: number; totalRejects: number }>(response);
	}

	async getTopDailyMeme(date: Date): Promise<Meme | null> {
		const dateStr = date.toISOString().split('T')[0];
		const response = await fetch(`${API_BASE}/memes/daily/top?date=${dateStr}`);
		if (response.status === 404) return null;
		const meme = await this.handleResponse<any>(response);
		return meme ? this.parseMeme(meme) : null;
	}

	async getDailyStats(date: Date): Promise<DailyMemeStats> {
		const dateStr = date.toISOString().split('T')[0];
		const response = await fetch(`${API_BASE}/memes/daily/stats?date=${dateStr}`);
		return this.handleResponse<DailyMemeStats>(response);
	}

	async getUserMemeStats(userId: string): Promise<UserMemeStats> {
		const response = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/meme-stats`);
		return this.handleResponse<UserMemeStats>(response);
	}

	async getUserDailySubmissionCount(userId: string, date: Date): Promise<number> {
		const dateStr = date.toISOString().split('T')[0];
		const response = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/meme-submissions?date=${dateStr}`);
		const data = await this.handleResponse<{ count: number }>(response);
		return data.count;
	}
}
