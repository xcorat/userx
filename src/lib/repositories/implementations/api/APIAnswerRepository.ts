// API Answer Repository
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { PublicAnswer, CreateAnswerDTO } from '$lib/models';
import type { AnswerVisibility } from '$lib/models/types';
import { appConfig } from '$lib/config/app.config';

const API_BASE = appConfig.storage.apiBaseUrl || '/api';

export class APIAnswerRepository implements IAnswerRepository {
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		return response.json();
	}

	private parseAnswer(answer: any): PublicAnswer {
		return {
			...answer,
			answeredAt: new Date(answer.answeredAt)
		};
	}

	async findAll(): Promise<PublicAnswer[]> {
		const response = await fetch(`${API_BASE}/answers`);
		const answers = await this.handleResponse<any[]>(response);
		return answers.map(a => this.parseAnswer(a));
	}

	async findById(id: string): Promise<PublicAnswer | null> {
		const response = await fetch(`${API_BASE}/answers/${id}`);
		if (response.status === 404) return null;
		const answer = await this.handleResponse<any>(response);
		return this.parseAnswer(answer);
	}

	async findByUser(userId: string): Promise<PublicAnswer[]> {
		const response = await fetch(`${API_BASE}/answers?userId=${encodeURIComponent(userId)}`);
		const answers = await this.handleResponse<any[]>(response);
		return answers.map(a => this.parseAnswer(a));
	}

	async findByQuestion(questionId: string): Promise<PublicAnswer[]> {
		const response = await fetch(`${API_BASE}/answers?questionId=${encodeURIComponent(questionId)}`);
		const answers = await this.handleResponse<any[]>(response);
		return answers.map(a => this.parseAnswer(a));
	}

	async findPublicByQuestion(questionId: string): Promise<PublicAnswer[]> {
		const response = await fetch(`${API_BASE}/answers?questionId=${encodeURIComponent(questionId)}&publicOnly=true`);
		const answers = await this.handleResponse<any[]>(response);
		return answers.map(a => this.parseAnswer(a));
	}

	async findByUserAndQuestion(userId: string, questionId: string): Promise<PublicAnswer | null> {
		const response = await fetch(`${API_BASE}/answers?userId=${encodeURIComponent(userId)}&questionId=${encodeURIComponent(questionId)}`);
		const answers = await this.handleResponse<any[]>(response);
		return answers[0] ? this.parseAnswer(answers[0]) : null;
	}

	async create(data: CreateAnswerDTO): Promise<PublicAnswer> {
		const response = await fetch(`${API_BASE}/answers`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const answer = await this.handleResponse<any>(response);
		return this.parseAnswer(answer);
	}

	async updateVisibility(id: string, visibility: AnswerVisibility): Promise<PublicAnswer> {
		const response = await fetch(`${API_BASE}/answers/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ visibility })
		});
		const answer = await this.handleResponse<any>(response);
		return this.parseAnswer(answer);
	}

	async delete(id: string): Promise<void> {
		const response = await fetch(`${API_BASE}/answers/${id}`, {
			method: 'DELETE'
		});
		await this.handleResponse(response);
	}
}
