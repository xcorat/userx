// API Question Repository
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { PublicQuestion, CreateQuestionDTO } from '$lib/models';
import { appConfig } from '$lib/config/app.config';

const API_BASE = '/api/qna';

export class APIQuestionRepository implements IQuestionRepository {
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		return response.json();
	}

	private parseQuestion(question: any): PublicQuestion {
		return {
			...question,
			createdAt: new Date(question.createdAt)
		};
	}

	async findAll(): Promise<PublicQuestion[]> {
		const response = await fetch(`${API_BASE}/questions`);
		const data = await this.handleResponse<{ questions: PublicQuestion[]; pagination?: any }>(response);
		// Support both paginated and non-paginated responses
		const questions = Array.isArray(data) ? data : data.questions;
		return questions.map(q => this.parseQuestion(q));
	}

	async findAllPaginated(page: number = 1, limit: number = 20): Promise<{
		questions: PublicQuestion[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasMore: boolean;
		};
	}> {
		const response = await fetch(`${API_BASE}/questions?page=${page}&limit=${limit}`);
		const data = await this.handleResponse<{
			questions: PublicQuestion[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
				hasMore: boolean;
			};
		}>(response);
		return {
			questions: data.questions.map(q => this.parseQuestion(q)),
			pagination: data.pagination
		};
	}

	async findById(id: string): Promise<PublicQuestion | null> {
		const response = await fetch(`${API_BASE}/questions/${id}`);
		if (response.status === 404) return null;
		const question = await this.handleResponse<any>(response);
		return this.parseQuestion(question);
	}

	async findByCreator(userId: string): Promise<PublicQuestion[]> {
		const response = await fetch(`${API_BASE}/questions?creatorId=${encodeURIComponent(userId)}`);
		const questions = await this.handleResponse<any[]>(response);
		return questions.map(q => this.parseQuestion(q));
	}

	async create(data: CreateQuestionDTO): Promise<PublicQuestion> {
		const response = await fetch(`${API_BASE}/questions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const question = await this.handleResponse<any>(response);
		return this.parseQuestion(question);
	}

	async delete(id: string): Promise<void> {
		const response = await fetch(`${API_BASE}/questions/${id}`, {
			method: 'DELETE'
		});
		await this.handleResponse(response);
	}

	async findImageByQuestion(questionId: string): Promise<QuestionImage | null> {
		const response = await fetch(`${API_BASE}/questions/${questionId}/image`);
		if (response.status === 404) return null;
		const image = await this.handleResponse<any>(response);
		return {
			...image,
			uploadedAt: new Date(image.uploadedAt)
		};
	}
}
