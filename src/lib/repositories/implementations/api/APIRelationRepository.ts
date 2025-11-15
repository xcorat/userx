// API Relation Repository
// Communicates with backend API routes via fetch
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';
import type { UserRelation, CreateRelationDTO, UpdateRelationDTO, RelationStatus } from '$lib/models';
import { appConfig } from '$lib/config/app.config';

const API_BASE = appConfig.storage.apiBaseUrl || '/api';

export class APIRelationRepository implements IRelationRepository {
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		return response.json();
	}

	private parseRelation(relation: any): UserRelation {
		return {
			...relation,
			createdAt: new Date(relation.createdAt),
			updatedAt: new Date(relation.updatedAt)
		};
	}

	async findAll(): Promise<UserRelation[]> {
		const response = await fetch(`${API_BASE}/relations`);
		const relations = await this.handleResponse<any[]>(response);
		return relations.map(r => this.parseRelation(r));
	}

	async findById(id: string): Promise<UserRelation | null> {
		const response = await fetch(`${API_BASE}/relations/${id}`);
		if (response.status === 404) return null;
		const relation = await this.handleResponse<any>(response);
		return this.parseRelation(relation);
	}

	async findByUsers(fromUserId: string, toUserId: string): Promise<UserRelation | null> {
		const response = await fetch(`${API_BASE}/relations/between/${fromUserId}/${toUserId}`);
		if (response.status === 404) return null;
		const relation = await this.handleResponse<any>(response);
		return this.parseRelation(relation);
	}

	async findByUserId(userId: string): Promise<UserRelation[]> {
		const response = await fetch(`${API_BASE}/relations/user/${userId}`);
		const relations = await this.handleResponse<any[]>(response);
		return relations.map(r => this.parseRelation(r));
	}

	async findByUserIdAndStatus(userId: string, status: RelationStatus): Promise<UserRelation[]> {
		const response = await fetch(`${API_BASE}/relations/user/${userId}/status/${status}`);
		const relations = await this.handleResponse<any[]>(response);
		return relations.map(r => this.parseRelation(r));
	}

	async create(data: CreateRelationDTO): Promise<UserRelation> {
		const response = await fetch(`${API_BASE}/relations`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const relation = await this.handleResponse<any>(response);
		return this.parseRelation(relation);
	}

	async update(id: string, data: UpdateRelationDTO): Promise<UserRelation> {
		const response = await fetch(`${API_BASE}/relations/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const relation = await this.handleResponse<any>(response);
		return this.parseRelation(relation);
	}

	async delete(id: string): Promise<void> {
		const response = await fetch(`${API_BASE}/relations/${id}`, {
			method: 'DELETE'
		});
		await this.handleResponse(response);
	}
}
