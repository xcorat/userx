// API User Repository
// Communicates with backend API routes via fetch
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';
import { appConfig } from '$lib/config/app.config';

const API_BASE = appConfig.storage.apiBaseUrl || '/api';

export class APIUserRepository implements IUserRepository {
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		return response.json();
	}

	private parseUser(user: any): User {
		console.log('Parsing user:', user);
		// Backwards compatible: ensure 'id' is present and set from publicKey if needed
		const id = user.id || user.publicKey ;
		const parsed: any = {
			...user,
			id,
			publicKey: user.publicKey || id,
			createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
		};

		// updatedAt is optional in some responses, only parse if present
		if (user.updatedAt) parsed.updatedAt = new Date(user.updatedAt);

		return parsed as User;
	}

	async findAll(): Promise<User[]> {
		const response = await fetch(`${API_BASE}/users`);
		const users = await this.handleResponse<any[]>(response);
		return users.map(u => this.parseUser(u));
	}

	async findById(publicKey: string): Promise<User | null> {
		const response = await fetch(`${API_BASE}/users/${encodeURIComponent(publicKey)}`);
		if (response.status === 404) return null;
		const user = await this.handleResponse<any>(response);
		return this.parseUser(user);
	}

	async findByEmail(email: string): Promise<User | null> {
		const response = await fetch(`${API_BASE}/users/email/${encodeURIComponent(email)}`);
		if (response.status === 404) return null;
		const user = await this.handleResponse<any>(response);
		return this.parseUser(user);
	}

	async findByUsername(username: string): Promise<User | null> {
		const response = await fetch(`${API_BASE}/users/username/${encodeURIComponent(username)}`);
		const result = await this.handleResponse<{ exists: boolean; user?: any }>(response);
		return result.user ? this.parseUser(result.user) : null;
	}

	async searchUsers(query: string): Promise<User[]> {
		if (!query.trim()) {
			return [];
		}
		const response = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
		const users = await this.handleResponse<any[]>(response);
		return users.map(u => this.parseUser(u));
	}

	async create(data: CreateUserDTO): Promise<User> {
		const response = await fetch(`${API_BASE}/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const user = await this.handleResponse<any>(response);
		return this.parseUser(user);
	}

	async update(publicKey: string, data: UpdateUserDTO): Promise<User> {
		const response = await fetch(`${API_BASE}/users/${encodeURIComponent(publicKey)}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const user = await this.handleResponse<any>(response);
		return this.parseUser(user);
	}

	async delete(publicKey: string): Promise<void> {
		const response = await fetch(`${API_BASE}/users/${encodeURIComponent(publicKey)}`, {
			method: 'DELETE'
		});
		await this.handleResponse(response);
	}

	async getEncryptedPrivateKey(publicKey: string): Promise<string | null> {
		const response = await fetch(`${API_BASE}/users/${encodeURIComponent(publicKey)}/keypair`);
		if (response.status === 404) return null;
		const result = await this.handleResponse<{ encryptedPrivateKey: string }>(response);
		return result.encryptedPrivateKey;
	}
}
