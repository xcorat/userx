// API DM Repository
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { DMQuestion, DMAnswer, CreateDMQuestionDTO, CreateDMAnswerDTO } from '$lib/models';
import { appConfig } from '$lib/config/app.config';

const API_BASE = appConfig.storage.apiBaseUrl || '/api';

export class APIDMRepository implements IDMRepository {
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		return response.json();
	}

	private parseDMQuestion(question: any): DMQuestion {
		return {
			...question,
			createdAt: new Date(question.createdAt)
		};
	}

	private parseDMAnswer(answer: any): DMAnswer {
		return {
			...answer,
			answeredAt: new Date(answer.answeredAt)
		};
	}

	// DM Questions
	async findQuestionById(id: string): Promise<DMQuestion | null> {
		const response = await fetch(`${API_BASE}/dm/questions/${id}`);
		if (response.status === 404) return null;
		const question = await this.handleResponse<any>(response);
		return this.parseDMQuestion(question);
	}

	async findQuestionsByRecipient(recipientId: string): Promise<DMQuestion[]> {
		const response = await fetch(`${API_BASE}/dm/questions?userId=${encodeURIComponent(recipientId)}&received=true`);
		const questions = await this.handleResponse<any[]>(response);
		return questions.map(q => this.parseDMQuestion(q));
	}

	async findQuestionsBySender(senderId: string): Promise<DMQuestion[]> {
		const response = await fetch(`${API_BASE}/dm/questions?userId=${encodeURIComponent(senderId)}&sent=true`);
		const questions = await this.handleResponse<any[]>(response);
		return questions.map(q => this.parseDMQuestion(q));
	}

	async createQuestion(data: CreateDMQuestionDTO): Promise<DMQuestion> {
		const response = await fetch(`${API_BASE}/dm/questions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const question = await this.handleResponse<any>(response);
		return this.parseDMQuestion(question);
	}

	async deleteQuestion(id: string): Promise<void> {
		const response = await fetch(`${API_BASE}/dm/questions/${id}`, {
			method: 'DELETE'
		});
		await this.handleResponse(response);
	}

	// DM Answers
	async findAnswerByQuestion(dmQuestionId: string): Promise<DMAnswer | null> {
		const response = await fetch(`${API_BASE}/dm/answers?questionId=${encodeURIComponent(dmQuestionId)}`);
		const answers = await this.handleResponse<any[]>(response);
		return answers[0] ? this.parseDMAnswer(answers[0]) : null;
	}

	async createAnswer(data: CreateDMAnswerDTO): Promise<DMAnswer> {
		const response = await fetch(`${API_BASE}/dm/answers`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const answer = await this.handleResponse<any>(response);
		return this.parseDMAnswer(answer);
	}

	async deleteAnswer(id: string): Promise<void> {
		const response = await fetch(`${API_BASE}/dm/answers/${id}`, {
			method: 'DELETE'
		});
		await this.handleResponse(response);
	}
}
