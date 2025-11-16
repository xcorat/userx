// Repository Factory
// Generic factory pattern for creating repository implementations based on storage type

import type { IUserRepository } from './interfaces/IUserRepository';
import type { IQuestionRepository } from './interfaces/IQuestionRepository';
import type { IAnswerRepository } from './interfaces/IAnswerRepository';
import type { IDMRepository } from './interfaces/IDMRepository';
import type { IMemeBallRepository } from './interfaces/IMemeBallRepository';
import type { IRelationRepository } from './interfaces/IRelationRepository';

import {
	MockUserRepository,
	MockQuestionRepository,
	MockAnswerRepository,
	MockDMRepository,
	MockMemeBallRepository,
	MockRelationRepository
} from './implementations/mock';

import {
	APIUserRepository,
	APIQuestionRepository,
	APIAnswerRepository,
	APIDMRepository,
	APIMemeBallRepository,
	APIRelationRepository
} from './implementations/api';

import { appConfig } from '$lib/config/app.config';

type StorageType = 'mock' | 'sqlite' | 'api';

/**
 * Repository Factory
 * Creates repository instances based on configured storage type
 */
export class RepositoryFactory {
	private static storageType: StorageType = appConfig.storage.type;

	/**
	 * Override the storage type (useful for testing)
	 */
	static setStorageType(type: StorageType): void {
		this.storageType = type;
	}

	/**
	 * Get the current storage type
	 */
	static getStorageType(): StorageType {
		return this.storageType;
	}

	/**
	 * Create User Repository
	 */
	static createUserRepository(): IUserRepository {
		switch (this.storageType) {
			case 'sqlite':
				throw new Error('SQLite repositories must be used server-side only. Use API storage type for client-side access.');
			case 'mock':
				return new MockUserRepository();
			case 'api':
				return new APIUserRepository();
			default:
				throw new Error(`Unknown storage type: ${this.storageType}`);
		}
	}

	/**
	 * Create Question Repository
	 */
	static createQuestionRepository(): IQuestionRepository {
		switch (this.storageType) {
			case 'sqlite':
				throw new Error('SQLite repositories must be used server-side only. Use API storage type for client-side access.');
			case 'mock':
				return new MockQuestionRepository();
			case 'api':
				return new APIQuestionRepository();
			default:
				throw new Error(`Unknown storage type: ${this.storageType}`);
		}
	}

	/**
	 * Create Answer Repository
	 */
	static createAnswerRepository(): IAnswerRepository {
		switch (this.storageType) {
			case 'sqlite':
				throw new Error('SQLite repositories must be used server-side only. Use API storage type for client-side access.');
			case 'mock':
				return new MockAnswerRepository();
			case 'api':
				return new APIAnswerRepository();
			default:
				throw new Error(`Unknown storage type: ${this.storageType}`);
		}
	}

	/**
	 * Create DM Repository
	 */
	static createDMRepository(): IDMRepository {
		switch (this.storageType) {
			case 'sqlite':
				throw new Error('SQLite repositories must be used server-side only. Use API storage type for client-side access.');
			case 'mock':
				return new MockDMRepository();
			case 'api':
				return new APIDMRepository();
			default:
				throw new Error(`Unknown storage type: ${this.storageType}`);
		}
	}

	/**
	 * Create MemeBall Repository
	 */
	static createMemeBallRepository(): IMemeBallRepository {
		switch (this.storageType) {
			case 'sqlite':
				throw new Error('SQLite repositories must be used server-side only. Use API storage type for client-side access.');
			case 'mock':
				return new MockMemeBallRepository();
			case 'api':
				return new APIMemeBallRepository();
			default:
				throw new Error(`Unknown storage type: ${this.storageType}`);
		}
	}

	/**
	 * Create Relation Repository
	 */
	static createRelationRepository(): IRelationRepository {
		switch (this.storageType) {
			case 'sqlite':
				throw new Error('SQLite repositories must be used server-side only. Use API storage type for client-side access.');
			case 'mock':
				return new MockRelationRepository();
			case 'api':
				return new APIRelationRepository();
			default:
				throw new Error(`Unknown storage type: ${this.storageType}`);
		}
	}
}
